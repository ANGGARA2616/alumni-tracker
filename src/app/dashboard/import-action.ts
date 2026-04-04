"use server";

import { db } from "@/lib/db";
import { alumni } from "@/lib/schema";
import { revalidatePath } from "next/cache";

export async function importAlumniData(records: any[]) {
  if (!records || records.length === 0) return { error: "Data kosong" };
  
  try {
    const valuesToInsert = records.map((record) => ({
      id: crypto.randomUUID(),
      nama_lulusan: record["Nama Lulusan"] || record["Nama"] || "Tanpa Nama",
      nim: record["NIM"] || String(Math.floor(Math.random() * 1000000)),
      tahun_masuk: record["Tahun Masuk"] ? String(record["Tahun Masuk"]) : "",
      tanggal_lulus: record["Tanggal Lulus"] ? String(record["Tanggal Lulus"]) : "",
      fakultas: record["Fakultas"] || "",
      program_studi: record["Program Studi"] || record["Prodi"] || "",
    })).filter(r => r.nama_lulusan !== "Tanpa Nama");

    if (valuesToInsert.length > 0) {
      await db.insert(alumni).values(valuesToInsert);
      revalidatePath("/dashboard");
      return { success: true, count: valuesToInsert.length };
    }
    return { error: "Tidak ada data valid untuk diimpor" };

  } catch (e: any) {
    return { error: e.message };
  }
}
