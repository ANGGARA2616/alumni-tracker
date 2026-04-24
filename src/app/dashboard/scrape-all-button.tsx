"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, X, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { toast } from "sonner";

export default function ScrapeAllButton() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalToProcess, setTotalToProcess] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [results, setResults] = useState<{ id: string; status: string; detail: string }[]>([]);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleScrapeAll = async () => {
    if (!confirm(`Tindakan massal ini akan mengambil 250 data 'Belum Dilacak' dan melacaknya secara otomatis. Lanjutkan?`)) {
      return;
    }

    setLoading(true);
    setShowModal(true);
    setResults([]);
    setProgress(0);

    try {
      // 1. Dapatkan 250 Target ID dari Server
      const fetchReq = await fetch("/api/get-untracked-ids?limit=250");
      const fetchRes = await fetchReq.json();

      if (!fetchRes.success || !fetchRes.ids || fetchRes.ids.length === 0) {
        toast.info("Yey! Semua data di database sudah terlacak.");
        setLoading(false);
        return;
      }

      const targetIds: string[] = fetchRes.ids;
      setTotalToProcess(targetIds.length);
      const tempResults: typeof results = [];

      // Proses 1 per 1 dengan jeda 3 detik (DDG HTML anti-limit)
      for (let i = 0; i < targetIds.length; i++) {
         const id = targetIds[i];
         try {
             const res = await fetch("/api/scrape", {
                 method: "POST",
                 headers: { "Content-Type": "application/json" },
                 body: JSON.stringify({ id })
             });
             const data = await res.json();
             
             if (!res.ok) {
                 tempResults.push({ id, status: 'gagal', detail: data.error || 'Server error' });
             } else {
                 tempResults.push({ id, status: 'sukses', detail: data.message });
             }
         } catch (err: any) {
             tempResults.push({ id, status: 'gagal', detail: err.message });
         }
         
         setProgress(i + 1);
         setResults([...tempResults]);

         // Jeda 1.5 detik antar alumni
         if (i < targetIds.length - 1) {
             await new Promise(r => setTimeout(r, 1500));
         }
      }

    } catch (err: any) {
       toast.error("Terjadi masalah saat mengatur pelacakan massal: " + err.message);
    } finally {
       setLoading(false);
       router.refresh(); 
    }
  };

  return (
    <>
      <button 
        onClick={handleScrapeAll}
        disabled={loading}
        className="bg-indigo-600 hover:bg-indigo-500 hover:-translate-y-0.5 transition-all text-white px-5 py-3 rounded-lg text-sm font-medium flex items-center gap-2 shadow-[0_4px_14px_rgba(79,70,229,0.39)] disabled:opacity-50 disabled:hover:translate-y-0"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
        {loading ? `Memproses (${progress}/${totalToProcess})...` : "Mulai Pelacakan Massal"}
      </button>

      {mounted && showModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex justify-end bg-black/60 backdrop-blur-sm transition-all duration-300">
          <div className="bg-slate-900 border-l border-slate-700 h-full p-6 shadow-2xl max-w-md w-full relative animate-in slide-in-from-right duration-300 flex flex-col">
            {!loading && (
                <button 
                  onClick={() => setShowModal(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-full z-10"
                >
                  <X size={20} />
                </button>
            )}
            
            <div className="flex items-center gap-3 mb-6 mt-2">
              <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                <Search className="text-indigo-400" size={20} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  Pelacakan Massal
                </h3>
                {/* Teks Native Node dihapus */}
              </div>
            </div>
            
            <p className="text-sm text-slate-300 mb-4 pb-4 border-b border-white/10">
              {loading 
                ? `Memproses batch data. Target selesai: ${progress} / ${totalToProcess} ID ...`
                : `Selesai siklus massal! ${progress} data telah diverifikasi.`}
            </p>

            <div className="bg-slate-950 rounded-lg p-1 border border-white/5 flex-grow mb-4 overflow-hidden flex flex-col shadow-inner">
                {/* Progress Bar */}
                {totalToProcess > 0 && (
                   <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden mb-3 flex-shrink-0">
                       <div 
                           className="h-full bg-indigo-500 transition-all duration-300 ease-out"
                           style={{ width: `${(progress / totalToProcess) * 100}%` }}
                       />
                   </div>
                )}
                
                {/* Log Terminal Buatan */}
                <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-2 font-mono text-[11px] custom-scrollbar">
                    {results.map((r, idx) => (
                        <div key={idx} className={`flex items-start gap-2 ${r.status === 'sukses' ? 'text-green-400' : 'text-red-400'}`}>
                            <span>{r.status === 'sukses' ? '[OK]' : '[ERR]'}</span>
                            <span className="text-slate-300 w-16 flex-shrink-0">{r.id.substring(0,5)}...</span>
                            <span className="text-slate-400 truncate">{r.detail}</span>
                        </div>
                    ))}
                    {loading && (
                        <div className="text-slate-500 flex items-center gap-2 mt-2">
                            <Loader2 size={12} className="animate-spin" /> Memproses pelacakan...
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-auto flex flex-col gap-3 pt-4 border-t border-white/10">
              <button 
                onClick={() => setShowModal(false)}
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(79,70,229,0.2)]"
              >
                {loading ? "Mode Terkunci (Mengamankan Koneksi)" : "Tutup Panel Pelacakan"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
