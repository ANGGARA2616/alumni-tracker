import datetime
from sqlalchemy.orm import Session
import models
from database import SessionLocal
import requests

def generate_search_query(name: str, affiliation: str):
    # Kueri: "Nama" "Kampus" agar lebih spesifik 
    return f'"{name}" "{affiliation}"'

def fetch_from_sources(query: str):
    from googlesearch import search
    
    results = []
    try:
        # Memanggil googlesearch dengan advanced=True untuk mengambil meta title & description snippet
        for r in search(query, num_results=5, advanced=True):
            results.append({
                "source": "Google Search",
                "profile_url": getattr(r, 'url', ''),
                "extracted_title": getattr(r, 'title', ''),
                "extracted_snippet": getattr(r, 'description', '')
            })
    except requests.exceptions.HTTPError as e:
        if "429" in str(e) or e.response.status_code == 429:
            raise Exception("HTTP 429")
        raise e
    except Exception as e:
        if "429" in str(e):
            raise Exception("HTTP 429")
        raise e
        
    return results

def disambiguate_profile(profile_data: dict, target_name: str, target_affiliation: str, target_prodi: str):
    score = 0
    snippet = profile_data.get("extracted_snippet", "").lower()
    title = profile_data.get("extracted_title", "").lower()
    
    combined_text = f"{title} {snippet}"
    
    # 1. Cek Kemiripan Nama di Title atau Snippet
    name_parts = target_name.lower().split()
    matched_names = sum(1 for part in name_parts if part in combined_text)
    if matched_names == len(name_parts):
        score += 40
    elif matched_names > 0:
         score += 20
         
    # 2. Cek Kemiripan Kampus
    if target_affiliation.lower() in combined_text:
        score += 30
        
    # 3. Cek Kemiripan Prodi atau Fakultas (jika ada)
    if target_prodi and target_prodi.lower() in combined_text:
        score += 20
        
    if "linkedin.com" in profile_data["profile_url"].lower():
        score += 10 # Extra point untuk LinkedIn karena relevan dengan profil karir

    # Penentuan Status
    if score >= 70:
        status = "Kemungkinan Kuat"
    elif score >= 40:
        status = "Perlu Verifikasi Manual"
    else:
        status = "Tidak Cocok"
        
    return score, status

def track_alumni(alumni_id: int):
    db: Session = SessionLocal()
    try:
        alumni = db.query(models.Alumni).filter(models.Alumni.id == alumni_id).first()
        if not alumni or alumni.opt_out:
            return
            
        query = generate_search_query(alumni.name, alumni.singkatan_kampus or alumni.nama_kampus)
        
        try:
            search_results = fetch_from_sources(query)
        except Exception as e:
            if str(e) == "HTTP 429":
                alumni.status = "Gagal/Error"
                alumni.last_updated = datetime.datetime.now()
                db.commit()
                return {"status": "Gagal/Error", "skor_confidence": 0, "error": "Terlalu banyak request (Limit Pencarian Google/HTTP 429)"}
            raise e
            
        if not search_results:
             alumni.status = "Belum Ditemukan"
             alumni.last_updated = datetime.datetime.now()
             db.commit()
             return {"status": "Belum Ditemukan", "skor_confidence": 0}
        
        best_score = 0
        evidence_id = None
        
        for res in search_results:
             score, status = disambiguate_profile(res, alumni.name, alumni.singkatan_kampus or alumni.nama_kampus, alumni.program)
             res["confidence_score"] = score
             res["status"] = status
             
             if score > best_score:
                  best_score = score
             
             # Database insertion
             db_result = models.TrackingResult(
                 alumni_id=alumni.id,
                 source=res["source"],
                 profile_url=res["profile_url"],
                 extracted_name=str(res["extracted_title"])[:255],  # Simpan title sebagai nama extracted
                 extracted_affiliation=str(res["extracted_snippet"])[:255], # Simpan snippet sebagai informasi afiliasi
                 confidence_score=res["confidence_score"],
                 status=res["status"]
             )
             db.add(db_result)
             db.flush()
             
             if score == best_score:
                 evidence_id = db_result.id
                 
        db.commit()
             
        if best_score >= 70:
            alumni.status = "Kemungkinan Kuat"
        elif best_score >= 40:
            alumni.status = "Perlu Verifikasi Manual"
        else:
            alumni.status = "Tidak Cocok"
             
        alumni.last_updated = datetime.datetime.now()
        db.commit()
        db.refresh(alumni)
        
        return {
            "status": alumni.status, 
            "skor_confidence": best_score, 
            "evidence_id": evidence_id
        }

    except Exception as e:
        print(f"Error tracking alumni {alumni_id}: {e}")
        db.rollback()
        
        try:
            alumni.status = "Gagal/Error"
            db.commit()
        except:
            pass
            
        return {"error": str(e), "status": "Gagal/Error", "skor_confidence": 0}
    finally:
        db.close()
