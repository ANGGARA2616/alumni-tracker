"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, X, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { toast } from "sonner";

export default function ScrapeAllButton({ alumniIds }: { alumniIds: string[] }) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [results, setResults] = useState<{ id: string; status: string; detail: string }[]>([]);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleScrapeAll = async () => {
    if (alumniIds.length === 0) return toast.warning("Tidak ada data alumni untuk dilacak.");
    
    if (!confirm(`Anda yakin ingin melacak massal ${alumniIds.length} data alumni secara otomatis? Proses ini mungkin memerlukan waktu beberapa menit.`)) {
      return;
    }

    setLoading(true);
    setShowModal(true);
    setResults([]);
    setProgress(0);

    const tempResults = [];

    for (let i = 0; i < alumniIds.length; i++) {
        setProgress(i + 1);
        try {
            const res = await fetch("/api/scrape", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: alumniIds[i] })
            });
            const data = await res.json();
            
            if (!res.ok) {
                tempResults.push({ id: alumniIds[i], status: 'gagal', detail: data.error || 'Server error' });
            } else {
                tempResults.push({ id: alumniIds[i], status: 'sukses', detail: data.message });
            }
        } catch (err: any) {
            tempResults.push({ id: alumniIds[i], status: 'gagal', detail: err.message });
        }
        
        setResults([...tempResults]);
        // Jeda kecil (rate limiter protection)
        await new Promise(r => setTimeout(r, 1000));
    }

    setLoading(false);
    router.refresh(); 
  };

  return (
    <>
      <button 
        onClick={handleScrapeAll}
        disabled={loading || alumniIds.length === 0}
        className="bg-blue-500 hover:bg-blue-600 hover:-translate-y-0.5 transition-all text-white px-5 py-3 rounded-lg text-sm font-medium flex items-center gap-2 shadow-[0_4px_14px_rgba(59,130,246,0.39)] disabled:opacity-50 disabled:hover:translate-y-0"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
        {loading ? `Melacak (${progress}/${alumniIds.length})...` : "Lacak Semua Alumni"}
      </button>

      {mounted && showModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex justify-end bg-black/60 backdrop-blur-sm transition-all duration-300">
          <div className="bg-slate-900 border-l border-slate-700 h-full p-6 shadow-2xl max-w-md w-full relative animate-in slide-in-from-right duration-300 flex flex-col">
            {!loading && (
                <button 
                  onClick={() => setShowModal(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-full"
                >
                  <X size={20} />
                </button>
            )}
            
            <div className="flex items-center gap-3 mb-6 mt-2">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Search className="text-blue-400" size={20} />
              </div>
              <h3 className="text-xl font-bold text-white">
                Pelacakan Massal
              </h3>
            </div>
            
            <p className="text-sm text-slate-300 mb-4 pb-4 border-b border-white/10">
              {loading 
                ? `Sedang memindai profil ke-${progress} dari total ${alumniIds.length} ... Harap tunggu dan jangan tutup halaman ini.`
                : `Selesai! Mengekstrak ${alumniIds.length} data.`}
            </p>

            <div className="bg-slate-950 rounded-lg p-1 border border-white/5 flex-grow mb-4 overflow-hidden flex flex-col shadow-inner">
                {/* Progress Bar */}
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden mb-3 flex-shrink-0">
                    <div 
                        className="h-full bg-blue-500 transition-all duration-300 ease-out"
                        style={{ width: `${(progress / alumniIds.length) * 100}%` }}
                    />
                </div>
                
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
                            <Loader2 size={12} className="animate-spin" /> Menunggu operasi data selanjutnya...
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-auto flex justify-end pt-4 border-t border-white/10">
              <button 
                onClick={() => setShowModal(false)}
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(37,99,235,0.2)]"
              >
                {loading ? "Mode Terkunci (Mengamankan URL)" : "Tutup Panel Pelacakan"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
