export const WRITING_TONES = [
  { id: "professional", label: "Professional" },
  { id: "friendly", label: "Do'stona" },
  { id: "simple", label: "Sodda" },
  { id: "formal", label: "Rasmiy" },
  { id: "academic", label: "Akademik" },
  { id: "creative", label: "Ijodiy" },
] as const;

export const WRITING_ACTIONS = [
  { id: "rewrite", label: "Qayta yozish" },
  { id: "improve", label: "Yaxshilash" },
  { id: "summarize", label: "Xulosa" },
  { id: "expand", label: "Kengaytirish" },
  { id: "shorten", label: "Qisqartirish" },
  { id: "grammar", label: "Grammatika" },
  { id: "translate", label: "Tarjima" },
  { id: "formal", label: "Rasmiy" },
  { id: "casual", label: "Erkin" },
  { id: "academic", label: "Akademik" },
] as const;

export const WRITING_LENGTHS = [
  { id: "short", label: "Qisqa" },
  { id: "medium", label: "O'rtacha" },
  { id: "long", label: "Batafsil" },
] as const;

export type WritingToneId = (typeof WRITING_TONES)[number]["id"];
export type WritingActionId = (typeof WRITING_ACTIONS)[number]["id"];
export type WritingLengthId = (typeof WRITING_LENGTHS)[number]["id"];

export function writingSystemAddon(tone: string, action: string, length: string) {
  return [
    "You are Nodir AI Writing Studio.",
    `Tone: ${tone}.`,
    `Task: ${action}.`,
    `Length: ${length}.`,
    "Preserve the user's language unless translation is requested.",
    "Do not invent facts, citations, or sources.",
  ].join(" ");
}
