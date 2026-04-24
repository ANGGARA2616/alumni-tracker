/**
 * ═══════════════════════════════════════════════════════════════
 * ALUMNI CSV SEEDER — Import Massal via Terminal (CLI)
 * ═══════════════════════════════════════════════════════════════
 *
 * Script ini dirancang untuk mengimpor file CSV berukuran sangat
 * besar (100K+ baris) ke database PostgreSQL menggunakan:
 *   • fs.createReadStream + csv-parser  → streaming, hemat RAM
 *   • Batch Insert per 1.000 baris      → efisien & cepat
 *   • Drizzle ORM                       → konsisten dengan app
 *
 * ── Cara Pakai ──────────────────────────────────────────────── 
 *   npx tsx scripts/seed-csv.ts <path-ke-file.csv>
 *
 * ── Contoh ──────────────────────────────────────────────────── 
 *   npx tsx scripts/seed-csv.ts D:\data\alumni_142k.csv
 *
 * ── Format Header CSV yang Didukung ─────────────────────────── 
 *   Nama Lulusan | Nama       → nama_lulusan
 *   NIM                       → nim
 *   Tahun Masuk               → tahun_masuk
 *   Tanggal Lulus              → tanggal_lulus
 *   Fakultas                   → fakultas
 *   Program Studi | Prodi     → program_studi
 *
 * ═══════════════════════════════════════════════════════════════
 */

import dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

// Load .env.local dulu (Next.js convention), fallback ke .env
const envLocalPath = path.resolve(process.cwd(), ".env.local");
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else {
  dotenv.config({ path: envPath });
}
import csvParser from "csv-parser";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { alumni } from "../src/lib/schema";
import { randomUUID } from "crypto";

// ── Konfigurasi ──────────────────────────────────────────────
const BATCH_SIZE = 1000;        // Jumlah baris per batch insert
const LOG_INTERVAL = 5000;      // Cetak progres setiap N baris

// ── Validasi argumen CLI ─────────────────────────────────────
const csvPath = process.argv[2];
if (!csvPath) {
  console.error("\n❌ Penggunaan: npx tsx scripts/seed-csv.ts <path-ke-file.csv>\n");
  process.exit(1);
}

const resolvedPath = path.resolve(csvPath);
if (!fs.existsSync(resolvedPath)) {
  console.error(`\n❌ File tidak ditemukan: ${resolvedPath}\n`);
  process.exit(1);
}

// ── Koneksi Database ─────────────────────────────────────────
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("\n❌ DATABASE_URL belum diatur di file .env.local atau .env\n");
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });
const db = drizzle(pool);

// ── Utilitas mapping header CSV → kolom database ─────────────
function mapRow(row: Record<string, string>) {
  const get = (...keys: string[]) => {
    for (const k of keys) {
      const val = row[k]?.trim();
      if (val) return val;
    }
    return "";
  };

  const nama = get("Nama Lulusan", "Nama", "nama_lulusan", "nama");
  const nim = get("NIM", "nim");

  // Skip baris tanpa nama atau NIM
  if (!nama || !nim) return null;

  return {
    id: randomUUID(),
    nama_lulusan: nama,
    nim: nim,
    tahun_masuk: get("Tahun Masuk", "tahun_masuk"),
    tanggal_lulus: get("Tanggal Lulus", "tanggal_lulus"),
    fakultas: get("Fakultas", "fakultas"),
    program_studi: get("Program Studi", "Prodi", "program_studi"),
  };
}

// ── Fungsi Utama ─────────────────────────────────────────────
async function main() {
  console.log("═══════════════════════════════════════════════════");
  console.log("  📂 ALUMNI CSV SEEDER");
  console.log("═══════════════════════════════════════════════════");
  console.log(`  File   : ${resolvedPath}`);
  console.log(`  Batch  : ${BATCH_SIZE} baris/insert`);
  console.log(`  DB     : ${DATABASE_URL!.replace(/\/\/.*@/, "//***@")}`);
  console.log("═══════════════════════════════════════════════════\n");

  let batch: ReturnType<typeof mapRow>[] = [];
  let totalImported = 0;
  let totalSkipped = 0;
  let batchCount = 0;
  const startTime = Date.now();

  // Flush satu batch ke database
  async function flushBatch() {
    const validRows = batch.filter(Boolean) as NonNullable<ReturnType<typeof mapRow>>[];
    if (validRows.length === 0) {
      batch = [];
      return;
    }

    try {
      await db.insert(alumni).values(validRows).onConflictDoNothing();
      totalImported += validRows.length;
      batchCount++;
    } catch (err: any) {
      // Jika batch gagal (misal duplikat NIM), coba satu per satu
      console.warn(`  ⚠️  Batch #${batchCount + 1} gagal massal, mencoba per-baris...`);
      for (const row of validRows) {
        try {
          await db.insert(alumni).values(row).onConflictDoNothing();
          totalImported++;
        } catch {
          totalSkipped++;
        }
      }
      batchCount++;
    }
    batch = [];
  }

  // Stream CSV
  return new Promise<void>((resolve, reject) => {
    const stream = fs.createReadStream(resolvedPath, { encoding: "utf-8" })
      .pipe(csvParser({ separator: ",", strict: false }));

    stream.on("data", (row: Record<string, string>) => {
      const mapped = mapRow(row);
      if (mapped) {
        batch.push(mapped);
      } else {
        totalSkipped++;
      }

      const total = totalImported + totalSkipped + batch.length;
      if (total % LOG_INTERVAL === 0) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        process.stdout.write(`  ⏳ Diproses: ${total.toLocaleString("id-ID")} baris (${elapsed}s)\r`);
      }

      // Flush ketika batch penuh
      if (batch.length >= BATCH_SIZE) {
        stream.pause();
        flushBatch().then(() => stream.resume()).catch(reject);
      }
    });

    stream.on("end", async () => {
      // Flush sisa batch terakhir
      if (batch.length > 0) {
        await flushBatch();
      }

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log("\n");
      console.log("═══════════════════════════════════════════════════");
      console.log("  ✅ SELESAI!");
      console.log("═══════════════════════════════════════════════════");
      console.log(`  Total berhasil diimpor : ${totalImported.toLocaleString("id-ID")} baris`);
      console.log(`  Total dilewati/duplikat: ${totalSkipped.toLocaleString("id-ID")} baris`);
      console.log(`  Total batch            : ${batchCount}`);
      console.log(`  Waktu eksekusi         : ${elapsed} detik`);
      console.log("═══════════════════════════════════════════════════\n");

      await pool.end();
      resolve();
    });

    stream.on("error", (err) => {
      console.error("\n❌ Error membaca CSV:", err.message);
      pool.end();
      reject(err);
    });
  });
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
