import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getSupabasePublicConfig,
  isSupabaseConfigured,
  missingSupabaseEnv,
  publicSupabaseStatus,
  sanitizeSupabaseEnvValue,
  supabaseAuthErrorMessage,
} from "./env";

function fakeJwt(role: string) {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ role, ref: "test" })).toString("base64url");
  return `${header}.${payload}.signature`;
}

const ANON = fakeJwt("anon");
const SERVICE = fakeJwt("service_role");

function withEnv(values: Record<string, string | undefined>, run: () => void) {
  const previous = {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anon: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    service: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
  if (values.url === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  else process.env.NEXT_PUBLIC_SUPABASE_URL = values.url;
  if (values.anon === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = values.anon;
  if (values.service === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  else process.env.SUPABASE_SERVICE_ROLE_KEY = values.service;
  try {
    run();
  } finally {
    if (previous.url === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = previous.url;
    if (previous.anon === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = previous.anon;
    if (previous.service === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = previous.service;
  }
}

test("strips whitespace, quotes, and a leading BOM", () => {
  assert.equal(sanitizeSupabaseEnvValue('  "https://example.supabase.co"  '), "https://example.supabase.co");
  assert.equal(sanitizeSupabaseEnvValue("\uFEFFeyJabc"), "eyJabc");
  assert.equal(sanitizeSupabaseEnvValue("   "), "");
});

test("empty public variables are not configured and name the missing keys", () => {
  withEnv({ url: "", anon: "" }, () => {
    assert.equal(isSupabaseConfigured(), false);
    assert.equal(getSupabasePublicConfig(), null);
    assert.deepEqual(missingSupabaseEnv(), [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ]);
    assert.deepEqual(publicSupabaseStatus(), { supabaseConfigured: false });
    assert.deepEqual(Object.keys(publicSupabaseStatus()), ["supabaseConfigured"]);
  });
});

test("a valid url and anon key configure Supabase", () => {
  withEnv({ url: "https://example.supabase.co", anon: ANON, service: SERVICE }, () => {
    assert.equal(isSupabaseConfigured(), true);
    const config = getSupabasePublicConfig();
    assert.equal(config?.url, "https://example.supabase.co");
    assert.equal(config?.anonKey, ANON);
    assert.notEqual(config?.anonKey, SERVICE);
    assert.deepEqual(publicSupabaseStatus(), { supabaseConfigured: true });
  });
});

test("a service-role JWT is never accepted as the anon key", () => {
  withEnv({ url: "https://example.supabase.co", anon: SERVICE }, () => {
    assert.equal(isSupabaseConfigured(), false);
    assert.deepEqual(missingSupabaseEnv(), ["NEXT_PUBLIC_SUPABASE_ANON_KEY"]);
  });
});

test("quoted values loaded into process.env still count as configured", () => {
  withEnv({ url: '"http://127.0.0.1:54321"', anon: `  ${ANON}  ` }, () => {
    assert.equal(isSupabaseConfigured(), true);
    assert.equal(getSupabasePublicConfig()?.url, "http://127.0.0.1:54321");
  });
});

test("auth failures stay separate from missing configuration", () => {
  assert.equal(
    supabaseAuthErrorMessage({ name: "AuthRetryableFetchError", message: "fetch failed" }),
    "Supabase serveriga ulanishda muammo yuz berdi.",
  );
  assert.equal(
    supabaseAuthErrorMessage({ message: "Invalid login credentials" }),
    "Email yoki parol noto'g'ri.",
  );
  assert.equal(supabaseAuthErrorMessage({ message: "something else" }), "Kirishda xatolik yuz berdi.");
});
