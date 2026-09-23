import { isOpenAiConfigured } from "@/lib/ai/config";
import { completeAiText, requestTimeoutSignal } from "@/lib/ai/complete";
import { USER_ERRORS } from "@/lib/ai/errors";
import { systemPromptForTool } from "@/lib/ai/tools";
import { CONTEXT_LIMITS } from "@/lib/ai/config";
import { getRequestIdentity } from "@/lib/auth/request-user";
import { requireUser } from "@/lib/db/auth";
import { chunkText, retrieveChunks } from "@/lib/documents/chunk";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { assertUsage, recordUsage, usageLimitJson } from "@/lib/usage/track";
import { contextLimitsFor } from "@/lib/billing/plans";

export const runtime = "nodejs";
export const maxDuration = 60;

type RouteContext = { params: Promise<{ id: string }> };

const ACTIONS: Record<string, string> = {
  summarize: "Hujjatni umumlashtiring.",
  ask: "Savolga faqat hujjat asosida javob bering.",
  highlights: "Muhim joylarni toping.",
  outline: "Hujjat asosida reja tuzing.",
  translate: "Hujjat mazmunini o'zbek tiliga tarjima qiling.",
};

export async function POST(request: Request, context: RouteContext) {
  const identity = await getRequestIdentity(request);
  if (!identity) {
    return Response.json({ error: "Davom etish uchun tizimga kiring." }, { status: 401 });
  }

  let body: { question?: string; action?: string; text?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "So'rov noto'g'ri formatda." }, { status: 400 });
  }

  const question = body.question?.trim() ?? "";
  const action = body.action && ACTIONS[body.action] ? body.action : "ask";
  if (!question && action === "ask") {
    return Response.json({ error: "Savol bo'sh bo'lmasligi kerak." }, { status: 400 });
  }

  let sourceText = body.text?.trim() ?? "";
  const { user, supabase } = isSupabaseConfigured() ? await requireUser() : { user: null, supabase: null };
  const usage = await assertUsage(request, "chat", supabase);
  if (!usage.ok) {
    if (usage.code === "USAGE_LIMIT" && "limit" in usage) return usageLimitJson(usage);
    return Response.json(
      { error: usage.error, code: usage.code, title: "title" in usage ? usage.title : undefined },
      { status: usage.status },
    );
  }

  if (supabase && user) {
    const { id } = await context.params;
    const { data, error } = await supabase
      .from("documents")
      .select("id, extracted_text, user_id")
      .eq("id", id)
      .maybeSingle();
    if (error) return Response.json({ error: "Ma'lumotlarni yuklashda xatolik yuz berdi." }, { status: 500 });
    if (!data) return Response.json({ error: "Hujjat topilmadi." }, { status: 404 });
    if (data.user_id !== user.id) {
      return Response.json({ error: "Bu hujjatga kirish huquqingiz yo'q." }, { status: 403 });
    }
    sourceText = data.extracted_text ?? sourceText;
  }

  if (!sourceText) {
    return Response.json({ error: "Hujjat matni topilmadi. Avval faylni tahlil qiling." }, { status: 400 });
  }
  if (!isOpenAiConfigured()) {
    return Response.json({ error: USER_ERRORS.missingKey, code: "MISSING_API_KEY" }, { status: 503 });
  }

  await recordUsage(request, "chat", supabase);
  const chunks = retrieveChunks(chunkText(sourceText), question || ACTIONS[action], 6);
  const excerpt = chunks.map((chunk, index) => `[Qism ${index + 1}]\n${chunk.content}`).join("\n\n");
  const clipped = excerpt.slice(0, CONTEXT_LIMITS.maxRequestChars - 500);
  const prompt = `${ACTIONS[action]}\nUser request: ${question || ACTIONS[action]}\n\nDocument excerpts:\n${clipped}`;

  const result = await completeAiText(
    [{ role: "user", content: prompt }],
    systemPromptForTool("documents"),
    undefined,
    requestTimeoutSignal(request),
    contextLimitsFor(identity.plan),
  );
  if (!result.ok) return Response.json({ error: result.error, code: result.code }, { status: result.status });
  return Response.json({ text: result.text });
}
