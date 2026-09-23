import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";

test("phase 12 migration enables RLS and ownership checks", () => {
  const sql = fs.readFileSync(path.join(process.cwd(), "supabase/migrations/009_phase12_agents.sql"), "utf8");
  assert.match(sql, /create table if not exists public.agents/);
  assert.match(sql, /create table if not exists public.tasks/);
  assert.match(sql, /create table if not exists public.task_steps/);
  assert.match(sql, /create table if not exists public.automations/);
  assert.match(sql, /auth\.uid\(\) = user_id/);
  assert.match(sql, /schedule_enabled/);
  assert.match(sql, /schedule_type/);
  assert.match(sql, /next_run_at/);
  assert.match(sql, /item_type in \('conversation', 'image', 'message', 'project', 'agent'\)/);
  assert.match(sql, /add column if not exists agent_id/);
  assert.match(sql, /enable row level security/);
});
