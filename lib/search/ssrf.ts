function isPrivateIPv4(host: string) {
  const parts = host.split(".").map((part) => Number.parseInt(part, 10));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return false;
  const [a, b] = parts;
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

export function assertSafeHttpUrl(raw: string) {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("URL noto'g'ri.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Faqat http(s) manzillariga ruxsat.");
  }
  const host = url.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host === "::1" ||
    host === "0.0.0.0" ||
    host.endsWith(".internal") ||
    host === "metadata.google.internal"
  ) {
    throw new Error("Ichki manzillarga ruxsat yo'q.");
  }
  if (isPrivateIPv4(host)) {
    throw new Error("Ichki manzillarga ruxsat yo'q.");
  }
  return url;
}
