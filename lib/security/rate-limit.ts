/**
 * In-memory limiter. Swap `increment` for Redis/Upstash later without changing callers.
 */

import { getPlan, resolvePlanId, type PlanId } from "@/lib/billing/plans";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; remaining: 0; retryAt: number };

export type RateLimitStore = {
  hit: (key: string, limit: number, windowMs: number) => RateLimitResult;
};

export const memoryRateLimitStore: RateLimitStore = {
  hit(key, limit, windowMs) {
    const now = Date.now();
    const current = buckets.get(key);
    if (!current || now >= current.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return { ok: true, remaining: Math.max(0, limit - 1) };
    }
    if (current.count >= limit) {
      return { ok: false, remaining: 0, retryAt: current.resetAt };
    }
    current.count += 1;
    return { ok: true, remaining: limit - current.count };
  },
};

let store: RateLimitStore = memoryRateLimitStore;

export function setRateLimitStore(next: RateLimitStore) {
  store = next;
}

export const ROUTE_LIMITS = {
  chat: { limit: 20, windowMs: 60_000 },
  search: { limit: 10, windowMs: 60_000 },
  image: { limit: 8, windowMs: 60_000 },
  documents: { limit: 10, windowMs: 60_000 },
  voice: { limit: 15, windowMs: 60_000 },
  memories: { limit: 40, windowMs: 60_000 },
  projects: { limit: 40, windowMs: 60_000 },
  agents: { limit: 40, windowMs: 60_000 },
  tasks: { limit: 20, windowMs: 60_000 },
  automations: { limit: 20, windowMs: 60_000 },
  auth: { limit: 20, windowMs: 60_000 },
  support: { limit: 8, windowMs: 60_000 },
  billing: { limit: 12, windowMs: 60_000 },
  default: { limit: 30, windowMs: 60_000 },
} as const;

export type RateRoute = keyof typeof ROUTE_LIMITS;

const FIXED_ROUTES: RateRoute[] = ["auth", "support", "billing"];

export function checkRateLimit(key: string, limit = 20, windowMs = 60_000): RateLimitResult {
  return store.hit(key, limit, windowMs);
}

export function rateLimitKeyFromRequest(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  return `ip:${ip}`;
}

export function limitRoute(request: Request, route: RateRoute, plan?: PlanId | string) {
  const base = ROUTE_LIMITS[route];
  const rpm = plan ? getPlan(resolvePlanId(plan)).rateLimit : base.limit;
  const limit = FIXED_ROUTES.includes(route)
    ? base.limit
    : Math.max(base.limit, Math.round((rpm / 20) * base.limit));
  const key = `${route}:${rateLimitKeyFromRequest(request)}:${FIXED_ROUTES.includes(route) ? "ip" : resolvePlanId(plan)}`;
  return checkRateLimit(key, limit, base.windowMs);
}
