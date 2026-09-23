import { getAppSession, unauthorizedJson } from "@/lib/auth/app-session";
import { denyBuiltinMutation } from "@/lib/agents/access";
import { toClientAgent, toPublicAgent, requireAgent } from "@/lib/agents/guard";
import { getPublishedAgent, updateCustomAgent, deleteCustomAgent } from "@/lib/agents/store";
import { isAgentIcon } from "@/lib/agents/types";
import { sanitizeAgentTools } from "@/lib/agents/tools";
import { isAllowedModelId } from "@/lib/ai/config";
import { limitRoute } from "@/lib/security/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Ctx) {
  const { id } = await context.params;
  const url = new URL(request.url);
  if (url.searchParams.get("public") === "1") {
    const supabase = await createSupabaseServerClient();
    const published = await getPublishedAgent(supabase, id);
    if (!published || (published.source === "custom" && !published.published)) {
      return Response.json({ error: "Agent topilmadi." }, { status: 404 });
    }
    return Response.json({ agent: toPublicAgent(published) });
  }

  const session = await getAppSession(request);
  if (!session) return unauthorizedJson();
  const limited = limitRoute(request, "agents");
  if (!limited.ok) return Response.json({ error: "So'rovlar juda ko'p.", code: "RATE_LIMIT" }, { status: 429 });

  const resolved = await requireAgent(session, id, false);
  if (!resolved.ok) return resolved.response;
  return Response.json({ agent: toClientAgent(resolved.agent, session.identity.plan), builtin: resolved.builtin });
}

export async function PATCH(request: Request, context: Ctx) {
  const session = await getAppSession(request);
  if (!session) return unauthorizedJson();
  const limited = limitRoute(request, "agents");
  if (!limited.ok) return Response.json({ error: "So'rovlar juda ko'p.", code: "RATE_LIMIT" }, { status: 429 });
  const { id } = await context.params;
  const resolved = await requireAgent(session, id, false);
  if (!resolved.ok) return resolved.response;
  if (resolved.builtin) {
    const deny = denyBuiltinMutation();
    return Response.json({ error: deny.error, code: deny.code }, { status: deny.status });
  }

  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    description?: string;
    icon?: string;
    instructions?: string;
    allowedTools?: string[];
    model?: string;
    enabled?: boolean;
    published?: boolean;
    publicSlug?: string | null;
  };
  const patch: Record<string, unknown> = {};
  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (!name || name.length > 80) return Response.json({ error: "Agent nomi 1–80 belgi oralig'ida bo'lishi kerak." }, { status: 400 });
    patch.name = name;
  }
  if (typeof body.description === "string") patch.description = body.description.trim().slice(0, 500);
  if (typeof body.instructions === "string") patch.instructions = body.instructions.trim().slice(0, 8_000);
  if (typeof body.icon === "string" && isAgentIcon(body.icon)) patch.icon = body.icon;
  if (Array.isArray(body.allowedTools)) patch.allowedTools = sanitizeAgentTools(body.allowedTools);
  if (typeof body.model === "string" && isAllowedModelId(body.model)) patch.model = body.model;
  if (typeof body.enabled === "boolean") patch.enabled = body.enabled;
  if (typeof body.published === "boolean") patch.published = body.published;
  if (body.publicSlug !== undefined) {
    const slug = typeof body.publicSlug === "string" ? body.publicSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 60) : null;
    patch.publicSlug = slug || null;
  }

  const updated = await updateCustomAgent(session.supabase, session.identity.id, id, patch);
  if (!updated.ok) {
    return Response.json({ error: "Agent topilmadi." }, { status: updated.forbidden ? 403 : 404 });
  }
  return Response.json({ agent: toClientAgent(updated.row, session.identity.plan) });
}

export async function DELETE(request: Request, context: Ctx) {
  const session = await getAppSession(request);
  if (!session) return unauthorizedJson();
  const { id } = await context.params;
  const resolved = await requireAgent(session, id, false);
  if (!resolved.ok) return resolved.response;
  if (resolved.builtin) {
    const deny = denyBuiltinMutation();
    return Response.json({ error: deny.error, code: deny.code }, { status: deny.status });
  }
  const deleted = await deleteCustomAgent(session.supabase, session.identity.id, id);
  if (!deleted.ok) return Response.json({ error: "Agent topilmadi." }, { status: deleted.forbidden ? 403 : 404 });
  return Response.json({ ok: true });
}
