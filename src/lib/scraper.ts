import * as cheerio from 'cheerio';

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

type SearchResult = { title: string; url: string; description: string };

// ──────────────────────────────────────────────────
// Pool besar SearXNG instances (dari searx.space registry)
// Dipilih berdasarkan uptime >99%, search success >0%, dan Google engine aktif
// ──────────────────────────────────────────────────
const SEARXNG_POOL = [
  "https://search.sapti.me",
  "https://opnxng.com",
  "https://searx.ox2.fr",
  "https://search.ononoki.org",
  "https://grep.vim.wtf",
  "https://kantan.cat",
  "https://o5.gg",
  "https://ooglester.com",
  "https://priv.au",
  "https://search.2b9t.xyz",
  "https://search.abohiccups.com",
  "https://search.bladerunn.in",
  "https://etsi.me",
  "https://copp.gg",
  "https://search.charliewhiskey.net",
];

/** Pilih N instance acak dari pool */
function pickRandom(arr: string[], n: number): string[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

// ──────────────────────────────────────────────────
// SearXNG Search (HTML scraping)
// Coba maks 4 instance acak, berhenti begitu dapat hasil
// ──────────────────────────────────────────────────
async function searchSearXNG(query: string): Promise<SearchResult[]> {
  const candidates = pickRandom(SEARXNG_POOL, 4);

  for (const instance of candidates) {
    try {
      const res = await fetch(`${instance}/search?q=${encodeURIComponent(query)}&language=id`, {
        headers: { "User-Agent": UA },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) continue;

      const html = await res.text();
      const $ = cheerio.load(html);
      const results: SearchResult[] = [];

      $("article.result, div.result").each((_i, el) => {
        const title = $(el).find("h3 a, h4 a, .result_header a").first().text().trim();
        const url = $(el).find("h3 a, h4 a, .result_header a").first().attr("href") || "";
        const snippet = $(el).find("p.content, .result-content, .result__snippet").first().text().trim();
        if (title && url.startsWith("http")) {
          results.push({ title, url, description: snippet });
        }
      });

      if (results.length > 0) return results;
    } catch {
      // Instance gagal/timeout, coba berikutnya
    }
  }
  return [];
}

// ──────────────────────────────────────────────────
// Fallback: Yahoo Search
// ──────────────────────────────────────────────────
function cleanYahooUrl(rawUrl: string): string {
  const match = rawUrl.match(/\/RU=(.*?)\/RK=/);
  if (match && match[1]) return decodeURIComponent(match[1]);
  return rawUrl;
}

async function searchYahoo(query: string): Promise<SearchResult[]> {
  try {
    const res = await fetch(`https://search.yahoo.com/search?p=${encodeURIComponent(query)}&n=15`, {
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(10000),
    });
    const html = await res.text();
    const $ = cheerio.load(html);
    const results: SearchResult[] = [];

    $(".algo").each((_i, el) => {
      const title = $(el).find(".title").text().trim();
      const rawUrl = $(el).find(".title a").attr("href") || "";
      const snippet = $(el).find(".compText").text().trim();
      const cleanUrl = cleanYahooUrl(rawUrl);
      if (title && cleanUrl.startsWith("http")) {
        results.push({ title, url: cleanUrl, description: snippet });
      }
    });
    return results;
  } catch {
    return [];
  }
}

// ──────────────────────────────────────────────────
// Gabungkan hasil pencarian
// ──────────────────────────────────────────────────
async function multiSearch(query: string): Promise<SearchResult[]> {
  // Prioritas: SearXNG dulu, Yahoo sebagai fallback
  const searxResults = await searchSearXNG(query);
  if (searxResults.length >= 3) return searxResults;

  const yahooResults = await searchYahoo(query);

  const seen = new Set<string>();
  const combined: SearchResult[] = [];
  for (const item of [...searxResults, ...yahooResults]) {
    const normalized = item.url.toLowerCase().replace(/\/+$/, "");
    if (!seen.has(normalized)) {
      seen.add(normalized);
      combined.push(item);
    }
  }
  return combined;
}

// ──────────────────────────────────────────────────
// Validasi URL sosial media
// ──────────────────────────────────────────────────
function isValidLinkedIn(url: string): boolean {
  const m = url.toLowerCase().match(/linkedin\.com\/in\/([^/?#]+)/);
  return !!m && m[1].length > 1;
}

function isValidInstagram(url: string): boolean {
  const m = url.toLowerCase().match(/instagram\.com\/([^/?#]+)/);
  if (!m) return false;
  const path = m[1];
  const blocked = ["p", "reels", "reel", "explore", "stories", "accounts", "about", "directory", ""];
  return path.length > 1 && !blocked.includes(path);
}

function isValidFacebook(url: string): boolean {
  const urlL = url.toLowerCase();
  if (/facebook\.com\/.*\/(posts|photos|photo|videos|reel|reels|share|story)\//i.test(urlL)) return false;
  const m = urlL.match(/facebook\.com\/([^/?#]+)/);
  if (!m) return false;
  const path = m[1];
  const blocked = ["login", "login.php", "search", "public", "index.php", "watch", "marketplace", "groups", "events", "pages", "help", "reel", "reels", "share", "photo", "photos", "videos", "story", "stories", ""];
  return path.length > 1 && !blocked.includes(path);
}

function isValidTikTok(url: string): boolean {
  return /tiktok\.com\/@[a-zA-Z0-9_.]{2,}/.test(url);
}

// ──────────────────────────────────────────────────
// Fungsi Utama OSINT Scraper
// ──────────────────────────────────────────────────
export async function scrapePersonData(name: string, keywordContext: string) {
  try {
    // 2 kueri paralel: sosmed umum + LinkedIn spesifik
    const socialQuery = `"${name}" ${keywordContext} linkedin OR instagram OR facebook OR tiktok`;
    const linkedinQuery = `"${name}" linkedin.com/in`;

    const [socialResults, linkedinResults] = await Promise.all([
      multiSearch(socialQuery),
      multiSearch(linkedinQuery),
    ]);

    // Gabungkan, prioritas LinkedIn
    const seen = new Set<string>();
    const allResults: SearchResult[] = [];
    for (const item of [...linkedinResults, ...socialResults]) {
      const norm = item.url.toLowerCase().replace(/\/+$/, "");
      if (!seen.has(norm)) {
        seen.add(norm);
        allResults.push(item);
      }
    }

    if (allResults.length === 0) {
      return { data: {} };
    }

    let combinedSnippets = "";
    const extractedData = {
      linkedin_url: "",
      ig_url: "",
      fb_url: "",
      tiktok_url: "",
      email: "",
      no_hp: "",
      nama_perusahaan: "",
      alamat_perusahaan: "",
      posisi: "",
      kategori_pekerjaan: "",
      sosmed_perusahaan: "",
    };

    // ── Fase 1: Ekstrak URL sosial media ──
    for (const item of allResults) {
      const textToSearch = `${item.title} ${item.description} ${item.url}`.toLowerCase();
      combinedSnippets += textToSearch + " | ";

      if (!extractedData.linkedin_url && isValidLinkedIn(item.url)) {
        extractedData.linkedin_url = item.url;
      }
      if (!extractedData.ig_url && isValidInstagram(item.url)) {
        extractedData.ig_url = item.url;
      }
      if (!extractedData.fb_url && isValidFacebook(item.url)) {
        extractedData.fb_url = item.url;
      }
      if (!extractedData.tiktok_url && isValidTikTok(item.url)) {
        extractedData.tiktok_url = item.url;
      }
    }

    // ── Fase 2: Ekstrak Email ──
    const emailMatch = combinedSnippets.match(/([a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
    if (emailMatch) {
      const foundEmail = emailMatch[1].toLowerCase();
      const blockedDomains = ["example.com", "sentry.io", "email.com", "abc.com"];
      if (!blockedDomains.some(d => foundEmail.endsWith(d))) {
        extractedData.email = foundEmail;
      }
    }

    // ── Fase 3: Ekstrak No HP (Format Indonesia Ketat) ──
    const phoneMatch = combinedSnippets.match(/(?:^|[\s(])((?:\+62|62|08)\d{8,12})(?:[\s).,$]|$)/);
    if (phoneMatch) extractedData.no_hp = phoneMatch[1];

    // ── Fase 4: Analisis Tempat Kerja dari LinkedIn ──
    for (const item of allResults) {
      if (isValidLinkedIn(item.url) && !extractedData.nama_perusahaan) {
        const cleanTitle = item.title.replace(/\|?\s*LinkedIn\s*$/i, "").replace(/ - LinkedIn$/i, "").trim();
        const parts = cleanTitle.split(" - ").map(p => p.trim()).filter(Boolean);

        if (parts.length >= 3) {
          const possiblePosition = parts[1];
          const possibleCompany = parts[2];
          const isJobTitle = /\b(manager|engineer|developer|founder|ceo|cto|cfo|coo|director|head|lead|staff|specialist|analyst|consultant|intern|vp|president|officer|coordinator|admin|supervisor|assistant|executive|associate|strategist|operator|technician|mentor|advisor|teacher|dosen|mahasiswa|student)\b/i.test(possiblePosition);
          if (isJobTitle) {
            extractedData.posisi = possiblePosition;
            extractedData.nama_perusahaan = possibleCompany;
          } else {
            extractedData.nama_perusahaan = possiblePosition;
          }
        } else if (parts.length === 2) {
          const second = parts[1];
          if (/\b(manager|engineer|developer|founder|ceo|cto|cfo|coo|director|head|lead|staff|specialist|analyst|consultant|intern|vp|president|officer)\b/i.test(second)) {
            extractedData.posisi = second;
          } else {
            extractedData.nama_perusahaan = second;
          }
        }

        // Bersihkan data tidak valid
        const invalidPatterns = /^(--|\.\.+|…|https?:\/\/|student at|mahasiswa|n\/a|personal|profile)/i;
        if (
          extractedData.nama_perusahaan.length > 60 ||
          extractedData.nama_perusahaan.length < 3 ||
          invalidPatterns.test(extractedData.nama_perusahaan.replace(/\s*-\s*$/, "")) ||
          extractedData.nama_perusahaan.includes("|")
        ) {
          extractedData.nama_perusahaan = "";
        }
        if (extractedData.posisi.length > 60 || extractedData.posisi.includes("|")) {
          extractedData.posisi = "";
        }
      }
    }

    // ── Fase 5: Analisis Kategori Pekerjaan ──
    if (combinedSnippets.includes("kementerian") || combinedSnippets.includes("pemerintah") || combinedSnippets.includes("dinas") || combinedSnippets.includes(" pns") || combinedSnippets.includes(" asn")) {
      extractedData.kategori_pekerjaan = "PNS";
    } else if (combinedSnippets.includes(" pt ") || combinedSnippets.includes("bank ") || combinedSnippets.includes(" cv ") || combinedSnippets.includes("tbk")) {
      extractedData.kategori_pekerjaan = "Swasta";
    } else if (combinedSnippets.includes("founder") || combinedSnippets.includes("owner") || combinedSnippets.includes(" ceo")) {
      extractedData.kategori_pekerjaan = "Wirausaha";
    } else if (combinedSnippets.includes("universitas") || combinedSnippets.includes("dosen") || combinedSnippets.includes("lecturer") || combinedSnippets.includes("professor")) {
      extractedData.kategori_pekerjaan = "Akademisi";
    }

    return { data: extractedData };

  } catch (err: any) {
    return { error: err.message || "Gagal menghubungi mesin pencari" };
  }
}
