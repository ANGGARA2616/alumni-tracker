import { GoogleGenerativeAI } from "@google/generative-ai";

type SearchResult = { title: string; url: string; snippet: string };

export type ScrapeResult = {
  data?: Record<string, string>;
  error?: string;
  engine?: "ai" | "legacy";
};

// ══════════════════════════════════════════════════
//  UTILITAS: Shuffle array (Fisher-Yates) & delay
// ══════════════════════════════════════════════════

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ══════════════════════════════════════════════════
//  MESIN PENCARI: Serper API (Multi-Key Random Rotation)
//  Setiap request mengacak urutan key agar beban 
//  tersebar merata, tidak selalu mulai dari key #1.
// ══════════════════════════════════════════════════

const ALL_SERPER_KEYS = (process.env.SERPER_API_KEY || "").split(",").map(k => k.trim()).filter(Boolean);

async function searchSerper(query: string): Promise<SearchResult[]> {
  if (ALL_SERPER_KEYS.length === 0) {
    console.error("[Serper] Tidak ada SERPER_API_KEY.");
    return [];
  }

  // Acak urutan key setiap kali fungsi dipanggil
  const keys = shuffleArray(ALL_SERPER_KEYS);
  let allKeysQuotaExhausted = true;

  for (let i = 0; i < keys.length; i++) {
    try {
      const res = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: {
          "X-API-KEY": keys[i],
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ q: query, gl: "id", hl: "id" }),
      });

      if (res.status === 400 || res.status === 403 || res.status === 429) {
        console.log(`[Serper] Key #${i + 1}/${keys.length} habis kuota, rotasi...`);
        if (i < keys.length - 1) await delay(300);
        continue; // Key ini habis, coba key berikutnya
      }

      if (!res.ok) {
        const errorText = await res.text();
        console.error("[Serper] Status:", res.status, "Body:", errorText);
        allKeysQuotaExhausted = false; // Bukan masalah kuota
        continue;
      }

      // Status 200 OK — key ini berhasil, langsung return hasilnya
      // (termasuk jika 0 organic results, itu bukan masalah kuota)
      allKeysQuotaExhausted = false;
      const data = await res.json();
      const results: SearchResult[] = [];

      if (data.organic && Array.isArray(data.organic)) {
        for (const item of data.organic) {
          if (item.title && item.link) {
            results.push({
              title: item.title,
              url: item.link,
              snippet: item.snippet || "",
            });
          }
        }
      }

      console.log(`[Serper] Key #${i + 1} berhasil, ${results.length} hasil.`);
      return results; // Return langsung, meskipun 0 hasil
    } catch (err: any) {
      console.error(`[Serper] Key #${i + 1} network error:`, err.message);
      allKeysQuotaExhausted = false;
    }
  }

  // Hanya throw KUOTA_HABIS jika BENAR-BENAR semua key kena 400/403/429
  if (allKeysQuotaExhausted) {
    throw new Error("KUOTA_HABIS");
  }
  return []; // Ada key yang gagal tapi bukan karena kuota
}

// ══════════════════════════════════════════════════
//  EKSTRAKTOR REGEX (Tanpa API, Tanpa Limit)
// ══════════════════════════════════════════════════

function extractWithRegex(results: SearchResult[]): Record<string, string> {
  const extracted: Record<string, string> = {
    linkedin_url: "", ig_url: "", fb_url: "", tiktok_url: "",
    email: "", no_hp: "",
    nama_perusahaan: "", posisi: "", kategori_pekerjaan: "",
  };

  const allText = results.map(r => `${r.title} ${r.snippet} ${r.url}`).join("\n");

  // ── URL Sosial Media ──
  for (const r of results) {
    const url = r.url.toLowerCase();

    if (!extracted.linkedin_url && (url.includes("linkedin.com/in/") || url.includes("id.linkedin.com/in/"))) {
      extracted.linkedin_url = r.url;
    }
    if (!extracted.ig_url && url.includes("instagram.com/") &&
        !url.includes("/p/") && !url.includes("/explore/") &&
        !url.includes("/reel/") && !url.includes("/stories/")) {
      extracted.ig_url = r.url;
    }
    if (!extracted.fb_url && (url.includes("facebook.com/") || url.includes("fb.com/")) &&
        !url.includes("/groups/") && !url.includes("/pages/") &&
        !url.includes("/photo") && !url.includes("/video")) {
      extracted.fb_url = r.url;
    }
    if (!extracted.tiktok_url && url.includes("tiktok.com/@")) {
      extracted.tiktok_url = r.url;
    }
  }

  // URL dalam snippet
  const liInSnippet = allText.match(/https?:\/\/(?:www\.)?(?:id\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
  if (!extracted.linkedin_url && liInSnippet) extracted.linkedin_url = liInSnippet[0];
  const igInSnippet = allText.match(/https?:\/\/(?:www\.)?instagram\.com\/[a-zA-Z0-9_.]+/i);
  if (!extracted.ig_url && igInSnippet) extracted.ig_url = igInSnippet[0];

  // ── Email & No HP ──
  const emailMatch = allText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) extracted.email = emailMatch[0];

  const phonePatterns = [/(?:\+62|62|0)8[1-9]\d{7,10}/, /08[1-9]\d[\s.-]?\d{3,4}[\s.-]?\d{3,4}/];
  for (const p of phonePatterns) {
    const m = allText.match(p);
    if (m) { extracted.no_hp = m[0].replace(/[\s.-]/g, ""); break; }
  }

  // ── Posisi & Perusahaan dari LinkedIn ──
  const linkedinResults = results.filter(r => r.url.toLowerCase().includes("linkedin.com/in/"));
  for (const r of linkedinResults) {
    if (extracted.posisi && extracted.nama_perusahaan) break;

    const title = r.title
      .replace(/\s*[-–|]\s*LinkedIn\s*$/i, "")
      .replace(/\s*[-–|]\s*Indonesia\s*$/i, "")
      .trim();

    const titlePatterns = [
      /[-–|,]\s*(.+?)\s+(?:at|di|@|pada)\s+(.+?)$/i,
      /^.+?\s*[-–|]\s*(.+?)\s*[-–|]\s*(.+?)$/i,
    ];

    for (const pattern of titlePatterns) {
      const match = title.match(pattern);
      if (match && match[1] && match[2]) {
        const posisi = match[1].trim();
        const perusahaan = match[2].trim();
        if (posisi.length > 2 && perusahaan.length > 1 && !perusahaan.toLowerCase().includes("linkedin")) {
          if (!extracted.posisi) extracted.posisi = posisi;
          if (!extracted.nama_perusahaan) extracted.nama_perusahaan = perusahaan;
          break;
        }
      }
    }

    // Fallback snippet LinkedIn
    if (!extracted.posisi || !extracted.nama_perusahaan) {
      const snippet = r.snippet;
      const snippetPatterns = [
        /(?:^|[\s·•])([A-Z][^\n·•]{3,40}?)\s+(?:at|di|@|pada)\s+([^\n·•.]{2,50})/i,
        /(?:sebagai|as|is a|is an|bekerja di)\s+([^\n.]{3,40}?)\s+(?:at|di|@|pada)\s+([^\n.]{2,50})/i,
        /(?:experience|pengalaman|current)\s*:?\s*([^\n·]{3,40}?)\s*[·•|]\s*([^\n·.]{2,50})/i,
        /([A-Z][A-Za-z\s]{3,35}?)\s*[-–]\s*([^\n·]{3,50}?)\s*[·•]/i,
      ];
      for (const pattern of snippetPatterns) {
        const match = snippet.match(pattern);
        if (match && match[1] && match[2]) {
          if (!extracted.posisi) extracted.posisi = match[1].trim();
          if (!extracted.nama_perusahaan) extracted.nama_perusahaan = match[2].trim().replace(/\s*[-–]\s*$/, "");
          break;
        }
      }
    }
  }

  // Fallback dari semua snippet
  if (!extracted.posisi && !extracted.nama_perusahaan) {
    for (const r of results) {
      const combined = `${r.title} ${r.snippet}`;
      const fallbackPatterns = [
        /(?:bekerja|kerja|works?|employed)\s+(?:di|at|@|sebagai)\s+([^\n.,]{3,50})/i,
        /(?:staff|karyawan|pegawai|anggota|guru|dosen|direktur|manager|engineer|developer)\s+(?:di|at|@|pada)\s+([^\n.,]{3,50})/i,
      ];
      for (const pattern of fallbackPatterns) {
        const match = combined.match(pattern);
        if (match && match[1]) {
          if (!extracted.nama_perusahaan) extracted.nama_perusahaan = match[1].trim();
          break;
        }
      }
      if (extracted.nama_perusahaan) break;
    }
  }

  // ── Kategori Pekerjaan ──
  if (extracted.nama_perusahaan) {
    const lower = (extracted.nama_perusahaan + " " + extracted.posisi).toLowerCase();

    const pnsKeywords = ["kementerian", "pemerintah", "badan", "dinas", "kabupaten", "kota", "provinsi",
      "polri", "tni", "asn", "cpns", "kemenkeu", "kemendikbud", "kemenag",
      "bps", "bpk", "bpjs", "rsud", "puskesmas", "kelurahan", "kecamatan",
      "aparatur", "negeri", "pengadilan", "kejaksaan", "mahkamah"];
    const akademisiKeywords = ["universitas", "institut", "sekolah", "kampus", "akademi", "politeknik",
      "stmik", "stie", "stai", "stkip", "dosen", "lecturer", "professor",
      "research", "riset", "peneliti"];
    const wirausahaKeywords = ["founder", "co-founder", "ceo", "owner", "pemilik", "pendiri", "self-employed",
      "wiraswasta", "wirausaha", "freelance", "entrepreneur"];

    if (pnsKeywords.some(k => lower.includes(k))) extracted.kategori_pekerjaan = "PNS";
    else if (akademisiKeywords.some(k => lower.includes(k))) extracted.kategori_pekerjaan = "Akademisi";
    else if (wirausahaKeywords.some(k => lower.includes(k))) extracted.kategori_pekerjaan = "Wirausaha";
    else extracted.kategori_pekerjaan = "Swasta";
  }

  // Bersihkan whitespace
  for (const key of Object.keys(extracted)) extracted[key] = extracted[key].trim();
  return extracted;
}

// ══════════════════════════════════════════════════
//  GEMINI AI ENHANCER (Random Key Rotation)
//  Setiap panggilan mengacak urutan key agar
//  tidak selalu menghantam key #1 yang sama.
// ══════════════════════════════════════════════════

const ALL_GEMINI_KEYS = (process.env.GEMINI_API_KEY || "").split(",").map(k => k.trim()).filter(Boolean);

async function enhanceWithGemini(name: string, keywordContext: string, searchResults: SearchResult[]): Promise<Record<string, string> | null> {
  if (ALL_GEMINI_KEYS.length === 0) return null;

  const keys = shuffleArray(ALL_GEMINI_KEYS);

  for (let i = 0; i < keys.length; i++) {
    try {
      const genAI = new GoogleGenerativeAI(keys[i]);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      let searchContext = "";
      searchResults.slice(0, 10).forEach((res, index) => {
        searchContext += `Tautan ${index + 1}:\nJudul: ${res.title}\nURL: ${res.url}\nDeskripsi: ${res.snippet}\n\n`;
      });

      const prompt = `Anda adalah asisten data intelijen. Saya memiliki hasil pencarian web untuk alumni bernama "${name}" dari "${keywordContext}".

Hasil pencarian:
${searchContext}

Ekstrak informasi berikut ke dalam JSON murni (tanpa markdown backtick):
{
  "linkedin_url": "",
  "ig_url": "",
  "fb_url": "",
  "tiktok_url": "",
  "email": "",
  "no_hp": "",
  "nama_perusahaan": "",
  "posisi": "",
  "kategori_pekerjaan": ""
}

Aturan kategori_pekerjaan: "PNS", "Swasta", "Wirausaha", "Akademisi", atau "" jika tidak diketahui.
Jika tidak yakin, isi dengan string kosong "". Jangan mengarang data. Hanya kembalikan output JSON.`;

      const result = await model.generateContent(prompt);
      let text = result.response.text();
      if (!text) continue;

      text = text.replace(/^```json\s*/gi, "").replace(/^```\s*/g, "").replace(/\s*```$/g, "").trim();

      try {
        return JSON.parse(text);
      } catch {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
      }
    } catch (err: any) {
      const msg = err.message || "";
      if (msg.includes("429") || msg.includes("quota") || msg.includes("Resource has been exhausted")) {
        console.log(`[Gemini] Key #${i + 1}/${keys.length} habis kuota, rotasi...`);
        if (i < keys.length - 1) await delay(500);
        continue;
      } else {
        console.error(`[Gemini] Error untuk "${name}":`, msg.substring(0, 150));
        return null;
      }
    }
  }

  console.log(`[Gemini] Semua ${keys.length} key habis kuota, lanjut dengan Regex saja.`);
  return null;
}

// ══════════════════════════════════════════════════
//  FUNGSI UTAMA: HYBRID SEARCH + GEMINI (ANTI-LIMIT)
//  
//  Strategi multi-query: coba 3 variasi query berbeda
//  sebelum menyerah, agar hit rate meningkat tanpa
//  membuang lebih banyak kuota per orang.
// ══════════════════════════════════════════════════

export async function scrapePersonData(
  name: string,
  keywordContext: string,
  extras?: { nim?: string; tahunLulus?: string }
): Promise<ScrapeResult> {
  try {
    let engineUsed: "ai" | "legacy" = "legacy";
    let allResults: SearchResult[] = [];

    // Bangun variasi query dari yang paling spesifik ke paling umum
    const queries: string[] = [];

    // Query 1: Paling spesifik — nama + konteks + linkedin
    queries.push(`"${name}" ${keywordContext} site:linkedin.com`);

    // Query 2: Nama + tahun lulus (jika ada) untuk disambiguasi
    if (extras?.tahunLulus) {
      queries.push(`"${name}" ${extras.tahunLulus} ${keywordContext} linkedin OR instagram OR facebook`);
    } else {
      queries.push(`"${name}" ${keywordContext} linkedin OR instagram OR facebook`);
    }

    // Query 3: Fallback umum — hanya nama tanpa tanda kutip
    queries.push(`${name} alumni ${keywordContext}`);

    // Coba setiap query hingga ada yang menghasilkan hasil relevan
    for (const query of queries) {
      if (allResults.length > 0) break;

      // Coba Serper dulu
      try {
        const serperResults = await searchSerper(query);
        if (serperResults.length > 0) {
          allResults = serperResults;
          console.log(`[Scraper] Query berhasil via Serper (${serperResults.length} hasil): ${query.substring(0, 60)}...`);
          break;
        }
      } catch (e: any) {
        if (e.message === "KUOTA_HABIS") {
          return { error: "Kuota Serper API Habis (Not enough credits)", engine: "legacy" };
        }
      }

      // Fallback: DuckDuckGo HTML
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
        const res = await fetch(url, {
          method: "GET",
          signal: controller.signal,
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const html = await res.text();
          const chunks = html.split('class="result__body"');
          const ddgResults: SearchResult[] = [];
          for (let i = 1; i < chunks.length && ddgResults.length < 15; i++) {
            const titleMatch = chunks[i].match(/<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
            if (titleMatch) {
              let link = titleMatch[1];
              if (link.includes('uddg=')) {
                const urlParam = link.match(/uddg=([^&]+)/);
                if (urlParam) link = decodeURIComponent(urlParam[1]);
              }
              const rawTitle = titleMatch[2].replace(/<[^>]+>/g, '').trim();
              if (link.startsWith('http')) ddgResults.push({ title: rawTitle, url: link, snippet: "" });
            }
          }
          if (ddgResults.length > 0) {
            allResults = ddgResults;
            console.log(`[Scraper] Query berhasil via DDG (${ddgResults.length} hasil): ${query.substring(0, 60)}...`);
            break;
          }
        }
      } catch {
        // DDG timeout/gagal, lanjut ke query berikutnya
      }
    }

    // Jika semua query & semua engine gagal menghasilkan apapun
    if (allResults.length === 0) {
      console.log(`[Scraper] Semua ${queries.length} query tidak menghasilkan hasil untuk: ${name}`);
      return { data: {}, engine: "legacy" };
    }

    // Ekstrak dengan Regex dari hasil pencarian
    const regexData = extractWithRegex(allResults);
    
    // Coba tingkatkan dengan Gemini AI jika hasil kurang dari 2 field
    const fieldsFound = Object.values(regexData).filter(v => v.length > 0).length;
    let finalData = regexData;

    if (fieldsFound < 2 && allResults.length > 0) {
      const geminiData = await enhanceWithGemini(name, keywordContext, allResults);
      if (geminiData) {
        for (const key of Object.keys(finalData)) {
          if (!finalData[key] && geminiData[key]) {
            finalData[key] = geminiData[key];
          }
        }
        engineUsed = "ai";
      }
    }

    return { data: finalData, engine: engineUsed };

  } catch (err: any) {
    console.error(`[Scraper] Fatal error untuk "${name}":`, err.message);
    return { error: err.message || "Scraper error", engine: "legacy" };
  }
}

