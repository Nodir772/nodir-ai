import type { ChatMessage, Conversation } from "@/types/chat";

/**
 * Persistence ports for Phase 4 (Supabase).
 * Chat currently stores conversations locally; these no-ops keep call sites ready.
 */
export interface ConversationRepository {
  createConversation(input: Conversation): Promise<Conversation>;
  saveMessage(conversationId: string, message: ChatMessage): Promise<void>;
  getConversation(id: string): Promise<Conversation | null>;
  deleteConversation(id: string): Promise<void>;
}

export const conversationRepository: ConversationRepository = {
  async createConversation(input) {
    return input;
  },
  async saveMessage() {
    return;
  },
  async getConversation() {
    return null;
  },
  async deleteConversation() {
    return;
  },
};

export const createConversation = (input: Conversation) =>
  conversationRepository.createConversation(input);
export const saveMessage = (conversationId: string, message: ChatMessage) =>
  conversationRepository.saveMessage(conversationId, message);
export const getConversation = (id: string) => conversationRepository.getConversation(id);
export const deleteConversation = (id: string) => conversationRepository.deleteConversation(id);
