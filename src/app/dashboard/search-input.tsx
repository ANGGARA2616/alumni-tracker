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
  const currentStatus = searchParams.get("status") || "all";
  
  const [term, setTerm] = useState(currentQ);
  const [status, setStatus] = useState(currentStatus);
  const isMounted = useRef(false);

  useEffect(() => {
     if (!isMounted.current) {
        isMounted.current = true;
        return;
     }

     if (term === currentQ && status === currentStatus) return;

     const delayDebounceFn = setTimeout(() => {
        const params = new URLSearchParams(searchParams.toString());
        
        if (term) params.set("q", term);
        else params.delete("q");

        if (status !== "all") params.set("status", status);
        else params.delete("status");

        params.delete("page");
        startTransition(() => {
           router.replace(`${pathname}?${params.toString()}`);
        });
     }, 400);

     return () => clearTimeout(delayDebounceFn);
  }, [term, status, router, pathname, searchParams, currentQ, currentStatus]);

  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
      <div className="relative w-full sm:w-auto">
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
          className={`block w-full sm:w-64 pl-10 pr-3 py-2 border rounded-lg bg-slate-900/50 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all ${isPending ? "border-blue-500/50" : "border-white/10"}`}
          placeholder={isPending ? "Mencari..." : "Cari nama alumni..."} 
        />
        {isPending && (
          <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b-lg overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 via-indigo-400 to-blue-500 animate-[shimmer_1.5s_ease-in-out_infinite]" 
                 style={{ backgroundSize: "200% 100%" }} />
          </div>
        )}
      </div>

      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="block w-full sm:w-48 px-3 py-2 border border-white/10 rounded-lg bg-slate-900/50 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm appearance-none cursor-pointer"
        style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
      >
        <option value="all">Semua Status</option>
        <option value="found">✅ Profil Ditemukan</option>
        <option value="not_found">❌ Tidak Ditemukan</option>
        <option value="untracked">⏳ Belum Dilacak</option>
      </select>
    </div>
  );
}
