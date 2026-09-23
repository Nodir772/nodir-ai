/**
 * Privacy-conscious monitoring. Never log secrets, cookies, tokens, or chat contents.
 * Swap `emit` for Axiom/Sentry later without changing callers.
 */

const SENSITIVE =
  /authorization|cookie|password|secret|token|api[_-]?key|bearer|content|prompt|message|email|body|transcript|memory|instruction|document|extracted|systemprompt/i;

export type MonitorFields = {
  route?: string;
  method?: string;
  status?: number;
  latencyMs?: number;
  code?: string;
  plan?: string;
  durationMs?: number;
  retries?: number;
  cancelled?: boolean;
  failed?: boolean;
  stepCount?: number;
  toolCalls?: number;
};

function safeFields(fields: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (SENSITIVE.test(key)) continue;
    if (typeof value === "string" && value.length > 120) continue;
    if (typeof value === "object" && value !== null) continue;
    out[key] = value;
  }
  return out;
}

function emit(event: string, fields: Record<string, unknown>) {
  const payload = { t: Date.now(), event, ...safeFields(fields) };
  if (process.env.NODE_ENV !== "production") {
    console.info("[nodir]", payload);
  }
}

export function trackLatency(route: string, latencyMs: number, status: number, extra?: MonitorFields) {
  emit("latency", { route, latencyMs, status, ...extra });
}

export function trackError(route: string, code: string, status: number, extra?: MonitorFields) {
  emit("error", { route, code, status, ...extra });
}

export async function timed<T>(
  route: string,
  work: () => Promise<T>,
  extra?: MonitorFields,
): Promise<T> {
  const started = Date.now();
  try {
    const result = await work();
    trackLatency(route, Date.now() - started, 200, extra);
    return result;
  } catch (error) {
    trackError(route, "UNHANDLED", 500, { ...extra, latencyMs: Date.now() - started });
    throw error;
  }
}

export function observeResponse(route: string, started: number, response: Response, extra?: MonitorFields) {
  const latencyMs = Date.now() - started;
  if (response.status >= 500) {
    trackError(route, extra?.code ?? "SERVER_ERROR", response.status, { ...extra, latencyMs });
  } else {
    trackLatency(route, latencyMs, response.status, extra);
  }
  return response;
}

export function trackTaskEvent(fields: {
  status: string;
  durationMs: number;
  retries: number;
  cancelled: boolean;
  failed: boolean;
  stepCount: number;
  toolCalls: number;
}) {
  emit("task", {
    status: fields.status,
    durationMs: fields.durationMs,
    retries: fields.retries,
    cancelled: fields.cancelled ? 1 : 0,
    failed: fields.failed ? 1 : 0,
    stepCount: fields.stepCount,
    toolCalls: fields.toolCalls,
  });
}
