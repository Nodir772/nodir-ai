export const PROJECT_ICONS = ["folder", "book", "code", "pen", "search", "spark"] as const;
export type ProjectIcon = (typeof PROJECT_ICONS)[number];

export type Project = {
  id: string;
  userId: string;
  name: string;
  description: string;
  instructions: string;
  icon: ProjectIcon;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
};

export function isProjectIcon(value: string): value is ProjectIcon {
  return (PROJECT_ICONS as readonly string[]).includes(value);
}

export const PROJECT_CONTEXT_LIMITS = {
  maxInstructionsChars: 4_000,
  maxDocChars: 6_000,
  maxMemories: 4,
  maxDocuments: 8,
} as const;
