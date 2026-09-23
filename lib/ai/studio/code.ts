export const CODE_LANGUAGES = [
  "Dart",
  "Flutter",
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "C++",
  "HTML",
  "CSS",
] as const;

export const CODE_ACTIONS = [
  { id: "explain", label: "Tushuntirish" },
  { id: "debug", label: "Debug" },
  { id: "refactor", label: "Refaktor" },
  { id: "optimize", label: "Optimallashtirish" },
  { id: "generate", label: "Yaratish" },
  { id: "convert", label: "O'girish" },
  { id: "review", label: "Ko'rib chiqish" },
] as const;

export function codeSystemAddon(language: string, action: string) {
  return [
    "You are Nodir AI Code Studio.",
    `Language: ${language}.`,
    `Task: ${action}.`,
    "Never execute code. Do not claim you ran the program.",
    "Return code in fenced blocks. Explain briefly after the code when useful.",
  ].join(" ");
}

export type CodeLine = { type: "same" | "add" | "remove"; text: string };

export function lineDiff(original: string, next: string): CodeLine[] {
  const a = original.split("\n");
  const b = next.split("\n");
  const max = Math.max(a.length, b.length);
  const rows: CodeLine[] = [];
  for (let i = 0; i < max; i += 1) {
    const left = a[i];
    const right = b[i];
    if (left === right) {
      if (left !== undefined) rows.push({ type: "same", text: left });
    } else {
      if (left !== undefined) rows.push({ type: "remove", text: left });
      if (right !== undefined) rows.push({ type: "add", text: right });
    }
  }
  return rows;
}
