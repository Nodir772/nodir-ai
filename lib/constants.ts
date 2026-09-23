export const SITE_NAME = "Nodir AI";
export const SITE_TAGLINE =
  "Savollar bering, g'oyalar yarating, o'rganing, kod yozing — hammasi bitta joyda.";

export const AVATAR_SRC = "/images/nodir-avatar.jpg";

export const NAV_LINKS = [
  { href: "/", label: "Bosh sahifa" },
  { href: "/#xususiyatlar", label: "Xususiyatlar" },
  { href: "/pricing", label: "Narxlar" },
  { href: "/#savollar", label: "Savollar" },
  { href: "/#aloqa", label: "Aloqa" },
] as const;

export const FEATURE_SHORTCUTS = [
  { href: "/chat", label: "Chat", hint: "Suhbat" },
  { href: "/tools/image", label: "Rasm yaratish", hint: "Tasvir" },
  { href: "/tools/code", label: "Kod yozish", hint: "Dasturlash" },
  { href: "/tools/translate", label: "Tarjima", hint: "Tillar" },
  { href: "/tools/documents", label: "Hujjat tahlili", hint: "Fayllar" },
] as const;

export const FEATURE_CARDS = [
  {
    id: "chat",
    title: "AI Chat",
    description:
      "Tabiiy tilda suhbatlashing. Savollarga aniq, kontekstni hisobga olgan javoblar oling.",
  },
  {
    id: "writing",
    title: "Matn yozish",
    description:
      "Maqola, xat, post yoki hisobot — uslubingizga mos matnlar yarating.",
  },
  {
    id: "code",
    title: "Kod yozish",
    description:
      "Kod yozing, tuzating va tushuntiring. Bir nechta tillar va frameworklar bilan ishlaydi.",
  },
  {
    id: "translate",
    title: "Tarjima",
    description:
      "Ma'noni saqlagan holda tillar o'rtasida tarjima qiling va tahrirlang.",
  },
  {
    id: "learn",
    title: "Dars va tushuntirish",
    description:
      "Murakkab mavzularni sodda qilib tushuntirish, misollar va qadam-baqadam yondashuv.",
  },
  {
    id: "docs",
    title: "Hujjat bilan ishlash",
    description:
      "Hujjatlarni tahlil qiling, xulosa chiqaring va savollarga asoslangan javob oling.",
  },
] as const;

export const BENEFITS = [
  {
    title: "Tez va aniq javoblar",
    description: "Ish oqimini to'xtatmasdan, kerakli javobni tezroq toping.",
  },
  {
    title: "Zamonaviy AI texnologiyalari",
    description:
      "Server tomonida xavfsiz ulangan AI modellari orqali ishlaydigan arxitektura.",
  },
  {
    title: "Qulay va sodda interfeys",
    description: "Chalg'itmaydigan, tez va professional suhbat muhiti.",
  },
  {
    title: "Xavfsizlik va maxfiylik",
    description:
      "Kalitlar brauzerga chiqmaydi. Sessiya va ma'lumotlar serverda himoyalanadi.",
  },
] as const;

export const FAQS = [
  {
    question: "Nodir AI nima?",
    answer:
      "Nodir AI — suhbat, yozish, kod, tarjima va hujjat tahlilini bitta joyda birlashtirgan shaxsiy sun'iy intellekt platformasi.",
  },
  {
    question: "Hozircha qanday ishlaydi?",
    answer:
      "Chat, vositalar va tariflar ishlaydi. AI javoblari serverdagi OpenAI API orqali keladi. Kalit .env.local orqali sozlanadi.",
  },
  {
    question: "Ma'lumotlarim xavfsizmi?",
    answer:
      "API kalitlari brauzerga chiqmaydi. Hisob va suhbatlar Supabase RLS bilan himoyalanadi. Chat matnlari monitoringga yozilmaydi.",
  },
  {
    question: "Qaysi tillarda ishlaydi?",
    answer:
      "Asosiy interfeys o'zbek tilida. Suhbatda esa savolingiz tilida javob olishingiz mumkin.",
  },
] as const;
