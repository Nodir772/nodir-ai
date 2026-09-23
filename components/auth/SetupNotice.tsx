"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { SUPABASE_MISSING_CONFIG } from "@/lib/supabase/env";

export function SetupNotice() {
  const { supabaseConfigured } = useAuth();
  if (supabaseConfigured) return null;

  return (
    <div className="mb-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm leading-6 text-amber-100">
      {SUPABASE_MISSING_CONFIG} Haqiqiy auth va suhbatlar uchun{" "}
      <code className="text-xs">.env.local</code> ichida{" "}
      <code className="text-xs">NEXT_PUBLIC_SUPABASE_URL</code> va{" "}
      <code className="text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> ni to&apos;ldiring,
      serverni to&apos;xtating, so&apos;ng <code className="text-xs">npm run dev</code> ni qayta
      ishga tushiring. Qo&apos;llanma: <code className="text-xs">SUPABASE_SETUP.md</code>.
    </div>
  );
}
