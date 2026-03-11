from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, status

from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List
from contextlib import asynccontextmanager

import models, schemas
from database import engine, get_db
from services import scheduler, tracking_logic


models.Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    if "VERCEL" not in os.environ:
        scheduler.start_scheduler()
    yield
    if "VERCEL" not in os.environ:
        scheduler.shutdown_scheduler()

app = FastAPI(title="Sistem Pelacakan Alumni", lifespan=lifespan)

import os

# Gunakan jalur relatif yang aman untuk Vercel / serverless
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")

# Pastikan folder static ada jika berjalan di lokal
if not os.path.exists(STATIC_DIR) and "VERCEL" not in os.environ:
    os.makedirs(STATIC_DIR, exist_ok=True)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/", response_class=HTMLResponse)
async def read_index():
    index_path = os.path.join(STATIC_DIR, "index.html")
    with open(index_path, "r", encoding="utf-8") as f:
        return f.read()

@app.post("/api/alumni/", response_model=schemas.Alumni, status_code=status.HTTP_201_CREATED)
def create_alumni(alumni: schemas.AlumniCreate, db: Session = Depends(get_db)):
    db_alumni = models.Alumni(**alumni.model_dump())
    db.add(db_alumni)
    db.commit()
    db.refresh(db_alumni)
    return db_alumni

@app.get("/api/alumni/", response_model=List[schemas.Alumni])
def read_alumni(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    alumni = db.query(models.Alumni).offset(skip).limit(limit).all()
    return alumni

@app.put("/api/alumni/{alumni_id}/opt_out", response_model=schemas.Alumni)
def update_opt_out(alumni_id: int, opt_out: schemas.AlumniUpdate, db: Session = Depends(get_db)):
    db_alumni = db.query(models.Alumni).filter(models.Alumni.id == alumni_id).first()
    if not db_alumni:
        raise HTTPException(status_code=404, detail="Alumni not found")
    if opt_out.opt_out is not None:
        db_alumni.opt_out = opt_out.opt_out
    db.commit()
    db.refresh(db_alumni)
    return db_alumni

@app.delete("/api/alumni/{alumni_id}")
def delete_alumni(alumni_id: int, db: Session = Depends(get_db)):
    db_alumni = db.query(models.Alumni).filter(models.Alumni.id == alumni_id).first()
    if not db_alumni:
        raise HTTPException(status_code=404, detail="Alumni not found")
    # Delete related tracking results first
    db.query(models.TrackingResult).filter(models.TrackingResult.alumni_id == alumni_id).delete()
    db.delete(db_alumni)
    db.commit()
    return {"message": "Alumni deleted successfully"}

@app.delete("/api/alumni_all")
def delete_all_alumni(db: Session = Depends(get_db)):
    db.query(models.TrackingResult).delete()
    db.query(models.Alumni).delete()
    db.commit()
    return {"message": "All alumni and tracking records deleted successfully"}

@app.get("/api/alumni/{alumni_id}/results", response_model=List[schemas.Result])
def get_alumni_results(alumni_id: int, db: Session = Depends(get_db)):
    results = db.query(models.TrackingResult).filter(models.TrackingResult.alumni_id == alumni_id).all()
    return results

@app.put("/api/alumni/{alumni_id}/status")
def update_alumni_status(alumni_id: int, payload: dict, db: Session = Depends(get_db)):
    db_alumni = db.query(models.Alumni).filter(models.Alumni.id == alumni_id).first()
    if not db_alumni:
        raise HTTPException(status_code=404, detail="Alumni not found")
    new_status = payload.get("status")
    if new_status in ["Kemungkinan Kuat", "Tidak Cocok", "Perlu Verifikasi Manual"]:
        db_alumni.status = new_status
        db.commit()
        return {"message": "Status updated successfully", "status": new_status}
    raise HTTPException(status_code=400, detail="Invalid status")

@app.post("/api/trigger_tracking/{alumni_id}")
async def trigger_tracking(alumni_id: int, db: Session = Depends(get_db)):
    db_alumni = db.query(models.Alumni).filter(models.Alumni.id == alumni_id).first()
    if not db_alumni:
        raise HTTPException(status_code=404, detail="Alumni not found")
    if db_alumni.opt_out:
        raise HTTPException(status_code=400, detail="Alumni has opt-out enabled and tracking is not permitted")
    
    res = tracking_logic.track_alumni(db_alumni.id)
    return res

@app.post("/api/trigger_tracking_all")
async def trigger_tracking_all(db: Session = Depends(get_db)):
    import datetime
    six_months_ago = datetime.datetime.now() - datetime.timedelta(days=180)
    alumni_list = db.query(models.Alumni).all()
    
    processed_count = 0
    skipped_opt_out_count = 0
    errors = []
    
    for alumni in alumni_list:
        if alumni.opt_out:
            skipped_opt_out_count += 1
            continue
            
        should_track = (
            alumni.status == "Belum Dilacak" or 
            alumni.status == "Perlu Verifikasi Manual" or 
            (alumni.last_updated and alumni.last_updated < six_months_ago)
        )
        
        if should_track:
            res = tracking_logic.track_alumni(alumni.id)
            if res and res.get("error"):
                errors.append({"alumni_id": alumni.id, "error": res["error"]})
            else:
                processed_count += 1
                
    if processed_count == 0 and skipped_opt_out_count == 0:
         return {
             "processed_count": 0,
             "skipped_opt_out_count": 0,
             "errors": [],
             "message": "No eligible alumni found for tracking"
         }
         
    return {
        "processed_count": processed_count,
        "skipped_opt_out_count": skipped_opt_out_count,
        "errors": errors
    }

