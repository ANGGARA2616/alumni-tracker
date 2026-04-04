import * as cheerio from 'cheerio';

export async function scrapePersonData(name: string, keywordContext: string) {
  // Menggunakan Yahoo Search Scraper native (Gratis, Bypass Limit/Anomaly)
  const query = `"${name}" ${keywordContext} linkedin OR instagram OR facebook OR tiktok`;
  
  try {
    const res = await fetch(`https://id.search.yahoo.com/search?p=${encodeURIComponent(query)}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
      }
    });

    const html = await res.text();
    const $ = cheerio.load(html);
    const apiResults: any[] = [];

    $(".algo").each((i, el) => {
      const title = $(el).find(".title").text().trim();
      const rawUrl = $(el).find(".title a").attr("href") || "";
      const snippet = $(el).find(".compText").text().trim();
      
      // Bersihkan url yahoo redirect (menghilangkan trailing tracking slash seperti /RK=.../RS=...)
      let cleanUrl = rawUrl;
      const ruPart = rawUrl.split('/').find(p => p.startsWith('RU='));
      if (ruPart) {
          cleanUrl = decodeURIComponent(ruPart.substring(3));
      }

      if (title) apiResults.push({ title, url: cleanUrl, description: snippet });
    });

    if (apiResults.length === 0) {
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
      sosmed_perusahaan: ""
    };

    // Gabungkan hasil title, url, snippet untuk ekstraksi regex
    apiResults.forEach((item: any) => {
        const textToSearch = `${item.title} ${item.description} ${item.url}`.toLowerCase();
        combinedSnippets += textToSearch + " | ";

        // 1. Ekstrak URL Sosmed yang valid (Filter ketat homepage/generic links)
        const urlRaw = item.url;
        const urlL = urlRaw.toLowerCase();

        if (!extractedData.linkedin_url && urlL.includes("linkedin.com/in/")) {
            extractedData.linkedin_url = urlRaw;
        }

        const pathIG = urlL.split("instagram.com/")[1];
        if (!extractedData.ig_url && pathIG && pathIG.length > 2 && !pathIG.startsWith("p/") && !pathIG.startsWith("reels/") && !pathIG.startsWith("explore")) {
            extractedData.ig_url = urlRaw;
        }

        const pathFB = urlL.split("facebook.com/")[1];
        if (!extractedData.fb_url && pathFB && pathFB.length > 2 && !pathFB.startsWith("index.php") && !pathFB.startsWith("login") && !pathFB.startsWith("public") && !pathFB.startsWith("search")) {
            extractedData.fb_url = urlRaw;
        }

        if (!extractedData.tiktok_url && urlL.includes("tiktok.com/@")) {
            extractedData.tiktok_url = urlRaw;
        }
    });

    // 2. Ekstrak Email
    const emailMatch = combinedSnippets.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/i);
    if (emailMatch) extractedData.email = emailMatch[1];

    // 3. Ekstrak No HP (Format Indonesia Umum)
    const phoneMatch = combinedSnippets.match(/(\+62|62|0)[0-9]{2,3}[-.\s]?[0-9]{4,5}[-.\s]?[0-9]{3,5}/);
    if (phoneMatch) extractedData.no_hp = phoneMatch[0];

    // 4. Analisis Tempat Kerja Sederhana dari Snippet LinkedIn
    apiResults.forEach((item: any) => {
        if (item.url.includes("linkedin.com/in/") && !extractedData.nama_perusahaan) {
            const parts = item.title.split(" - ");
            if (parts.length >= 3) {
                extractedData.posisi = parts[1].trim();
                extractedData.nama_perusahaan = parts[2].replace("| LinkedIn", "").replace("- LinkedIn", "").trim();
            }
        }
    });

    // 5. Coba Analisis Kategori PNS/Swasta
    if (combinedSnippets.includes("kementerian") || combinedSnippets.includes("pemerintah") || combinedSnippets.includes("dinas") || combinedSnippets.includes("pns")) {
        extractedData.kategori_pekerjaan = "PNS";
    } else if (combinedSnippets.includes("pt ") || combinedSnippets.includes("bank") || combinedSnippets.includes("cv ")) {
        extractedData.kategori_pekerjaan = "Swasta";
    } else if (combinedSnippets.includes("founder") || combinedSnippets.includes("owner") || combinedSnippets.includes("ceo")) {
        extractedData.kategori_pekerjaan = "Wirausaha";
    }

    return { data: extractedData };

  } catch (err: any) {
    return { error: err.message || "Gagal menghubungi mesin pencari" };
  }
}

