export type SupabasePublicConfig = {
  url: string;
  anonKey: string;
};

const URL_NAME = "NEXT_PUBLIC_SUPABASE_URL" as const;
const ANON_NAME = "NEXT_PUBLIC_SUPABASE_ANON_KEY" as const;

export const SUPABASE_MISSING_CONFIG = "Supabase konfiguratsiyasi topilmadi.";
export const SUPABASE_AUTH_ERROR = "Kirishda xatolik yuz berdi.";
export const SUPABASE_NETWORK_ERROR = "Supabase serveriga ulanishda muammo yuz berdi.";

export function sanitizeSupabaseEnvValue(raw: string | undefined | null) {
  if (!raw) return "";
  return raw
    .replace(/^\uFEFF/, "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .trim();
}

function readProcessValue(name: typeof URL_NAME | typeof ANON_NAME) {
  const direct =
    name === URL_NAME
      ? process.env.NEXT_PUBLIC_SUPABASE_URL
      : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Next inlines a direct `process.env.NEXT_PUBLIC_*` read into the bundle.
  // A dynamic lookup stays live, so a dev-server restart sees `.env.local`
  // even when an older compile still has an empty inlined string.
  const dynamic = process.env[name];
  return sanitizeSupabaseEnvValue(direct) || sanitizeSupabaseEnvValue(dynamic);
}

export function isPlausibleSupabaseUrl(value: string) {
  if (!value) return false;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    return Boolean(url.hostname);
  } catch {
    return false;
  }
}

function jwtRole(token: string) {
  const segment = token.split(".")[1];
  if (!segment) return null;
  try {
    const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const json = JSON.parse(globalThis.atob(padded)) as { role?: unknown };
    return typeof json.role === "string" ? json.role : null;
  } catch {
    return null;
  }
}

/** Public anon / publishable keys only. Service-role secrets are rejected. */
export function isPlausibleAnonKey(value: string) {
  if (value.length < 20) return false;
  if (value.startsWith("sb_secret_")) return false;
  const role = jwtRole(value);
  if (role === "service_role") return false;
  if (role === "anon") return true;
  if (value.startsWith("sb_publishable_")) return true;
  return value.startsWith("eyJ") && role === null;
}

export function missingSupabaseEnv() {
  const missing: string[] = [];
  if (!isPlausibleSupabaseUrl(readProcessValue(URL_NAME))) missing.push(URL_NAME);
  if (!isPlausibleAnonKey(readProcessValue(ANON_NAME))) missing.push(ANON_NAME);
  return missing;
}

export function getSupabasePublicConfig(): SupabasePublicConfig | null {
  const url = readProcessValue(URL_NAME);
  const anonKey = readProcessValue(ANON_NAME);
  if (!isPlausibleSupabaseUrl(url) || !isPlausibleAnonKey(anonKey)) return null;
  return { url, anonKey };
}

export function isSupabaseConfigured() {
  return getSupabasePublicConfig() !== null;
}

/** Safe diagnostic. Names and secrets are never included. */
export function publicSupabaseStatus() {
  return { supabaseConfigured: isSupabaseConfigured() };
}

export function supabaseAuthErrorMessage(error: { message?: string; name?: string } | null | undefined) {
  const message = (error?.message ?? "").toLowerCase();
  const name = error?.name ?? "";
  if (
    name === "AuthRetryableFetchError" ||
    message.includes("fetch") ||
    message.includes("network") ||
    message.includes("failed to fetch") ||
    message.includes("enotfound") ||
    message.includes("econnrefused")
  ) {
    return SUPABASE_NETWORK_ERROR;
  }
  if (message.includes("invalid login") || message.includes("invalid credentials")) {
    return "Email yoki parol noto'g'ri.";
  }
  return SUPABASE_AUTH_ERROR;
}
