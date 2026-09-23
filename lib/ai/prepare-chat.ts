import "server-only";

import { composeSystemAddons } from "@/lib/ai/context";
import { modeInstructions } from "@/lib/ai/modes";
import { personaAddon } from "@/lib/ai/personas";
import { styleAddon } from "@/lib/ai/style";
import { isAiToolId, systemPromptForTool } from "@/lib/ai/tools";
import type { AIMessage } from "@/lib/ai/types";
import type { StreamMeta } from "@/lib/ai/complete";
import { getMemories } from "@/lib/memory";
import { formatMemoryBlock, retrieveRelevantMemories } from "@/lib/memory/retrieve";
import { loadProjectChatContext } from "@/lib/projects/context";
import { searchWeb } from "@/lib/search";
import { wrapUntrustedData } from "@/lib/search/untrusted";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function prepareChatContext(options: {
  history: AIMessage[];
  tool?: string;
  webSearch: boolean;
  personaId?: string;
  responseStyle?: string;
  memoryEnabled: boolean;
  userId?: string;
  supabase: SupabaseClient | null;
  mode?: string;
  projectId?: string | null;
}) {
  const lastUser = [...options.history].reverse().find((message) => message.role === "user")?.content ?? "";
  const memoriesUsed: { id: string; content: string }[] = [];
  let memoryBlock = "";

  if (options.memoryEnabled && options.userId) {
    const all = await getMemories(options.supabase, options.userId, { projectId: null });
    const relevant = retrieveRelevantMemories(lastUser, all);
    memoriesUsed.push(...relevant.map((item) => ({ id: item.id, content: item.content })));
    memoryBlock = formatMemoryBlock(relevant);
  }

  let projectBlock = "";
  if (options.projectId && options.userId && options.supabase) {
    const project = await loadProjectChatContext({
      supabase: options.supabase,
      userId: options.userId,
      projectId: options.projectId,
      query: lastUser,
    });
    if (project.extra) projectBlock = project.extra;
  }

  let searchBlock = "";
  const meta: StreamMeta = {};
  if (memoriesUsed.length) meta.memories = memoriesUsed;

  if (options.webSearch) {
    const search = await searchWeb(lastUser);
    if (!search.ok) {
      meta.search = { configured: search.configured, error: search.error };
    } else {
      meta.sources = search.results;
      const digest = search.results
        .map((hit) => `${hit.title}\n${hit.url}\n${hit.snippet}`)
        .join("\n\n");
      searchBlock = wrapUntrustedData("WEB_SEARCH", digest);
    }
  }

  const extraSystem = composeSystemAddons([
    modeInstructions(options.mode),
    options.tool && isAiToolId(options.tool) ? systemPromptForTool(options.tool) : "",
    personaAddon(options.personaId),
    styleAddon(options.responseStyle),
    memoryBlock,
    projectBlock,
    searchBlock,
    "Never invent citations, teams, or sources. Only mention web sources if they were provided as web search data. Only mention documents or images if they were attached or included in this request.",
  ]);

  return { extraSystem, meta };
}
