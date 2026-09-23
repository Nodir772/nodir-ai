import "server-only";

import OpenAI from "openai";
import { readOpenAiApiKey } from "@/lib/server/env";

let client: OpenAI | null = null;
let cachedKey = "";

export function getOpenAIClient() {
  const apiKey = readOpenAiApiKey();
  if (!apiKey) {
    client = null;
    cachedKey = "";
    return null;
  }
  if (!client || cachedKey !== apiKey) {
    client = new OpenAI({ apiKey });
    cachedKey = apiKey;
  }
  return client;
}
