import { searchBrave, searchBuiltin, searchSerper, searchTavily } from "@/lib/search/providers";
import { assertSafeHttpUrl } from "@/lib/search/ssrf";
import type { SearchHit } from "@/lib/search/types";
import { stripHtml } from "@/lib/search/untrusted";

export type { SearchHit } from "@/lib/search/types";

const PAID_PROVIDERS = new Set(["tavily", "brave", "serper"]);

export function searchProviderName() {
  return process.env.SEARCH_PROVIDER?.trim().toLowerCase() ?? "";
}

export function isSearchConfigured() {
  const provider = searchProviderName();
  if (PAID_PROVIDERS.has(provider)) return Boolean(process.env.SEARCH_API_KEY?.trim());
  return true;
}

const FETCH_LIMIT = 80_000;

export async function searchWeb(query: string): Promise<{
  ok: boolean;
  configured: boolean;
  results: SearchHit[];
  error?: string;
}> {
  const q = query.trim();
  if (!q) {
    return { ok: false, configured: isSearchConfigured(), results: [], error: "Qidiruv so'rovi bo'sh." };
  }

  const key = process.env.SEARCH_API_KEY?.trim() ?? "";
  const provider = searchProviderName();

  try {
    const result =
      provider === "tavily" && key
        ? await searchTavily(q, key)
        : provider === "brave" && key
          ? await searchBrave(q, key)
          : provider === "serper" && key
            ? await searchSerper(q, key)
            : await searchBuiltin(q);

    if (!result.ok) {
      return { ok: false, configured: true, results: [], error: result.error };
    }
    return { ok: true, configured: true, results: result.results };
  } catch {
    return {
      ok: false,
      configured: true,
      results: [],
      error: "Xizmatda vaqtinchalik muammo yuz berdi.",
    };
  }
}

export async function fetchSearchResult(url: string) {
  try {
    const safe = assertSafeHttpUrl(url);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8_000);
    const response = await fetch(safe.toString(), {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { Accept: "text/html,text/plain;q=0.9" },
    });
    clearTimeout(timer);
    if (!response.ok) {
      return { ok: false as const, error: "Sahifani o'qib bo'lmadi." };
    }
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
      return { ok: false as const, error: "Bu sahifa turi qo'llab-quvvatlanmaydi." };
    }
    const reader = response.body?.getReader();
    if (!reader) return { ok: false as const, error: "Sahifani o'qib bo'lmadi." };
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        size += value.byteLength;
        if (size > FETCH_LIMIT) break;
        chunks.push(value);
      }
    }
    const decoder = new TextDecoder();
    const raw = chunks.map((chunk) => decoder.decode(chunk, { stream: true })).join("");
    const text = stripHtml(raw).slice(0, 6_000);
    return { ok: true as const, url: safe.toString(), text };
  } catch {
    return { ok: false as const, error: "Sahifani xavfsiz o'qib bo'lmadi." };
  }
}
