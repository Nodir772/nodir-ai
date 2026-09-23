export const USER_ERRORS = {
  missingKey: "Nodir AI AI xizmatiga ulanmagan.",
  missingKeyDetail: "Server konfiguratsiyasida OPENAI_API_KEY mavjud emas.",
  invalidKey: "OpenAI API kaliti noto‘g‘ri yoki yaroqsiz.",
  permission: "OpenAI API ruxsati yo'q. Hisob yoki loyiha sozlamalarini tekshiring.",
  quota:
    "OpenAI hisobida kredit qolmagan. Chat ishlashi uchun platform.openai.com → Billing ga kredit qo‘shing, keyin qayta yuboring.",
  unavailable: "AI xizmatida vaqtinchalik xatolik yuz berdi. Qayta urinib ko'ring.",
  retry: "Bir ozdan keyin qayta urinib ko'ring.",
  timeout: "Javob vaqti tugadi. Iltimos, qayta urinib ko'ring.",
  rateLimit: "Juda ko'p so'rov yuborildi. Biroz kuting.",
  empty: "AI javob qaytarmadi. Iltimos, qayta urinib ko'ring.",
  unauthorized: "Davom etish uchun tizimga kiring.",
  cancelled: "Javob to'xtatildi.",
  generic: "AI xizmatida vaqtinchalik xatolik yuz berdi. Qayta urinib ko'ring.",
  network: "AI serveriga ulanishda muammo yuz berdi.",
  model: "Tanlangan AI modeli mavjud emas yoki bu hisob uchun foydalanib bo'lmaydi.",
  badRequest: "AI so'rovi noto'g'ri formatda. Qayta urinib ko'ring.",
} as const;

export const AI_ERROR_CODES = [
  "MISSING_API_KEY",
  "INVALID_API_KEY",
  "INVALID_API_KEY_FORMAT",
  "OPENAI_API_ERROR",
  "RATE_LIMIT",
  "QUOTA",
  "NETWORK_ERROR",
  "MODEL_ERROR",
  "PERMISSION",
] as const;

export type AiErrorCode = (typeof AI_ERROR_CODES)[number];

export function missingApiKeyBody() {
  return {
    error: USER_ERRORS.missingKey,
    detail: USER_ERRORS.missingKeyDetail,
    code: "MISSING_API_KEY" as const,
  };
}

export function invalidApiKeyBody() {
  return {
    error: USER_ERRORS.invalidKey,
    detail: "OPENAI_API_KEY qiymati to'liq emas yoki OpenAI uni rad etdi.",
    code: "INVALID_API_KEY" as const,
  };
}

export function scrubProviderText(value: string) {
  return value.replace(/sk-[a-zA-Z0-9_\-]+/gi, "[redacted]").slice(0, 240);
}
