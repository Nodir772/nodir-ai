import assert from "node:assert/strict";
import { test } from "node:test";
import { retrieveRelevantMemories } from "./retrieve";
import { isSensitiveMemory } from "./sensitive";
import type { Memory } from "./types";

function memory(content: string, category: Memory["category"] = "general"): Memory {
  return {
    id: "1",
    userId: "u",
    content,
    category,
    projectId: null,
    agentId: null,
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  };
}

test("does not dump unrelated memories", () => {
  const hits = retrieveRelevantMemories("Flutter widget nima?", [
    { ...memory("Foydalanuvchi Flutter o'rganmoqda.", "learning"), projectId: null },
    { ...memory("Foydalanuvchi ovqatlanishni yoqtiradi.", "general"), projectId: null },
  ]);
  assert.equal(hits.length, 1);
  assert.match(hits[0]!.content, /Flutter/);
});

test("rejects secrets from memory", () => {
  assert.equal(isSensitiveMemory("api_key=sk-abcdefghijklmnop"), true);
  assert.equal(isSensitiveMemory("Foydalanuvchi Uzbek tilida muloqot qilishni afzal ko'radi."), false);
});
