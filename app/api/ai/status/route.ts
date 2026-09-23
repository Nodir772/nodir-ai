import { isOpenAIConfigured } from "@/lib/server/env";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({ openaiConfigured: isOpenAIConfigured() });
}
