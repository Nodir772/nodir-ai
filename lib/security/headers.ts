/** Safe on HTML and JSON. Do not set Content-Encoding or Content-Length on SSE streams. */

export const PAGE_SECURITY_HEADERS: { key: string; value: string }[] = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  {
    key: "Permissions-Policy",
    value: "camera=(), geolocation=(), payment=(), microphone=(self)",
  },
];

export const STREAM_HEADERS: Record<string, string> = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no",
};

export function applySecurityHeaders(headers: Headers) {
  for (const item of PAGE_SECURITY_HEADERS) {
    headers.set(item.key, item.value);
  }
  return headers;
}
