import OpenAI from "openai";
import { scrubProviderText, USER_ERRORS } from "@/lib/ai/error-copy";

export { USER_ERRORS } from "@/lib/ai/error-copy";

export type MappedProviderError = {
  status: number;
  code: string;
  message: string;
  category: string;
  providerStatus?: number;
  providerCode?: string | null;
  providerType?: string | null;
};

function quotaLike(error: { code?: string | null; type?: string; message?: string }) {
  if (error.code === "rate_limit_exceeded") return false;
  const blob = `${error.code ?? ""} ${error.type ?? ""} ${error.message ?? ""}`.toLowerCase();
  return (
    error.code === "insufficient_quota" ||
    error.code === "credit_balance_exhausted" ||
    blob.includes("insufficient_quota") ||
    blob.includes("credit_balance") ||
    blob.includes("no credits") ||
    blob.includes("billing") ||
    blob.includes("quota") ||
    blob.includes("payment")
  );
}

export function mapProviderError(error: unknown): MappedProviderError {
  if (error instanceof DOMException && error.name === "AbortError") {
    return { status: 499, code: "CANCELLED", message: USER_ERRORS.cancelled, category: "cancelled" };
  }
  if (error instanceof Error && error.name === "AbortError") {
    return { status: 499, code: "CANCELLED", message: USER_ERRORS.cancelled, category: "cancelled" };
  }
  if (error instanceof TypeError) {
    return { status: 503, code: "NETWORK_ERROR", message: USER_ERRORS.network, category: "network" };
  }
  if (error instanceof OpenAI.APIConnectionError) {
    return { status: 503, code: "NETWORK_ERROR", message: USER_ERRORS.network, category: "network" };
  }
  if (error instanceof OpenAI.APIError) {
    const providerStatus = error.status;
    const providerCode = error.code ?? null;
    const providerType = error.type ?? null;
    const base = {
      providerStatus,
      providerCode,
      providerType,
    };
    if (providerStatus === 401) {
      return {
        ...base,
        status: 401,
        code: "INVALID_API_KEY",
        message: USER_ERRORS.invalidKey,
        category: "invalid_key",
      };
    }
    if (providerStatus === 403) {
      return {
        ...base,
        status: 403,
        code: "PERMISSION",
        message: USER_ERRORS.permission,
        category: "permission",
      };
    }
    if (providerStatus === 429) {
      if (quotaLike(error)) {
        return {
          ...base,
          status: 429,
          code: "QUOTA",
          message: USER_ERRORS.quota,
          category: "quota",
        };
      }
      return {
        ...base,
        status: 429,
        code: "RATE_LIMIT",
        message: USER_ERRORS.rateLimit,
        category: "rate_limit",
      };
    }
    if (providerStatus === 408) {
      return { ...base, status: 504, code: "TIMEOUT", message: USER_ERRORS.timeout, category: "timeout" };
    }
    if (
      providerStatus === 404 ||
      providerCode === "model_not_found" ||
      providerCode === "invalid_model"
    ) {
      return { ...base, status: 404, code: "MODEL_ERROR", message: USER_ERRORS.model, category: "model" };
    }
    if (providerStatus === 400) {
      if (providerCode === "model_not_found" || /model/i.test(error.message ?? "")) {
        return { ...base, status: 400, code: "MODEL_ERROR", message: USER_ERRORS.model, category: "model" };
      }
      return {
        ...base,
        status: 400,
        code: "OPENAI_API_ERROR",
        message: USER_ERRORS.badRequest,
        category: "bad_request",
      };
    }
    if (providerStatus && providerStatus >= 500) {
      return {
        ...base,
        status: 502,
        code: "OPENAI_API_ERROR",
        message: USER_ERRORS.unavailable,
        category: "provider",
      };
    }
    return {
      ...base,
      status: 502,
      code: "OPENAI_API_ERROR",
      message: USER_ERRORS.unavailable,
      category: "unknown",
    };
  }
  const fallback = error instanceof Error ? scrubProviderText(error.message) : USER_ERRORS.unavailable;
  return {
    status: 502,
    code: "OPENAI_API_ERROR",
    message: fallback || USER_ERRORS.unavailable,
    category: "unknown",
  };
}
