/**
 * Future: subscribe to conversation/message changes for multi-device sync.
 * Intentionally unused in Phase 4 to avoid extra complexity.
 */
export function conversationChannelName(userId: string) {
  return `conversations:user:${userId}`;
}
