import { db } from "@/lib/db";
import { alumni } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import Link from "next/link";

export default async function FormPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const resolvedParams = await params;
  const isNew = resolvedParams.id === "new";

  let person: any = null;
  if (!isNew) {
    const data = await db.select().from(alumni).where(eq(alumni.id, resolvedParams.id));
    if (data.length > 0) person = data[0];
  }

  async function saveData(formData: FormData) {
    "use server";
    
    const isNewAction = formData.get("isNew") === "true";
    const recordId = formData.get("id") as string;
    
    const obj = {
      nama_lulusan: formData.get("nama_lulusan") as string,
      nim: formData.get("nim") as string,
      tahun_masuk: formData.get("tahun_masuk") as string,
      tanggal_lulus: formData.get("tanggal_lulus") as string,
      fakultas: formData.get("fakultas") as string,
      program_studi: formData.get("program_studi") as string,
      linkedin_url: formData.get("linkedin_url") as string,
      ig_url: formData.get("ig_url") as string,
      fb_url: formData.get("fb_url") as string,
      tiktok_url: formData.get("tiktok_url") as string,
      email: formData.get("email") as string,
      no_hp: formData.get("no_hp") as string,
      nama_perusahaan: formData.get("nama_perusahaan") as string,
      alamat_perusahaan: formData.get("alamat_perusahaan") as string,
      posisi: formData.get("posisi") as string,
      kategori_pekerjaan: formData.get("kategori_pekerjaan") as string,
      sosmed_perusahaan: formData.get("sosmed_perusahaan") as string,
    };

    if (isNewAction) {
      await db.insert(alumni).values({
        id: require("crypto").randomUUID(),
        ...obj
      });
    } else {
      await db.update(alumni).set(obj).where(eq(alumni.id, recordId));
    }
    
    revalidatePath("/dashboard");
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-10 px-4 sm:px-6 relative overflow-hidden font-sans">
      <div className="fixed top-0 left-0 w-[100vw] h-[100vh] -z-10 bg-[radial-gradient(circle_at_15%_50%,rgba(59,130,246,0.15),transparent_25%),radial-gradient(circle_at_85%_30%,rgba(16,185,129,0.15),transparent_25%)] animate-pulse"></div>

      <div className="max-w-4xl mx-auto bg-slate-800/60 backdrop-blur-md rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] border border-white/10 overflow-hidden">
        <div className="border-b border-white/10 p-8">
          <h1 className="text-2xl font-bold text-blue-400 flex items-center gap-2">
            <i className="fa-solid fa-graduation-cap"></i> {isNew ? "Tambah Data Alumni" : "Lengkapi Data Alumni"}
          </h1>
          <p className="mt-2 text-slate-400 text-sm">
            Formulir Pemutakhiran Profil dan Rekam Jejak Karir Lulusan
          </p>
        </div>

        <form action={saveData} className="p-8 space-y-8">
          <input type="hidden" name="isNew" value={isNew ? "true" : "false"} />
          <input type="hidden" name="id" value={resolvedParams.id} />

          {/* Bagian 1: Data Dasar */}
          <div className="bg-white/5 p-6 rounded-xl border border-white/5">
            <h2 className="text-lg font-bold text-slate-200 border-b border-white/10 pb-2 mb-4">Biodata Dasar</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1">Nama Lengkap</label>
                <input required type="text" name="nama_lulusan" defaultValue={person?.nama_lulusan || ""} className="w-full rounded-lg bg-slate-900/50 border border-white/10 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 p-2.5 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1">NIM</label>
                <input required type="text" name="nim" defaultValue={person?.nim || ""} className="w-full rounded-lg bg-slate-900/50 border border-white/10 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 p-2.5 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1">Tahun Masuk</label>
                <input required type="text" name="tahun_masuk" defaultValue={person?.tahun_masuk || ""} className="w-full rounded-lg bg-slate-900/50 border border-white/10 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 p-2.5 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1">Tanggal Lulus</label>
                <input required type="text" name="tanggal_lulus" defaultValue={person?.tanggal_lulus || ""} className="w-full rounded-lg bg-slate-900/50 border border-white/10 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 p-2.5 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1">Fakultas</label>
                <input required type="text" name="fakultas" defaultValue={person?.fakultas || ""} className="w-full rounded-lg bg-slate-900/50 border border-white/10 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 p-2.5 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1">Program Studi</label>
                <input required type="text" name="program_studi" defaultValue={person?.program_studi || ""} className="w-full rounded-lg bg-slate-900/50 border border-white/10 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 p-2.5 transition-all" />
              </div>
            </div>
          </div>

          {!isNew && (
            <>
              {/* Bagian 2: Kontak */}
              <div className="bg-white/5 p-6 rounded-xl border border-white/5">
                <h2 className="text-lg font-bold text-slate-200 border-b border-white/10 pb-2 mb-4">Informasi Kontak</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-1">Email <span className="text-xs font-normal text-slate-500 border border-slate-600 rounded px-1 ml-1 bg-slate-800">opsional</span></label>
                    <input type="email" name="email" defaultValue={person?.email || ""} className="w-full rounded-lg bg-slate-900/50 border border-white/10 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 p-2.5 transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-1">No. HP / WhatsApp <span className="text-xs font-normal text-slate-500 border border-slate-600 rounded px-1 ml-1 bg-slate-800">opsional</span></label>
                    <input type="text" name="no_hp" defaultValue={person?.no_hp || ""} className="w-full rounded-lg bg-slate-900/50 border border-white/10 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 p-2.5 transition-all" />
                  </div>
                </div>
              </div>

              {/* Bagian 3: Sosial Media */}
              <div className="bg-white/5 p-6 rounded-xl border border-white/5">
                <h2 className="text-lg font-bold text-slate-200 border-b border-white/10 pb-2 mb-4">Alamat Sosial Media</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-blue-400 mb-1">LinkedIn URL</label>
                    <input type="text" name="linkedin_url" defaultValue={person?.linkedin_url || ""} placeholder="https://linkedin.com/in/..." className="w-full rounded-lg bg-slate-900/50 border border-white/10 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 p-2.5 transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-pink-400 mb-1">Instagram URL</label>
                    <input type="text" name="ig_url" defaultValue={person?.ig_url || ""} placeholder="https://instagram.com/..." className="w-full rounded-lg bg-slate-900/50 border border-white/10 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 p-2.5 transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-blue-500 mb-1">Facebook URL</label>
                    <input type="text" name="fb_url" defaultValue={person?.fb_url || ""} placeholder="https://facebook.com/..." className="w-full rounded-lg bg-slate-900/50 border border-white/10 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 p-2.5 transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-1">TikTok URL</label>
                    <input type="text" name="tiktok_url" defaultValue={person?.tiktok_url || ""} placeholder="https://tiktok.com/@..." className="w-full rounded-lg bg-slate-900/50 border border-white/10 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 p-2.5 transition-all" />
                  </div>
                </div>
              </div>

              {/* Bagian 4: Pekerjaan */}
              <div className="bg-white/5 p-6 rounded-xl border border-white/5">
                <h2 className="text-lg font-bold text-slate-200 border-b border-white/10 pb-2 mb-4">Informasi Karir / Pekerjaan</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Kategori Pekerjaan <span className="text-xs font-normal text-slate-500 border border-slate-600 rounded px-1 ml-1 bg-slate-800">opsional</span></label>
                    <div className="flex flex-wrap gap-4">
                      <label className="inline-flex items-center cursor-pointer group">
                        <input type="radio" value="PNS" name="kategori_pekerjaan" defaultChecked={person?.kategori_pekerjaan === "PNS"} className="w-4 h-4 text-blue-500 border-white/20 bg-slate-800 focus:ring-blue-500 focus:ring-offset-slate-900" />
                        <span className="ml-2 bg-slate-800 border border-white/10 px-3 py-1 rounded-md text-sm font-medium group-hover:border-blue-500/50 transition-colors">PNS / ASN</span>
                      </label>
                      <label className="inline-flex items-center cursor-pointer group">
                        <input type="radio" value="Swasta" name="kategori_pekerjaan" defaultChecked={person?.kategori_pekerjaan === "Swasta"} className="w-4 h-4 text-blue-500 border-white/20 bg-slate-800 focus:ring-blue-500 focus:ring-offset-slate-900" />
                        <span className="ml-2 bg-slate-800 border border-white/10 px-3 py-1 rounded-md text-sm font-medium group-hover:border-blue-500/50 transition-colors">Swasta / BUMN</span>
                      </label>
                      <label className="inline-flex items-center cursor-pointer group">
                        <input type="radio" value="Wirausaha" name="kategori_pekerjaan" defaultChecked={person?.kategori_pekerjaan === "Wirausaha"} className="w-4 h-4 text-blue-500 border-white/20 bg-slate-800 focus:ring-blue-500 focus:ring-offset-slate-900" />
                        <span className="ml-2 bg-slate-800 border border-white/10 px-3 py-1 rounded-md text-sm font-medium group-hover:border-blue-500/50 transition-colors">Wirausaha / CEO</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-1">Tempat Bekerja (Nama PT)</label>
                    <input type="text" name="nama_perusahaan" defaultValue={person?.nama_perusahaan || ""} className="w-full rounded-lg bg-slate-900/50 border border-white/10 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 p-2.5 transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-1">Posisi / Jabatan</label>
                    <input type="text" name="posisi" defaultValue={person?.posisi || ""} className="w-full rounded-lg bg-slate-900/50 border border-white/10 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 p-2.5 transition-all" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-slate-300 mb-1">Alamat Lengkap Perusahaan</label>
                    <textarea name="alamat_perusahaan" rows={3} defaultValue={person?.alamat_perusahaan || ""} className="w-full rounded-lg bg-slate-900/50 border border-white/10 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 p-2.5 transition-all"></textarea>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-slate-300 mb-1">Alamat Sosial Media Tempat Bekerja</label>
                    <input type="text" name="sosmed_perusahaan" defaultValue={person?.sosmed_perusahaan || ""} placeholder="Contoh: @perusahaan di Instagram atau LinkedIn URL" className="w-full rounded-lg bg-slate-900/50 border border-white/10 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 p-2.5 transition-all" />
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="pt-6 border-t border-white/10 mt-8 flex justify-end gap-4">
             <Link href="/dashboard" className="px-6 py-2 border border-white/10 bg-slate-800 text-slate-300 font-semibold text-sm rounded-lg hover:bg-slate-700 flex items-center transition-colors">
                Batal
             </Link>
             <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-lg shadow-[0_4px_14px_rgba(59,130,246,0.39)] transition-all flex items-center gap-2 hover:-translate-y-0.5">
                Simpan Data
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}
