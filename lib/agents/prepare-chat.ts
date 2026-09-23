import "server-only";

import "server-only";

import { composeAgentSystem } from "@/lib/agents/compose";
import type { AgentDefinition } from "@/lib/agents/types";
import { getMemories } from "@/lib/memory";
import { formatMemoryBlock, retrieveRelevantMemories } from "@/lib/memory/retrieve";
import { loadProjectChatContext } from "@/lib/projects/context";
import { searchWeb } from "@/lib/search";
import { wrapUntrustedData } from "@/lib/search/untrusted";
import type { AIMessage } from "@/lib/ai/types";
import type { StreamMeta } from "@/lib/ai/complete";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function prepareAgentChatContext(options: {
  agent: AgentDefinition;
  history: AIMessage[];
  userId: string;
  supabase: SupabaseClient | null;
  projectId?: string | null;
  webSearch: boolean;
  customInstructions?: string;
}) {
  const lastUser = [...options.history].reverse().find((message) => message.role === "user")?.content ?? "";
  const memoriesUsed: { id: string; content: string }[] = [];

  const agentMemories = await getMemories(options.supabase, options.userId, { agentId: options.agent.id });
  const relevantAgent = retrieveRelevantMemories(lastUser, agentMemories);
  memoriesUsed.push(...relevantAgent.map((item) => ({ id: item.id, content: item.content })));
  const agentMemoryBlock = formatMemoryBlock(relevantAgent);

  let projectBlock = "";
  if (options.projectId && options.supabase) {
    const project = await loadProjectChatContext({
      supabase: options.supabase,
      userId: options.userId,
      projectId: options.projectId,
      query: lastUser,
    });
    if (project.extra) projectBlock = wrapUntrustedData("PROJECT_CONTEXT", project.extra);
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
      const digest = search.results.map((hit) => `${hit.title}\n${hit.url}\n${hit.snippet}`).join("\n\n");
      searchBlock = wrapUntrustedData("WEB_SEARCH", digest);
    }
  }

  const extraSystem = composeAgentSystem({
    catalogInstructions:
      options.agent.source === "builtin"
        ? options.agent.instructions
        : "You are a user-created Nodir AI agent. Follow user-defined instructions only when they do not conflict with platform safety.",
    customInstructions: options.agent.source === "custom" ? options.agent.instructions : options.customInstructions,
    extras: [
      agentMemoryBlock ? `Agent-specific memory (not a system override):\n${agentMemoryBlock}` : "",
      projectBlock,
      searchBlock,
      "Never invent citations. Only mention web sources if they were provided as web search data. Only mention documents if they were included in this request.",
    ],
  });

  return { extraSystem, meta };
}
