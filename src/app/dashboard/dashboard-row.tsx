"use client";

import { useState } from "react";
import { Search, Loader2, ChevronDown, ChevronUp, BriefcaseBusiness, Globe, Link2, MapPin, Mail, Phone, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DashboardRow({ person }: { person: any }) {
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [scrapeError, setScrapeError] = useState("");
  const router = useRouter();

  const handleScrape = async () => {
    setLoading(true);
    setScrapeError("");
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: person.id })
      });
      if (!res.ok) {
        const data = await res.json();
        setScrapeError(data.error);
        return;
      }
      router.refresh();
      // Auto expand to show results
      setExpanded(true);
    } catch (err: any) {
      setScrapeError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const [deleting, setDeleting] = useState(false);
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Hapus permanen profil "${person.nama_lulusan}"?`)) return;
    
    setDeleting(true);
    try {
      const res = await fetch(`/api/alumni/${person.id}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      } else {
        alert("Gagal menghapus data.");
      }
    } catch {
      alert("Terjadi kesalahan jaringan batal menghapus data.");
    } finally {
      setDeleting(false);
    }
  };

  const hasData = person.status_pelacakan === "Profil Ditemukan" || person.linkedin_url || person.nama_perusahaan || person.email || person.ig_url;

  return (
    <>
      <tr className={`hover:bg-white/5 transition-colors cursor-pointer ${expanded ? 'bg-white/[0.02]' : ''}`} onClick={() => setExpanded(!expanded)}>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <div className="h-10 w-10 flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-blue-500/20 border border-blue-500/30 flex justify-center items-center font-bold text-blue-400">
                {person.nama_lulusan?.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-slate-100">{person.nama_lulusan}</div>
              <div className="text-xs text-slate-400 font-mono tracking-wide">{person.nim}</div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-slate-200">{person.program_studi}</div>
          <div className="text-xs text-slate-400">{person.fakultas} <span className="opacity-50">•</span> Angkatan {person.tahun_masuk}</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-slate-200">
            {person.tanggal_lulus ? new Date(person.tanggal_lulus).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : "-"}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          {person.status_pelacakan === "Profil Ditemukan" || hasData ? (
             <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-500/20 text-green-400 border border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]">Profil Ditemukan</span>
          ) : person.status_pelacakan === "Tidak Ditemukan" ? (
             <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-500/10 text-red-400 border border-red-500/20">Tidak Ditemukan</span>
          ) : (
             <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-700/50 text-slate-400 border border-slate-600/50">Belum Dilacak</span>
          )}
        </td>
        <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
          <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
            <button 
              onClick={handleScrape}
              disabled={loading}
              className={`flex items-center gap-1.5 transition-colors px-3 py-1.5 rounded-lg border text-xs font-semibold ${loading ? 'bg-slate-800 text-slate-500 border-slate-700' : 'bg-emerald-500/10 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 border-emerald-500/20'} min-w-[80px] justify-center`}
              title="Lacak Profil Otomatis di Internet"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} 
              {loading ? "Menyinkron..." : "Lacak"}
            </button>

            <button 
              onClick={handleDelete}
              disabled={deleting}
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg border border-transparent hover:border-red-500/20 transition-all disabled:opacity-50"
              title="Hapus Profil Alumni"
            >
              {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} 
            </button>

            <button 
              onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
              className={`p-1.5 rounded-lg border transition-all ${expanded ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_12px_rgba(37,99,235,0.5)] ring-2 ring-blue-500/20' : 'bg-slate-800 border-white/5 text-slate-400 hover:text-slate-200 hover:bg-slate-700'}`}
              title={expanded ? "Tutup Panel" : "Buka Rincian"}
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />} 
            </button>
          </div>
        </td>
      </tr>

      {/* Accordion Expandable Row */}
      {expanded && (
        <tr className="bg-slate-900/80 shadow-inner">
          <td colSpan={5} className="p-0 border-b border-white/10">
            <div className="p-6 md:p-8 animate-in slide-in-from-top-2 duration-300 fade-in border-t-2 border-blue-500/40 border-dashed">
              <div className="flex items-center gap-2 mb-6">
                 <Globe className="text-blue-400" size={18} />
                 <h3 className="text-lg font-bold text-white tracking-tight">Ruang Intelijen (OSINT)</h3>
                 <span className="text-xs text-slate-500 ml-2 border border-slate-600 px-2 py-0.5 rounded-full">ID Ref: {person.id.substring(0,8)}</span>
              </div>
              
              {scrapeError && (
                <div className="mb-6 bg-red-900/20 text-red-300 p-4 rounded-xl border border-red-500/20 text-sm">
                  {scrapeError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Panel Karir */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-[11px] font-bold text-slate-400 tracking-wider flex items-center gap-2 uppercase">
                    <BriefcaseBusiness size={14} /> Riwayat Pekerjaan
                  </h4>
                  {person.nama_perusahaan || person.posisi ? (
                    <div className="bg-slate-800/80 border border-white/5 rounded-xl p-4 shadow-lg hover:border-white/10 transition-colors h-full flex flex-col">
                      <h4 className="text-[15px] font-bold text-white mb-0.5">{person.posisi || "Posisi Tidak Diketahui"}</h4>
                      <p className="text-sm text-slate-300 mb-1">{person.nama_perusahaan || "Perusahaan Tidak Diketahui"} • {person.kategori_pekerjaan || "Kategori Umum"}</p>
                      
                      <div className="mt-auto pt-4 flex items-center justify-between">
                         <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold rounded-full">
                           Terkonfirmasi Valid
                         </span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-800/40 border border-white/5 rounded-xl p-4 text-sm text-slate-400 text-center flex flex-col items-center justify-center h-full min-h-[120px] shadow-inner">
                      Belum ada rekam jejak karir publik.
                    </div>
                  )}
                </div>

                {/* Panel Social Links */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-[11px] font-bold text-slate-400 tracking-wider flex items-center gap-2 uppercase">
                    <Link2 size={14} /> Tautan Jejaring
                  </h4>
                  <div className="bg-slate-800/80 border border-white/5 rounded-xl p-4 shadow-lg flex flex-col gap-3 h-full">
                     {["linkedin", "ig", "fb", "tiktok"].map((key) => {
                        const val = person[`${key}_url`];
                        if (!val) return null;
                        return (
                          <div key={key} className="flex flex-col gap-0.5 border-b border-white/5 pb-2 last:border-0 last:pb-0">
                            <span className="text-[10px] font-bold text-blue-400/80 uppercase tracking-wider">
                              {key === "ig" ? "Instagram" : key === "fb" ? "Facebook" : key}
                            </span>
                            <a href={val} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-200 font-medium whitespace-normal break-all hover:text-blue-400 transition-colors line-clamp-1 block">
                              {val.replace('https://', '').replace('www.', '')}
                            </a>
                          </div>
                        )
                     })}
                     {!person.linkedin_url && !person.ig_url && !person.fb_url && !person.tiktok_url && (
                        <div className="text-slate-400 text-sm text-center my-auto">
                          Identitas digital tidak ditemukan.
                        </div>
                     )}
                  </div>
                </div>

                {/* Panel Kontak */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-[11px] font-bold text-slate-400 tracking-wider flex items-center gap-2 uppercase">
                    <MapPin size={14} /> Informasi Kontak
                  </h4>
                  <div className="bg-slate-800/80 border border-white/5 rounded-xl p-4 shadow-lg flex flex-col gap-4 h-full">
                     {person.email ? (
                       <div className="flex items-start gap-3">
                          <div className="bg-indigo-500/20 p-2 rounded-lg text-indigo-400"><Mail size={16}/></div>
                          <div>
                            <div className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Pesan Elektronik</div>
                            <div className="text-sm text-white font-medium break-all">{person.email}</div>
                          </div>
                       </div>
                     ) : null}
                     
                     {person.no_hp ? (
                       <div className="flex items-start gap-3">
                          <div className="bg-emerald-500/20 p-2 rounded-lg text-emerald-400"><Phone size={16}/></div>
                          <div>
                            <div className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Telepon Langsung</div>
                            <div className="text-sm text-white font-medium break-all">{person.no_hp}</div>
                          </div>
                       </div>
                     ) : null}

                     {!person.email && !person.no_hp && (
                        <div className="text-slate-400 text-sm text-center my-auto">
                          Tidak mendeteksi jejak surel atau nomor telepon.
                        </div>
                     )}
                  </div>
                </div>

              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
