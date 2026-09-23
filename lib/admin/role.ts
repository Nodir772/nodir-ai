import type { RequestIdentity } from "@/lib/auth/request-user";

export function adminEmailsFromEnv(raw = process.env.ADMIN_EMAILS ?? "") {
  return raw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminIdentity(identity: Pick<RequestIdentity, "role" | "email">, emails = adminEmailsFromEnv()) {
  if (identity.role === "admin") return true;
  if (identity.email && emails.includes(identity.email.toLowerCase())) return true;
  return false;
}
