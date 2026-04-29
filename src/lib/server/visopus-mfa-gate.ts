/**
 * Soft-MFA decision gate.
 *
 * The login fork calls this once after password verification to decide
 * whether the next step is:
 *   - "satisfied"  — let the session through (factor verified, recovery
 *                    bypass marker present, or 30-day skip grace active)
 *   - "challenge"  — user has factors enrolled but hasn't verified one
 *                    yet this session; show the chooser
 *   - "setup"      — user has no factors and no active grace; show the
 *                    enrolment chooser (with "do this later" exit to
 *                    /mfa/skip-warning)
 *
 * The decision is pure — caller passes the session, the user's
 * `mfa_skip_grace_until` (from Zitadel user_metadata, mirrored from the
 * VisOpus backend), and whether the user has any enrolled factor types
 * (from `listAuthenticationMethodTypes`).
 */
import { decodeSatisfiedVia } from "./visopus-mfa";

export type GateDecision = "satisfied" | "challenge" | "setup";

interface FactorEntry {
  verifiedAt?: unknown;
}

export interface GateInputs {
  session: {
    factors?: {
      totp?: FactorEntry;
      webAuthN?: FactorEntry;
      otpSms?: FactorEntry;
      otpEmail?: FactorEntry;
      // password is NOT considered an MFA factor.
      password?: FactorEntry;
      [key: string]: FactorEntry | undefined;
    };
    metadata?: Record<string, Uint8Array>;
  };
  userMetadata: { mfa_skip_grace_until: string | null | undefined };
  hasEnrolledFactors: boolean;
}

const MFA_FACTOR_KEYS = ["totp", "webAuthN", "otpSms", "otpEmail"] as const;

function hasVerifiedMfaFactor(
  factors: GateInputs["session"]["factors"],
): boolean {
  if (!factors) return false;
  for (const key of MFA_FACTOR_KEYS) {
    const entry = factors[key];
    if (entry && entry.verifiedAt != null) {
      return true;
    }
  }
  return false;
}

function isGraceActive(graceUntil: string | null | undefined): boolean {
  if (!graceUntil) return false;
  const t = Date.parse(graceUntil);
  if (Number.isNaN(t)) return false;
  return t > Date.now();
}

export function decideMfaGate(input: GateInputs): GateDecision {
  if (hasVerifiedMfaFactor(input.session.factors)) {
    return "satisfied";
  }
  if (decodeSatisfiedVia(input.session.metadata) != null) {
    return "satisfied";
  }
  if (isGraceActive(input.userMetadata.mfa_skip_grace_until)) {
    return "satisfied";
  }
  if (input.hasEnrolledFactors) {
    return "challenge";
  }
  return "setup";
}
