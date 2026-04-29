/**
 * HMAC-signed client for the VisOpus backend's internal MFA endpoints.
 *
 * The backend (`app/api_internal.py`) verifies every request via
 * HMAC-SHA256 over `<timestamp>.<sha256(body)>` with the shared secret
 * `MFA_RECOVERY_HMAC_SECRET`. The same secret is provisioned to this
 * service via Cloud Run secrets (`MFA_RECOVERY_HMAC_SECRET` env var) and
 * the backend service.  The wire format mirrors the existing OTP relay
 * pattern in the backend's `_verify_relay_signature`.
 */
import { createHash, createHmac } from "node:crypto";

function sign(body: string): { ts: string; sig: string } {
  const secret = process.env.MFA_RECOVERY_HMAC_SECRET;
  if (!secret) {
    throw new Error(
      "MFA_RECOVERY_HMAC_SECRET is not set; refusing to sign request",
    );
  }
  const ts = String(Math.floor(Date.now() / 1000));
  const digest = createHash("sha256").update(body).digest();
  const sig = createHmac("sha256", secret)
    .update(`${ts}.`)
    .update(digest)
    .digest("hex");
  return { ts, sig };
}

async function post<T>(path: string, body: object): Promise<T> {
  const base = process.env.BACKEND_INTERNAL_API_URL;
  if (!base) {
    throw new Error(
      "BACKEND_INTERNAL_API_URL is not set; refusing to call backend",
    );
  }
  const json = JSON.stringify(body);
  const { ts, sig } = sign(json);
  const resp = await fetch(`${base}${path}`, {
    method: "POST",
    body: json,
    headers: {
      "Content-Type": "application/json",
      "X-MFA-Recovery-Timestamp": ts,
      "X-MFA-Recovery-Signature": sig,
    },
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`backend ${resp.status}: ${text}`);
  }
  return (await resp.json()) as T;
}

export type SkipResponse = { status: string; grace_until: string };
export type VerifyRecoveryResponse = {
  ok: boolean;
  remaining: number;
  warn_low: boolean;
};
export type RegenerateResponse = { codes: string[] };
export type FullResetInitiateResponse = { status: string };
export type FullResetCompleteResponse = { login_url: string };
export type AuditLogResponse = { status: string };

export const skip = (userId: string) =>
  post<SkipResponse>("/api/v1/internal/mfa/skip", { user_id: userId });

export const verifyRecoveryCode = (
  userId: string,
  code: string,
  context: string = "challenge",
) =>
  post<VerifyRecoveryResponse>("/api/v1/internal/mfa/recovery-codes/verify", {
    user_id: userId,
    code,
    context,
  });

export const regenerateRecoveryCodes = (
  userId: string,
  trigger: string = "user_request",
) =>
  post<RegenerateResponse>(
    "/api/v1/internal/mfa/recovery-codes/regenerate",
    { user_id: userId, trigger },
  );

export const initiateFullReset = (email: string) =>
  post<FullResetInitiateResponse>("/api/v1/internal/mfa/full-reset/initiate", {
    email,
  });

export const completeFullReset = (token: string, code: string) =>
  post<FullResetCompleteResponse>(
    "/api/v1/internal/mfa/full-reset/complete",
    { token, code },
  );

export const auditLog = (
  userId: string,
  event: string,
  metadata: Record<string, unknown>,
) =>
  post<AuditLogResponse>("/api/v1/internal/mfa/audit-log", {
    user_id: userId,
    event,
    metadata,
  });
