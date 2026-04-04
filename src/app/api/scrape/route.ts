import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { alumni } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { scrapePersonData } from "@/lib/scraper";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Alumni ID is required" }, { status: 400 });
    }

    // Ambil data person dari database
    const personQuery = await db.select().from(alumni).where(eq(alumni.id, id));
    if (personQuery.length === 0) {
      return NextResponse.json({ error: "Alumni tidak ditemukan" }, { status: 404 });
    }

    const person = personQuery[0];
    const keywordContext = `${person.fakultas || ""} ${person.program_studi || ""} Universitas`;

    // Jalankan auto-scraper OSINT ke Google
    const result = await scrapePersonData(person.nama_lulusan, keywordContext);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    const extracted: any = result.data;
    
    // Simpan hanya data yang ditemukan (Toleransi ketidaklengkapan data) ke DB
    // Jangan tiban data lama jika sudah ada isinya kecuali kalau masih kosong
    const updatePayload: any = {};
    if (extracted?.linkedin_url && !person.linkedin_url) updatePayload.linkedin_url = extracted.linkedin_url;
    if (extracted?.ig_url && !person.ig_url) updatePayload.ig_url = extracted.ig_url;
    if (extracted?.fb_url && !person.fb_url) updatePayload.fb_url = extracted.fb_url;
    if (extracted?.tiktok_url && !person.tiktok_url) updatePayload.tiktok_url = extracted.tiktok_url;
    if (extracted?.email && !person.email) updatePayload.email = extracted.email;
    if (extracted?.no_hp && !person.no_hp) updatePayload.no_hp = extracted.no_hp;
    if (extracted?.nama_perusahaan && !person.nama_perusahaan) updatePayload.nama_perusahaan = extracted.nama_perusahaan;
    if (extracted?.posisi && !person.posisi) updatePayload.posisi = extracted.posisi;
    if (extracted?.kategori_pekerjaan && !person.kategori_pekerjaan) updatePayload.kategori_pekerjaan = extracted.kategori_pekerjaan;

    const hasChanges = Object.keys(updatePayload).length > 0;
    
    // Set status pelacakan
    updatePayload.status_pelacakan = hasChanges ? "Profil Ditemukan" : "Tidak Ditemukan";
    updatePayload.updatedAt = new Date();

    await db.update(alumni).set(updatePayload).where(eq(alumni.id, id));

    return NextResponse.json({ 
      success: true, 
      message: hasChanges 
         ? `Scraping selesai. Data berhasil diperbarui.`
         : `Scraping selesai, namun data intelijen tidak ditemukan.`,
      data: updatePayload 
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
