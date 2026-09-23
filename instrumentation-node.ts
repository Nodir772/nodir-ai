export async function registerNode() {
  const { loadEnvConfig } = await import("@next/env");
  loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production", {
    info() {},
    error() {},
  });

  const { isSupabaseConfigured, missingSupabaseEnv } = await import("./lib/supabase/env");
  if (isSupabaseConfigured()) {
    console.info("[supabase] supabaseConfigured=true");
    return;
  }
  console.info(`[supabase] supabaseConfigured=false missing=${missingSupabaseEnv().join(",")}`);
}
