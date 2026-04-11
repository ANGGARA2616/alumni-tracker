"use client";

import { Search, Loader2 } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition, useState, useEffect, useRef } from "react";

export default function SearchInput() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentQ = searchParams.get("q") || "";
  const [term, setTerm] = useState(currentQ);
  const isMounted = useRef(false);

  useEffect(() => {
     if (!isMounted.current) {
        isMounted.current = true;
        return;
     }

     // Cegah reset saat pergantian halaman (Hanya terpicu jika kotak pencarian benar-benar diubah)
     if (term === currentQ) return;

     const delayDebounceFn = setTimeout(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (term) {
           params.set("q", term);
        } else {
           params.delete("q");
        }
        params.delete("page"); // Kembali ke hlman 1 jika cari nama baru
        startTransition(() => {
           router.replace(`${pathname}?${params.toString()}`);
        });
     }, 400);

     return () => clearTimeout(delayDebounceFn);
  }, [term, router, pathname, searchParams]);

  return (
    <div className="relative w-full sm:w-auto">
      {/* Ikon: spinner saat loading, kaca pembesar saat idle */}
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        {isPending ? (
          <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
        ) : (
          <Search className="h-4 w-4 text-slate-400" />
        )}
      </div>

      <input 
        type="text" 
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        className={`block w-full sm:w-72 pl-10 pr-3 py-2 border rounded-lg bg-slate-900/50 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all ${isPending ? "border-blue-500/50" : "border-white/10"}`}
        placeholder={isPending ? "Mencari..." : "Cari nama alumni..."} 
      />

      {/* Progress bar animasi di bawah input */}
      {isPending && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b-lg overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 via-indigo-400 to-blue-500 animate-[shimmer_1.5s_ease-in-out_infinite]" 
               style={{ backgroundSize: "200% 100%" }} />
        </div>
      )}
    </div>
  );
}
