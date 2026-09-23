export const AI_MODE_IDS = [
  "general",
  "study",
  "coding",
  "writing",
  "research",
  "creative",
] as const;

export type AiModeId = (typeof AI_MODE_IDS)[number];

export type AiMode = {
  id: AiModeId;
  label: string;
  description: string;
  placeholder: string;
  instructions: string;
};

export const AI_MODES: AiMode[] = [
  {
    id: "general",
    label: "Umumiy",
    description: "Kundalik savollar va yordam.",
    placeholder: "Xabar yozing...",
    instructions:
      "Mode: General. Answer helpfully and directly. Match the user's language. Do not invent facts, sources, teams, or tools that were not provided.",
  },
  {
    id: "study",
    label: "O'qish",
    description: "Tushuntirish, misollar va qadam-baqadam o'rganish.",
    placeholder: "Nimani o'rganmoqchisiz?",
    instructions:
      "Mode: Study. Teach clearly. Use simple language, short steps, and concrete examples. Check understanding with a brief question when useful. Do not invent citations or exam results.",
  },
  {
    id: "coding",
    label: "Kod",
    description: "Kod yozish, tuzatish va tushuntirish.",
    placeholder: "Qanday kod kerakligini yozing...",
    instructions:
      "Mode: Coding. Write correct, readable code. Explain briefly when asked. Never claim you executed code. Do not include secrets, API keys, or exploit steps. Prefer the language the user named.",
  },
  {
    id: "writing",
    label: "Yozish",
    description: "Matn, xat, maqola va tahrir.",
    placeholder: "Yoziladigan mavzu yoki matnni kiriting...",
    instructions:
      "Mode: Writing. Produce polished writing in the requested tone and format. Preserve the user's meaning. Do not invent quotes, credentials, or sources.",
  },
  {
    id: "research",
    label: "Tadqiqot",
    description: "Tahlil va manbalarga asoslangan javob.",
    placeholder: "Tadqiq qilinadigan savolni yozing...",
    instructions:
      "Mode: Research. Be careful and structured. Distinguish facts from inference. Only cite web or document sources that were actually provided in this request. If evidence is missing, say so.",
  },
  {
    id: "creative",
    label: "Ijod",
    description: "Hikoya, g'oya va ijodiy matn.",
    placeholder: "G'oya yoki hikoya uchun mavzu yozing...",
    instructions:
      "Mode: Creative. Be imaginative while staying coherent. Do not present fiction as real facts, news, or citations. Mark invented names as fictional when it could be confusing.",
  },
];

export const DEFAULT_AI_MODE: AiModeId = "general";

export function isAiModeId(value: string): value is AiModeId {
  return (AI_MODE_IDS as readonly string[]).includes(value);
}

export function getAiMode(id: string | undefined | null): AiMode {
  return AI_MODES.find((mode) => mode.id === id) ?? AI_MODES[0];
}

export function modeInstructions(id: string | undefined | null): string {
  return getAiMode(id).instructions;
}
