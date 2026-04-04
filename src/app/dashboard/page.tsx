import { db } from "@/lib/db";
import { alumni } from "@/lib/schema";
import { count, ilike, SQL, sql } from "drizzle-orm";
import Link from "next/link";
import { LogOut, Plus, Search, Edit3 } from "lucide-react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import ScrapeAllButton from "./scrape-all-button";
import CsvUpload from "./csv-upload";
import DashboardRow from "./dashboard-row";
import DeleteAllButton from "./delete-all-button";
import SearchInput from "./search-input";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: any;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  // Pagination setup & Search setup
  const resolvedParams = searchParams ? await searchParams : {};
  const page = Number(resolvedParams.page) || 1;
  const q: string = resolvedParams.q || "";
  const ITEMS_PER_PAGE = 15;
  const offset = (page - 1) * ITEMS_PER_PAGE;

  // Build condition
  const searchCondition = q ? ilike(alumni.nama_lulusan, `%${q}%`) : undefined;

  // Get total count
  const totalCountResult = searchCondition 
      ? await db.select({ value: count() }).from(alumni).where(searchCondition)
      : await db.select({ value: count() }).from(alumni);
      
  const totalAlumni = totalCountResult[0].value;
  const totalPages = Math.ceil(totalAlumni / ITEMS_PER_PAGE);

  // Paginated Data
  const data = searchCondition
    ? await db.select().from(alumni).where(searchCondition).orderBy(alumni.nama_lulusan).limit(ITEMS_PER_PAGE).offset(offset)
    : await db.select().from(alumni).orderBy(alumni.nama_lulusan).limit(ITEMS_PER_PAGE).offset(offset);

  // All IDs for mass scraping
  const allIdsData = await db.select({ id: alumni.id }).from(alumni);
  const allAlumniIds = allIdsData.map((p) => p.id);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 relative overflow-hidden font-sans">
      {/* Background animation similar to old project */}
      <div className="fixed top-0 left-0 w-[100vw] h-[100vh] -z-10 bg-[radial-gradient(circle_at_15%_50%,rgba(59,130,246,0.15),transparent_25%),radial-gradient(circle_at_85%_30%,rgba(16,185,129,0.15),transparent_25%)] animate-pulse"></div>
      
      <header className="bg-slate-900/60 backdrop-blur-md border-b border-white/10 sticky top-0 z-10 shadow-[0_4px_30px_rgba(0,0,0,0.1)] rounded-b-2xl mx-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 text-blue-500 font-bold text-xl">
            <i className="fa-solid fa-graduation-cap"></i> AlumniTracker
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-300 font-medium">Hello, {session.user.name}</span>
            <a 
              href="/api/auth/signout"
              className="text-slate-300 hover:text-red-400 transition-colors p-2 flex items-center gap-2 rounded-full hover:bg-slate-800"
            >
              <LogOut size={18} /> <span className="text-sm font-medium hidden sm:inline">Keluar</span>
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="bg-slate-800/60 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] mb-8 animate-[fadeInUp_0.6s_ease-out]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2"><i className="fa-solid fa-cogs"></i> Kontrol Sistem</h2>
              <p className="text-sm text-slate-400">Kelola dan lengkapi data kontak serta karir alumni.</p>
            </div>
            <div className="flex flex-wrap gap-4 mt-4 sm:mt-0">
              <CsvUpload />
              <DeleteAllButton />
              <ScrapeAllButton alumniIds={allAlumniIds} />
              <Link 
                href="/form/new"
                className="bg-blue-500 hover:bg-blue-600 hover:-translate-y-0.5 transition-all text-white px-5 py-3 rounded-lg text-sm font-medium flex items-center gap-2 shadow-[0_4px_14px_rgba(59,130,246,0.39)]"
              >
                <Plus size={18} /> Tambah Alumni
              </Link>
            </div>
          </div>
        </section>

        {/* Disclaimer Area */}
        <div className="bg-red-500/10 border-l-4 border-red-500 p-4 mb-8 rounded-r-lg shadow-sm flex items-start">
            <div className="flex-shrink-0">
               <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-200 font-medium">
                Perhatian: Semua data adalah untuk kepentingan pembelajaran, dilarang menyebarkan untuk kepentingan apapun.
              </p>
            </div>
        </div>

        {/* Table Config */}
        <section className="bg-slate-800/60 backdrop-blur-md border border-white/10 rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] overflow-hidden animate-[fadeInUp_0.6s_ease-out_0.2s_both]">
          <div className="p-5 border-b border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
             <h2 className="text-xl font-bold flex items-center gap-2 m-0"><i className="fa-solid fa-users-viewfinder"></i> Data Alumni & Status</h2>
             <SearchInput />
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full text-left border-collapse">
              <thead className="bg-slate-900/50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-white/10">Nama & NIM</th>
                  <th scope="col" className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-white/10">Info Akademik</th>
                  <th scope="col" className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-white/10">Tgl. Lulus</th>
                  <th scope="col" className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-white/10">OSINT Data</th>
                  <th scope="col" className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-white/10">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      Belum ada data alumni di pangkalan data.
                    </td>
                  </tr>
                ) : (
                  data.map((person) => (
                    <DashboardRow key={person.id} person={person} />
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900/30">
              <div className="text-sm text-slate-400">
                Menampilkan <span className="font-medium text-slate-200">{totalAlumni === 0 ? 0 : offset + 1}</span> hingga <span className="font-medium text-slate-200">{Math.min(page * ITEMS_PER_PAGE, totalAlumni)}</span> dari <span className="font-medium text-slate-200">{totalAlumni}</span> alumni
              </div>
              <div className="flex items-center gap-2">
                {page > 1 ? (
                  <Link href={`/dashboard?page=${page - 1}${q ? `&q=${q}` : ''}`} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-colors border border-white/10 shadow-sm flex items-center gap-1">
                    ← Sebelumnya
                  </Link>
                ) : (
                  <button disabled className="px-4 py-2 bg-slate-800/40 text-slate-500 text-sm font-medium rounded-lg border border-white/5 cursor-not-allowed flex items-center gap-1">
                    ← Sebelumnya
                  </button>
                )}
                
                <div className="px-3 py-1 bg-slate-800/80 border border-white/10 rounded-md text-sm font-semibold text-blue-400">
                  {page} / {totalPages === 0 ? 1 : totalPages}
                </div>

                {page < totalPages ? (
                  <Link href={`/dashboard?page=${page + 1}${q ? `&q=${q}` : ''}`} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-colors border border-white/10 shadow-sm flex items-center gap-1">
                    Selanjutnya →
                  </Link>
                ) : (
                  <button disabled className="px-4 py-2 bg-slate-800/40 text-slate-500 text-sm font-medium rounded-lg border border-white/5 cursor-not-allowed flex items-center gap-1">
                    Selanjutnya →
                  </button>
                )}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
