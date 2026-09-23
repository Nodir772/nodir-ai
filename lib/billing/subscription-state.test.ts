import assert from "node:assert/strict";
import { test } from "node:test";
import { billingEventInsertResult, paidPlanFromCheckout, planFromStripePriceId, profilePlanForSubscription } from "./subscription-state";

test("webhook insert is idempotent on unique event_id conflict", () => {
  assert.equal(billingEventInsertResult({ code: "23505" }).duplicate, true);
  assert.equal(billingEventInsertResult({ code: "42P01" }).duplicate, false);
  assert.equal(billingEventInsertResult(null).duplicate, false);
});

test("subscription update maps Stripe price ids to plans", () => {
  const ids = {
    pro: "price_pro",
    proYear: "price_pro_year",
    proPlus: "price_plus",
    proPlusYear: "price_plus_year",
    proMax: "price_max",
    proMaxYear: "price_max_year",
    premium: "price_premium",
  };
  assert.equal(planFromStripePriceId("price_max", ids), "pro_max");
  assert.equal(planFromStripePriceId("price_plus", ids), "pro_plus");
  assert.equal(planFromStripePriceId("price_pro", ids), "pro");
  assert.equal(planFromStripePriceId("price_premium", ids), "pro_max");
  assert.equal(planFromStripePriceId("price_unknown", ids), "free");
});

test("subscription cancellation returns the profile to free", () => {
  assert.equal(profilePlanForSubscription("canceled", "pro"), "free");
  assert.equal(profilePlanForSubscription("unpaid", "pro_max"), "free");
  assert.equal(profilePlanForSubscription("active", "pro_plus"), "pro_plus");
  assert.equal(paidPlanFromCheckout("free"), "pro");
  assert.equal(paidPlanFromCheckout("pro_max"), "pro_max");
});
