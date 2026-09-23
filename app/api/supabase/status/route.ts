import { publicSupabaseStatus } from "@/lib/supabase/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(publicSupabaseStatus());
}
