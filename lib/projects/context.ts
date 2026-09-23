import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { chunkText, retrieveChunks } from "@/lib/documents/chunk";
import { getMemories } from "@/lib/memory";
import { formatMemoryBlock, retrieveRelevantMemories } from "@/lib/memory/retrieve";
import { getProject } from "@/lib/db/projects";
import { PROJECT_CONTEXT_LIMITS } from "@/lib/projects/types";

function clip(text: string, max: number) {
  const clean = text.trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).trimEnd()}…`;
}

export async function loadProjectChatContext(options: {
  supabase: SupabaseClient;
  userId: string;
  projectId: string;
  query: string;
}) {
  const owned = await getProject(options.supabase, options.userId, options.projectId);
  if (!owned.ok) return { extra: "", forbidden: owned.forbidden, missing: owned.missing };

  const instructions = clip(owned.row.instructions, PROJECT_CONTEXT_LIMITS.maxInstructionsChars);
  const memories = await getMemories(options.supabase, options.userId, { projectId: options.projectId });
  const relevant = retrieveRelevantMemories(
    options.query,
    memories,
    PROJECT_CONTEXT_LIMITS.maxMemories,
  );
  const memoryBlock = formatMemoryBlock(relevant);

  const { data } = await options.supabase
    .from("documents")
    .select("id, filename, extracted_text")
    .eq("user_id", options.userId)
    .eq("project_id", options.projectId)
    .order("created_at", { ascending: false })
    .limit(PROJECT_CONTEXT_LIMITS.maxDocuments);

  const docBits: string[] = [];
  let used = 0;
  for (const doc of data ?? []) {
    const text = String(doc.extracted_text ?? "").trim();
    if (!text) continue;
    const chunks = retrieveChunks(chunkText(text), options.query, 2);
    for (const chunk of chunks) {
      if (used >= PROJECT_CONTEXT_LIMITS.maxDocChars) break;
      const slice = clip(chunk.content, PROJECT_CONTEXT_LIMITS.maxDocChars - used);
      if (!slice) continue;
      docBits.push(`[${doc.filename}]\n${slice}`);
      used += slice.length;
    }
    if (used >= PROJECT_CONTEXT_LIMITS.maxDocChars) break;
  }

  const extra = [
    instructions
      ? `Project instructions (follow unless they conflict with safety rules):\n${instructions}`
      : "",
    memoryBlock ? `Project memory:\n${memoryBlock}` : "",
    docBits.length
      ? `Project documents. Cite these filenames only if you actually used them:\n${docBits.join("\n\n")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  return { extra, forbidden: false, missing: false };
}
