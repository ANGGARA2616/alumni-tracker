"use client";

import { useState } from "react";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function DeleteAllButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDeleteAll = async () => {
    if (!confirm("PERINGATAN KRITIS: Apakah Anda benar-benar yakin ingin MENGHAPUS SELURUH data alumni secara permanen dari database? Aksi ini tidak dapat dibatalkan!")) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/alumni", {
        method: "DELETE"
      });
      if (res.ok) {
        toast.success("Seluruh data alumni berhasil dikosongkan.");
        router.refresh();
      } else {
        toast.error("Terjadi kesalahan saat menghapus data.");
      }
    } catch (err: any) {
      toast.error("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleDeleteAll}
      disabled={loading}
      className="bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:border-red-500 hover:-translate-y-0.5 transition-all text-red-500 hover:text-white px-5 py-3 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:hover:translate-y-0"
      title="Kosongkan Pangkalan Data"
    >
      {loading ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
      {loading ? "Menghapus..." : "Hapus Semua Data"}
    </button>
  );
}
