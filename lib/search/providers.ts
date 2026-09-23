import type { SearchHit } from "@/lib/search/types";

type ProviderResult = { ok: true; results: SearchHit[] } | { ok: false; error: string };

function asHits(
  items: Array<{ title?: string; url?: string; snippet?: string } | null | undefined>,
): SearchHit[] {
  const hits: SearchHit[] = [];
  for (const item of items) {
    if (!item?.url || !item.title) continue;
    try {
      const url = new URL(item.url);
      if (url.protocol !== "http:" && url.protocol !== "https:") continue;
      hits.push({
        title: item.title.slice(0, 200),
        url: url.toString(),
        snippet: (item.snippet ?? "").slice(0, 280),
        domain: url.hostname.replace(/^www\./, ""),
      });
    } catch {
      continue;
    }
  }
  return hits.slice(0, 6);
}

export async function searchTavily(query: string, apiKey: string): Promise<ProviderResult> {
  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      max_results: 5,
      include_answer: false,
    }),
  });
  if (!response.ok) {
    return { ok: false, error: "Qidiruv xizmatida xatolik yuz berdi." };
  }
  const json = (await response.json()) as {
    results?: { title?: string; url?: string; content?: string }[];
  };
  return {
    ok: true,
    results: asHits(
      (json.results ?? []).map((item) => ({
        title: item.title,
        url: item.url,
        snippet: item.content,
      })),
    ),
  };
}

export async function searchBrave(query: string, apiKey: string): Promise<ProviderResult> {
  const url = new URL("https://api.search.brave.com/res/v1/web/search");
  url.searchParams.set("q", query);
  url.searchParams.set("count", "5");
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "X-Subscription-Token": apiKey,
    },
  });
  if (!response.ok) {
    return { ok: false, error: "Qidiruv xizmatida xatolik yuz berdi." };
  }
  const json = (await response.json()) as {
    web?: { results?: { title?: string; url?: string; description?: string }[] };
  };
  return {
    ok: true,
    results: asHits(
      (json.web?.results ?? []).map((item) => ({
        title: item.title,
        url: item.url,
        snippet: item.description,
      })),
    ),
  };
}

export async function searchSerper(query: string, apiKey: string): Promise<ProviderResult> {
  const response = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
    body: JSON.stringify({ q: query, num: 5 }),
  });
  if (!response.ok) {
    return { ok: false, error: "Qidiruv xizmatida xatolik yuz berdi." };
  }
  const json = (await response.json()) as {
    organic?: { title?: string; link?: string; snippet?: string }[];
  };
  return {
    ok: true,
    results: asHits(
      (json.organic ?? []).map((item) => ({
        title: item.title,
        url: item.link,
        snippet: item.snippet,
      })),
    ),
  };
}

function decodeHref(href: string) {
  try {
    const url = new URL(href, "https://duckduckgo.com");
    const uddg = url.searchParams.get("uddg");
    if (uddg) return uddg;
    if (url.protocol === "http:" || url.protocol === "https:") return url.toString();
  } catch {
    return null;
  }
  return null;
}

export function parseDuckDuckGoHtml(html: string) {
  const links: Array<{ title?: string; url?: string }> = [];
  const linkRe = /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;
  while ((match = linkRe.exec(html))) {
    links.push({
      url: decodeHref(match[1].replace(/&amp;/g, "&")) ?? undefined,
      title: match[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
    });
  }
  const snippets: string[] = [];
  const snipRe = /class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\//gi;
  while ((match = snipRe.exec(html))) {
    snippets.push(match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
  }
  return asHits(
    links.map((link, index) => ({
      ...link,
      snippet: snippets[index] ?? "",
    })),
  );
}

export function parseWikipediaOpensearch(payload: unknown) {
  if (!Array.isArray(payload) || payload.length < 4) return asHits([]);
  const titles = Array.isArray(payload[1]) ? payload[1] : [];
  const snippets = Array.isArray(payload[2]) ? payload[2] : [];
  const urls = Array.isArray(payload[3]) ? payload[3] : [];
  return asHits(
    titles.map((title, index) => ({
      title: typeof title === "string" ? title : "",
      url: typeof urls[index] === "string" ? urls[index] : "",
      snippet: typeof snippets[index] === "string" ? snippets[index] : "",
    })),
  );
}

const SEARCH_UA = "NodirAI/0.1 (web-search; local)";

export async function searchDuckDuckGo(query: string): Promise<ProviderResult> {
  const response = await fetch("https://html.duckduckgo.com/html/", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "text/html",
      "User-Agent": SEARCH_UA,
    },
    body: new URLSearchParams({ q: query, kl: "wt-wt" }).toString(),
  });
  if (!response.ok) {
    return { ok: false, error: "Qidiruv xizmatida xatolik yuz berdi." };
  }
  const html = await response.text();
  const results = parseDuckDuckGoHtml(html);
  if (!results.length) return { ok: false, error: "Qidiruv natija bermadi." };
  return { ok: true, results };
}

export async function searchWikipedia(query: string): Promise<ProviderResult> {
  const host = /[ўғқҳ]|o['‘’ʻ]|g['‘’ʻ]|nima|qanday|qil|uzbek/i.test(query)
    ? "uz.wikipedia.org"
    : "en.wikipedia.org";
  const url = new URL(`https://${host}/w/api.php`);
  url.searchParams.set("action", "opensearch");
  url.searchParams.set("search", query);
  url.searchParams.set("limit", "5");
  url.searchParams.set("namespace", "0");
  url.searchParams.set("format", "json");
  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": SEARCH_UA },
  });
  if (!response.ok) {
    return { ok: false, error: "Qidiruv xizmatida xatolik yuz berdi." };
  }
  const results = parseWikipediaOpensearch(await response.json());
  if (!results.length) return { ok: false, error: "Qidiruv natija bermadi." };
  return { ok: true, results };
}

export async function searchBuiltin(query: string): Promise<ProviderResult> {
  const ddg = await searchDuckDuckGo(query).catch(
    (): ProviderResult => ({ ok: false, error: "Qidiruv xizmatida xatolik yuz berdi." }),
  );
  if (ddg.ok && ddg.results.length) return ddg;
  const wiki = await searchWikipedia(query).catch(
    (): ProviderResult => ({ ok: false, error: "Qidiruv xizmatida xatolik yuz berdi." }),
  );
  if (wiki.ok && wiki.results.length) return wiki;
  return { ok: false, error: ddg.ok ? "Qidiruv natija bermadi." : ddg.error };
}

