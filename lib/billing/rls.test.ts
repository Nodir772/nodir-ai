import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";

test("RLS policies restrict billing tables to the owning user", () => {
  const sql = fs.readFileSync(path.join(process.cwd(), "supabase/migrations/004_billing_admin.sql"), "utf8");
  const phase8 = fs.readFileSync(path.join(process.cwd(), "supabase/migrations/005_phase8_plans.sql"), "utf8");
  assert.match(sql, /create policy "subscriptions_own"/);
  assert.match(sql, /auth\.uid\(\) = user_id/);
  assert.match(phase8, /create policy "usage_records_own"/);
  assert.match(sql, /create policy "tickets_own"/);
  assert.match(sql, /billing_events and audit_logs: no client policies/);
});

test("phase 8 migration expands plan check to four tiers", () => {
  const sql = fs.readFileSync(path.join(process.cwd(), "supabase/migrations/005_phase8_plans.sql"), "utf8");
  assert.match(sql, /pro_plus/);
  assert.match(sql, /pro_max/);
  assert.match(sql, /plan = 'pro_max' where plan = 'premium'/);
});
