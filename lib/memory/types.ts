export const MEMORY_CATEGORIES = ["preference", "project", "learning", "general"] as const;

export type MemoryCategory = (typeof MEMORY_CATEGORIES)[number];

export type Memory = {
  id: string;
  userId: string;
  content: string;
  category: MemoryCategory;
  projectId: string | null;
  agentId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export function isMemoryCategory(value: string): value is MemoryCategory {
  return (MEMORY_CATEGORIES as readonly string[]).includes(value);
}
