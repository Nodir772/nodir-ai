export const STUDIO_KINDS = [
  "writing",
  "code",
  "research",
  "translation",
  "summary",
  "image",
  "document",
] as const;

export type StudioKind = (typeof STUDIO_KINDS)[number];

export function isStudioKind(value: string): value is StudioKind {
  return (STUDIO_KINDS as readonly string[]).includes(value);
}
