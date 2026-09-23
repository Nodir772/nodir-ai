const SENSITIVE_PATTERNS: RegExp[] = [
  /password\s*[:=]/i,
  /parol\s*[:=]/i,
  /api[_-]?key/i,
  /secret[_-]?key/i,
  /bearer\s+[a-z0-9._-]{12,}/i,
  /sk-[a-z0-9]{10,}/i,
  /eyj[a-z0-9_-]{20,}\.[a-z0-9_-]+\./i,
  /\b(?:\d[ -]*?){13,19}\b/,
  /\b\d{3}-\d{2}-\d{4}\b/,
  /private[_-]?key/i,
  /authorization:\s/i,
];

export function isSensitiveMemory(content: string) {
  const text = content.trim();
  if (!text) return true;
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(text));
}

export const SENSITIVE_MEMORY_ERROR =
  "Bu ma'lumotni xotiraga yozib bo'lmaydi (maxfiy yoki shaxsiy ma'lumot).";
