import assert from "node:assert/strict";
import { test } from "node:test";
import { AI_MODELS } from "./models";
import { pickAutoModel, resolveSelectedModel } from "./auto-model";

test("never invents model ids outside AI_MODELS", () => {
  const picked = pickAutoModel({ text: "Salom", mode: "general", plan: "free" });
  assert.ok(AI_MODELS.some((model) => model.id === picked));
});

test("simple prompts prefer fast when the plan allows it", () => {
  const picked = pickAutoModel({ text: "Salom, nima gap?", mode: "general", plan: "pro_max" });
  assert.equal(picked, "nodir-fast");
});

test("coding prompts prefer balanced when available", () => {
  const picked = pickAutoModel({
    text: "function login() { return true }",
    mode: "coding",
    plan: "pro",
  });
  assert.equal(picked, "nodir-balanced");
});

test("long documents and research prefer advanced when the plan allows it", () => {
  const long = "x".repeat(2600);
  assert.equal(pickAutoModel({ text: long, plan: "pro_plus" }), "nodir-advanced");
  assert.equal(pickAutoModel({ text: "Chuquq tahlil qil", mode: "research", plan: "pro_max" }), "nodir-advanced");
});

test("free plan never receives advanced", () => {
  const picked = pickAutoModel({ text: "x".repeat(3000), mode: "research", plan: "free" });
  assert.equal(picked, "nodir-fast");
});

test("image attachments stay on a vision model when it already supports vision", () => {
  const result = resolveSelectedModel("nodir-fast", { text: "Bu rasmda nima bor?", plan: "pro", hasImages: true });
  assert.equal(result.model, "nodir-fast");
  assert.equal(result.auto, false);
});

test("free plan can use Fast vision without upgrading the plan", () => {
  const result = resolveSelectedModel("nodir-fast", { text: "Bu rasmda nima bor?", plan: "free", hasImages: true });
  assert.equal(result.model, "nodir-fast");
});
