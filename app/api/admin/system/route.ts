import { requireAdmin } from "@/lib/admin/auth";
import { isOpenAiConfigured } from "@/lib/ai/config";
import { isStripeConfigured } from "@/lib/billing/stripe";
import { isSearchConfigured } from "@/lib/search";
import { isTtsConfigured } from "@/lib/voice/tts";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { listFlags } from "@/lib/billing/flags";

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return Response.json({ error: admin.error }, { status: admin.status });
  return Response.json({
    system: {
      supabase: isSupabaseConfigured(),
      openai: isOpenAiConfigured(),
      stripe: isStripeConfigured(),
      search: isSearchConfigured(),
      tts: isTtsConfigured(),
      serviceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
    },
    flags: await listFlags(),
  });
}
