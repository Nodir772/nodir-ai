/** User-facing errors only. Never return stack traces or provider internals. */

export function friendlyError(error: unknown, fallback = "Xatolik yuz berdi. Iltimos, qayta urinib ko'ring.") {
  if (typeof error === "string" && error.trim() && !looksLikeStack(error)) return error.trim();
  if (error && typeof error === "object" && "error" in error) {
    const value = (error as { error?: unknown }).error;
    if (typeof value === "string" && value.trim() && !looksLikeStack(value)) return value.trim();
  }
  if (error instanceof Error && error.message && !looksLikeStack(error.message) && error.name !== "Error") {
    return fallback;
  }
  return fallback;
}

function looksLikeStack(value: string) {
  return value.includes("\n    at ") || value.includes("TypeError:") || value.includes("ENOENT");
}

export const UI_ERRORS = {
  offline: "Internet aloqasi yo'q. Qayta urinib ko'ring.",
  interrupted: "Aloqa uzildi. Qayta urinib ko'ring.",
  generic: "Xatolik yuz berdi. Iltimos, qayta urinib ko'ring.",
  emptySearch: "Hech narsa topilmadi.",
  emptyFavorites: "Hozircha sevimlilar yo'q.",
  emptyChats: "Hozircha suhbat yo'q.",
} as const;
