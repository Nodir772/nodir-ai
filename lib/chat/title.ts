const GREETING_RE =
  /^(salom|assalomu alaykum|hello|hi|hey|yo|qalaysiz|yahshimisiz)[\s!.?]*$/i;

export function normalizeTitleSource(text: string) {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\[Hujjat:[^\]]+\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isMeaningfulMessage(text: string) {
  const clean = normalizeTitleSource(text);
  if (clean.length < 12) return false;
  if (GREETING_RE.test(clean)) return false;
  return true;
}

export function generateTitle(text: string) {
  const clean = normalizeTitleSource(text);
  if (!clean) return "Yangi suhbat";
  const sentence = clean.split(/(?<=[.!?])\s+/)[0] ?? clean;
  const clipped = sentence.length > 48 ? `${sentence.slice(0, 48).trimEnd()}…` : sentence;
  return clipped || "Yangi suhbat";
}

/** Reserved for a later cheap/async AI title call. */
export async function generateTitleWithAi(text: string): Promise<string | null> {
  void text;
  return null;
}
