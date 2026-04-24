import dotenv from "dotenv";
import path from "path";
import fs from "fs";

const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });

const keys = (process.env.SERPER_API_KEY || "").split(",").map(k => k.trim()).filter(Boolean);
const geminiKeys = (process.env.GEMINI_API_KEY || "").split(",").map(k => k.trim()).filter(Boolean);

async function testSerper() {
  console.log(`\n🔍 Testing ${keys.length} Serper key(s)...\n`);
  
  for (let i = 0; i < keys.length; i++) {
    try {
      const res = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: {
          "X-API-KEY": keys[i],
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ q: "test query", gl: "id", hl: "id" }),
      });

      const body = await res.text();
      let parsed;
      try { parsed = JSON.parse(body); } catch { parsed = null; }

      console.log(`  Key #${i + 1}: ${keys[i].substring(0, 8)}...`);
      console.log(`    Status : ${res.status} ${res.statusText}`);
      console.log(`    Credits: ${parsed?.credits ?? "N/A"}`);
      console.log(`    Results: ${parsed?.organic?.length ?? 0} organic results`);
      if (res.status !== 200) {
        console.log(`    Error  : ${body.substring(0, 200)}`);
      }
      console.log();
    } catch (err: any) {
      console.log(`  Key #${i + 1}: NETWORK ERROR — ${err.message}\n`);
    }
  }
}

async function testGemini() {
  console.log(`\n🤖 Testing ${geminiKeys.length} Gemini key(s)...\n`);
  
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  
  for (let i = 0; i < geminiKeys.length; i++) {
    try {
      const genAI = new GoogleGenerativeAI(geminiKeys[i]);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent("Jawab singkat: 1+1=?");
      const text = result.response.text();
      console.log(`  Key #${i + 1}: ${geminiKeys[i].substring(0, 12)}...`);
      console.log(`    Status : ✅ OK`);
      console.log(`    Response: "${text?.trim().substring(0, 50)}"\n`);
    } catch (err: any) {
      console.log(`  Key #${i + 1}: ${geminiKeys[i].substring(0, 12)}...`);
      console.log(`    Status : ❌ GAGAL`);
      console.log(`    Error  : ${err.message?.substring(0, 200)}\n`);
    }
  }
}

async function main() {
  console.log("═══════════════════════════════════════════");
  console.log("  🧪 API KEY DIAGNOSTIC TOOL");
  console.log("═══════════════════════════════════════════");
  
  await testSerper();
  await testGemini();
  
  console.log("═══════════════════════════════════════════");
  console.log("  Selesai!");
  console.log("═══════════════════════════════════════════");
}

main();
