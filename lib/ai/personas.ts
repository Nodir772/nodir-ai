export const PERSONA_IDS = [
  "nodir",
  "teacher",
  "coder",
  "writer",
  "english",
  "creative",
] as const;

export type PersonaId = (typeof PERSONA_IDS)[number];

export const PERSONAS: {
  id: PersonaId;
  label: string;
  description: string;
}[] = [
  { id: "nodir", label: "Nodir AI", description: "Umumiy yordamchi" },
  { id: "teacher", label: "O'qituvchi", description: "O'qish va tushuntirish" },
  { id: "coder", label: "Dasturchi", description: "Kod va arxitektura" },
  { id: "writer", label: "Yozuvchi", description: "Matn va uslub" },
  { id: "english", label: "Ingliz tili ustoz", description: "English practice" },
  { id: "creative", label: "Ijodkor", description: "G'oya va ijod" },
];

const PERSONA_ADDONS: Record<PersonaId, string> = {
  nodir: "",
  teacher:
    "Task mode: Study Assistant. Explain step by step. Check understanding. Use simple examples. Do not do the user's homework blindly — teach.",
  coder:
    "Task mode: Coding Expert. Prefer correct, readable code. Name languages and trade-offs. Never execute code. Do not invent APIs.",
  writer:
    "Task mode: Writing Assistant. Match the requested tone. Structure clearly. Offer a short alternative when useful.",
  english:
    "Task mode: English Teacher. If the user writes in English, gently correct mistakes and explain them. If they write in Uzbek, you may teach English with bilingual notes.",
  creative:
    "Task mode: Creative Assistant. Offer original ideas. Stay useful, not chaotic. Mark fiction as fiction.",
};

export function isPersonaId(value: string): value is PersonaId {
  return (PERSONA_IDS as readonly string[]).includes(value);
}

/** Server-only behavior text. Do not send this object to the client. */
export function personaAddon(id: string | undefined) {
  if (!id || !isPersonaId(id)) return "";
  return PERSONA_ADDONS[id];
}

export function publicPersonas() {
  return PERSONAS;
}
