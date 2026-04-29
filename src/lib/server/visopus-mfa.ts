/**
 * VisOpus soft-MFA session metadata helpers.
 *
 * The Zitadel session metadata bag is a `Record<string, Uint8Array>`. We use
 * one key to record that an MFA challenge was satisfied via a recovery code
 * (rather than a verified factor). The soft-gate decision in
 * `visopus-mfa-gate.ts` reads this marker to treat the session as
 * MFA-satisfied for its lifetime.
 *
 * NOTE: pure helpers — no `"use server"` directive so the encode/decode are
 * safe to import from both server and client code paths.
 */

export const SATISFIED_VIA_KEY = "visopus_mfa_satisfied_via";

export type SatisfiedVia = "recovery_code";

export function encodeSatisfiedVia(value: SatisfiedVia | string): Uint8Array {
  return new TextEncoder().encode(value);
}

export function decodeSatisfiedVia(
  metadata: Record<string, Uint8Array> | undefined,
): string | null {
  const raw = metadata?.[SATISFIED_VIA_KEY];
  if (!raw || raw.length === 0) return null;
  return new TextDecoder().decode(raw);
}
