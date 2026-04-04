"use client";

import { useState } from "react";
import { Search, Loader2, X, CheckCircle, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ScrapeButton({ person }: { person: any }) {
  const [loading, setLoading] = useState(false);
  const [modalData, setModalData] = useState<any>(null);
  const [modalType, setModalType] = useState<"success"|"error"|null>(null);
  const [activeTab, setActiveTab] = useState("LinkedIn");
  const router = useRouter();

  const handleScrape = async () => {
    setLoading(true);
    setModalData(null);
    setModalType(null);

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: person.id })
      });
      const data = await res.json();
      
      if (!res.ok) {
        setModalType("error");
        setModalData({ message: data.error });
      } else {
        setModalType("success");
        setModalData({ message: data.message, extracted: data.data });
        router.refresh(); 
      }
    } catch (err: any) {
      setModalType("error");
      setModalData({ message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        <button 
          onClick={handleScrape}
          disabled={loading}
          className="text-green-400 hover:text-green-300 flex items-center gap-1 transition-colors disabled:opacity-50 text-xs font-semibold bg-green-500/10 px-3 py-1.5 rounded border border-green-500/20 w-fit"
          title="Lacak Profil Otomatis di Internet"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} 
          {loading ? "Melacak..." : "Lacak"}
        </button>

        <button 
          onClick={() => {
            setModalData({ extracted: person, message: "Data termuat dari database lokal." });
            setModalType("success");
          }}
          className="text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors text-xs font-semibold bg-blue-500/10 px-3 py-1.5 rounded border border-blue-500/20 w-fit"
          title="Buka Panel Laci Profil"
        >
          Lihat Profil
        </button>
      </div>

      {modalType && (
        <div className="fixed inset-[0] z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-all duration-300 overflow-hidden">
          <div className="bg-slate-900 border-l border-white/10 h-full max-h-screen shadow-2xl max-w-md w-full relative animate-in slide-in-from-right duration-300 flex flex-col font-sans">
            <button 
              onClick={() => setModalType(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-2 z-10"
            >
              <X size={20} />
            </button>
            
            {/* Header Identity */}
            <div className="flex items-center gap-4 px-6 pt-6 pb-4 border-b border-white/10">
              <div className="h-14 w-14 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xl flex-shrink-0">
                {person.nama_lulusan?.substring(0,2).toUpperCase() || "AR"}
              </div>
              <div className="flex-1 pr-6">
                <h2 className="text-lg font-bold text-white leading-tight">{person.nama_lulusan}</h2>
                <p className="text-[13px] text-slate-400 mt-0.5">{person.program_studi} • {person.tahun_masuk}</p>
              </div>
            </div>

            {/* Simulated Tabs */}
            <div className="flex px-6 border-b border-white/10">
              <button 
                onClick={() => setActiveTab("LinkedIn")}
                className={`py-3 text-[13px] font-semibold transition-colors mr-8 ${activeTab === "LinkedIn" ? "text-blue-500 border-b-2 border-blue-500" : "text-slate-400 hover:text-slate-300"}`}
              >
                LinkedIn
              </button>
              <button 
                onClick={() => setActiveTab("Kontak")}
                className={`py-3 text-[13px] font-semibold transition-colors mr-8 ${activeTab === "Kontak" ? "text-blue-500 border-b-2 border-blue-500" : "text-slate-400 hover:text-slate-300"}`}
              >
                Kontak Khusus
              </button>
              <button 
                onClick={() => setActiveTab("Sistem")}
                className={`py-3 text-[13px] font-semibold transition-colors ${activeTab === "Sistem" ? "text-blue-500 border-b-2 border-blue-500" : "text-slate-400 hover:text-slate-300"}`}
              >
                Status Skrap
              </button>
            </div>

            {/* Scrollable Content Container */}
            <div className="flex-grow overflow-y-auto overflow-x-hidden p-6 custom-scrollbar">
              {modalType === "success" && modalData.extracted && Object.keys(modalData.extracted).length > 0 ? (
                <div className="w-full">
                  {/* Grid Status (Mimicking exactly 3 square grids) */}
                  <div className="grid grid-cols-3 gap-3 mb-8 w-full">
                    <div className="bg-slate-800/80 border border-white/5 p-3 sm:p-4 rounded-xl overflow-hidden">
                      <div className="text-2xl font-bold text-white">{modalData.extracted.nama_perusahaan ? "1" : "0"}</div>
                      <div className="text-[10px] sm:text-xs text-slate-400 mt-1.5 leading-snug break-words pr-1">Pengalaman kerja</div>
                    </div>
                    <div className="bg-slate-800/80 border border-white/5 p-3 sm:p-4 rounded-xl overflow-hidden">
                      <div className="text-2xl font-bold text-white">{modalData.extracted.kategori_pekerjaan ? "1" : "0"}</div>
                      <div className="text-[10px] sm:text-xs text-slate-400 mt-1.5 leading-snug break-words pr-1">Total posisi valid</div>
                    </div>
                    <div className="bg-slate-800/80 border border-white/5 p-3 sm:p-4 rounded-xl overflow-hidden">
                      <div className="text-2xl font-bold text-white">{[modalData.extracted.linkedin_url, modalData.extracted.ig_url, modalData.extracted.email, modalData.extracted.no_hp].filter(Boolean).length}</div>
                      <div className="text-[10px] sm:text-xs text-slate-400 mt-1.5 leading-snug break-words pr-1">Kontak & Sosmed</div>
                    </div>
                  </div>

                  {activeTab === "LinkedIn" && (
                    <div className="w-full">
                      <h4 className="text-[11px] font-bold text-slate-400 tracking-wider mb-3">INFORMASI KARIR (OSINT)</h4>
                      {modalData.extracted.nama_perusahaan || modalData.extracted.posisi ? (
                        <div className="bg-slate-800/80 border border-white/5 rounded-xl p-4 mb-4">
                          <h4 className="text-[15px] font-bold text-white mb-0.5">{modalData.extracted.posisi || "Posisi Tidak Diketahui"}</h4>
                          <p className="text-sm text-slate-300 mb-1">{modalData.extracted.nama_perusahaan || "Perusahaan Tidak Diketahui"} • {modalData.extracted.kategori_pekerjaan || "Kategori Umum"}</p>
                          <p className="text-xs text-slate-500 mb-3">Diperbarui via Pelacakan {new Date().getFullYear()}</p>
                          <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold rounded-full">
                            Hasil Scraping Net
                          </span>
                        </div>
                      ) : (
                        <div className="bg-slate-800/80 border border-white/5 rounded-xl p-4 text-sm text-slate-400 mb-6">Belum ada jejak karir yang terkonfirmasi publik.</div>
                      )}

                      <h4 className="text-[11px] font-bold text-slate-400 tracking-wider mb-3 mt-8">PAUTAN SOSIAL (URL)</h4>
                      <div className="space-y-3 w-full">
                        {["linkedin_url", "ig_url", "fb_url", "tiktok_url"].map((key) => {
                          const val = modalData.extracted[key];
                          if (!val) return null;
                          return (
                            <div key={key} className="bg-slate-800/80 border border-white/5 rounded-xl p-3 w-full overflow-hidden">
                              <span className="block text-[11px] font-bold text-blue-400/80 mb-1 uppercase tracking-wider">
                                {key.replace(/_url/g, "")}
                              </span>
                              <a href={val} target="_blank" rel="noopener noreferrer" className="block text-sm text-slate-200 font-medium whitespace-normal break-all hover:text-blue-400 transition-colors line-clamp-2">
                                {val}
                              </a>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {activeTab === "Kontak" && (
                    <div className="w-full">
                      <h4 className="text-[11px] font-bold text-slate-400 tracking-wider mb-3">INFORMASI KONTAK (DARI WEB)</h4>
                      <div className="space-y-3 w-full">
                        {["email", "no_hp"].map((key) => {
                          const val = modalData.extracted[key];
                          if (!val) return null;
                          return (
                            <div key={key} className="bg-slate-800/80 border border-white/5 rounded-xl p-4 w-full">
                              <span className="block text-[11px] font-bold text-blue-400/80 mb-1 uppercase tracking-wider">
                                {key.replace(/_/g, " ")}
                              </span>
                              <span className="block text-sm text-slate-100 font-medium whitespace-normal break-all line-clamp-2">
                                {val}
                              </span>
                            </div>
                          )
                        })}
                        {!modalData.extracted.email && !modalData.extracted.no_hp && (
                          <div className="text-slate-400 text-sm">Tidak ada kontak email atau nomor hp yang ditemukan secara publik.</div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === "Sistem" && (
                    <div className="bg-emerald-900/20 text-emerald-400 border border-emerald-800/30 p-4 rounded-xl text-sm w-full">
                      Pencarian berhasil menembus filter dan mengekstrak data JSON.
                      <p className="mt-2 text-xs opacity-75 whitespace-normal break-words">{modalData.message}</p>
                    </div>
                  )}
                </div>
              ) : modalType === "success" && (
                  <div className="bg-amber-900/20 text-amber-300 p-4 rounded-xl border border-amber-500/20 text-sm mt-8">
                    Tidak ada satupun informasi web yang cocok dengan alumnus ini.
                  </div>
              )}
              
              {modalType === "error" && (
                  <div className="bg-red-900/20 text-red-300 p-4 rounded-xl border border-red-500/20 text-sm mt-8">
                    {modalData.message}
                  </div>
              )}
            </div>

            <div className="mt-auto flex justify-end pt-4 border-t border-white/10">
              <button 
                onClick={() => setModalType(null)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Tutup Panel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
