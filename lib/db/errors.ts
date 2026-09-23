export const DB_ERRORS = {
  load: "Ma'lumotlarni yuklashda xatolik yuz berdi.",
  notFound: "Suhbat topilmadi.",
  forbidden: "Bu suhbatga kirish huquqingiz yo'q.",
  save: "Ma'lumotlarni saqlashda xatolik yuz berdi.",
  unavailable: "Ma'lumotlar bazasiga ulanishda xatolik yuz berdi.",
  unauthorized: "Davom etish uchun tizimga kiring.",
  network: "Internet aloqasida muammo yuz berdi. Qayta urinib ko'ring.",
} as const;

export function jsonDbError(error: unknown, fallback = DB_ERRORS.unavailable) {
  return {
    error: fallback,
    code: "DATABASE_ERROR",
  };
}
