import { randomUUID } from "node:crypto";

export type AgentChatMessage = {
  id: string;
  agentId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

const chats = new Map<string, AgentChatMessage[]>();

function key(userId: string, agentId: string) {
  return `${userId}:${agentId}`;
}

export function localListAgentMessages(userId: string, agentId: string) {
  return [...(chats.get(key(userId, agentId)) ?? [])];
}

export function localAddAgentMessage(
  userId: string,
  agentId: string,
  role: "user" | "assistant",
  content: string,
) {
  const message: AgentChatMessage = {
    id: randomUUID(),
    agentId,
    role,
    content,
    createdAt: new Date().toISOString(),
  };
  chats.set(key(userId, agentId), [...localListAgentMessages(userId, agentId), message].slice(-80));
  return message;
}

export function resetLocalAgentChats() {
  chats.clear();
}
