"use client";

import { useState, useRef } from "react";
import Papa from "papaparse";
import { UploadCloud, Loader2 } from "lucide-react";
import { importAlumniData } from "./import-action";

export default function CsvUpload() {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const res = await importAlumniData(results.data);
          if (res?.error) {
            alert("Gagal impor: " + res.error);
          } else {
            alert(`Berhasil mengimpor ${res?.count} data alumni!`);
          }
        } catch (err: any) {
          alert("Error: " + err.message);
        } finally {
          setLoading(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      },
      error: (error) => {
        alert("Gagal membaca file CSV: " + error.message);
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    });
  };

  return (
    <div>
      <input 
        type="file" 
        accept=".csv" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
      />
      <button 
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        className="bg-slate-700 hover:bg-slate-600 transition-all text-white px-5 py-3 rounded-lg text-sm font-medium flex items-center gap-2 border border-white/10 disabled:opacity-50"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : <UploadCloud size={18} />}
        {loading ? "Memproses..." : "Upload CSV"}
      </button>
    </div>
  );
}
