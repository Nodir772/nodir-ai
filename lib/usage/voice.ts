/** Rough spoken duration: ~150 words per minute. Minimum 0.1 minute per request. */
export function estimateVoiceMinutes(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = words / 150;
  return Math.max(0.1, Math.round(minutes * 100) / 100);
}
