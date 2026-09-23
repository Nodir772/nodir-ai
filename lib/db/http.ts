import type { User, SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/db/auth";
import { DB_ERRORS } from "@/lib/db/errors";
import { isSupabaseConfigured, SUPABASE_MISSING_CONFIG } from "@/lib/supabase/env";

type PersistenceOk = { error: null; user: User; supabase: SupabaseClient };
type PersistenceErr = { error: NextResponse; user: null; supabase: null };

export async function requirePersistence(): Promise<PersistenceOk | PersistenceErr> {
  if (!isSupabaseConfigured()) {
    return {
      error: NextResponse.json(
        { error: SUPABASE_MISSING_CONFIG, code: "PERSISTENCE_DISABLED", persistence: false },
        { status: 503 },
      ),
      user: null,
      supabase: null,
    };
  }

  const { user, supabase } = await requireUser();
  if (!user || !supabase) {
    return {
      error: NextResponse.json(
        { error: DB_ERRORS.unauthorized, code: "UNAUTHORIZED" },
        { status: 401 },
      ),
      user: null,
      supabase: null,
    };
  }

  return { error: null, user, supabase };
}
