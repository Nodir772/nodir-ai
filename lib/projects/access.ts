export type OwnedResult<T> =
  | { ok: true; row: T }
  | { ok: false; forbidden: true; missing: false }
  | { ok: false; forbidden: false; missing: true };

export function ownedRow<T extends { userId?: string | null }>(
  row: T | null | undefined,
  userId: string,
): OwnedResult<T> {
  if (!row) return { ok: false, forbidden: false, missing: true };
  if (!row.userId) return { ok: false, forbidden: false, missing: true };
  if (row.userId !== userId) return { ok: false, forbidden: true, missing: false };
  return { ok: true, row };
}

export function ownedStatus(result: { ok: true } | { ok: false; forbidden: boolean; missing: boolean }) {
  if (result.ok) return { status: 200 as const, code: "OK" };
  if (result.forbidden) return { status: 403 as const, code: "FORBIDDEN" };
  return { status: 404 as const, code: "NOT_FOUND" };
}
