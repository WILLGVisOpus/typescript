import { describe, expect, test } from "vitest";

import { decideMfaGate, type GateInputs } from "./visopus-mfa-gate";
import { SATISFIED_VIA_KEY, encodeSatisfiedVia } from "./visopus-mfa";

function inputs(overrides: Partial<GateInputs> = {}): GateInputs {
  return {
    session: { factors: {}, metadata: {} },
    userMetadata: { mfa_skip_grace_until: null },
    hasEnrolledFactors: false,
    ...overrides,
  };
}

describe("decideMfaGate", () => {
  test("returns 'satisfied' when TOTP is verified this session", () => {
    expect(
      decideMfaGate(
        inputs({
          session: {
            factors: { totp: { verifiedAt: new Date() } },
            metadata: {},
          },
        }),
      ),
    ).toBe("satisfied");
  });

  test("returns 'satisfied' when WebAuthN is verified", () => {
    expect(
      decideMfaGate(
        inputs({
          session: {
            factors: { webAuthN: { verifiedAt: new Date() } },
            metadata: {},
          },
        }),
      ),
    ).toBe("satisfied");
  });

  test("returns 'satisfied' when OTP-SMS is verified", () => {
    expect(
      decideMfaGate(
        inputs({
          session: {
            factors: { otpSms: { verifiedAt: new Date() } },
            metadata: {},
          },
        }),
      ),
    ).toBe("satisfied");
  });

  test("returns 'satisfied' when OTP-Email is verified", () => {
    expect(
      decideMfaGate(
        inputs({
          session: {
            factors: { otpEmail: { verifiedAt: new Date() } },
            metadata: {},
          },
        }),
      ),
    ).toBe("satisfied");
  });

  test("returns 'satisfied' when bypass marker is present in metadata", () => {
    expect(
      decideMfaGate(
        inputs({
          session: {
            factors: {},
            metadata: { [SATISFIED_VIA_KEY]: encodeSatisfiedVia("recovery_code") },
          },
        }),
      ),
    ).toBe("satisfied");
  });

  test("returns 'satisfied' when grace_until is in the future", () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    expect(
      decideMfaGate(
        inputs({ userMetadata: { mfa_skip_grace_until: future } }),
      ),
    ).toBe("satisfied");
  });

  test("returns 'challenge' when factors enrolled but none verified", () => {
    expect(decideMfaGate(inputs({ hasEnrolledFactors: true }))).toBe(
      "challenge",
    );
  });

  test("returns 'setup' when no factors and no grace", () => {
    expect(decideMfaGate(inputs())).toBe("setup");
  });

  test("returns 'setup' when grace is in the past", () => {
    const past = new Date(Date.now() - 86_400_000).toISOString();
    expect(
      decideMfaGate(
        inputs({ userMetadata: { mfa_skip_grace_until: past } }),
      ),
    ).toBe("setup");
  });

  test("ignores password factor — only MFA factors count", () => {
    expect(
      decideMfaGate(
        inputs({
          session: {
            factors: { password: { verifiedAt: new Date() } as any },
            metadata: {},
          },
          hasEnrolledFactors: true,
        }),
      ),
    ).toBe("challenge");
  });

  test("returns 'satisfied' even with hasEnrolledFactors=true if grace active", () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    expect(
      decideMfaGate(
        inputs({
          userMetadata: { mfa_skip_grace_until: future },
          hasEnrolledFactors: true,
        }),
      ),
    ).toBe("satisfied");
  });

  test("malformed grace_until string treated as absent", () => {
    expect(
      decideMfaGate(
        inputs({ userMetadata: { mfa_skip_grace_until: "not a date" } }),
      ),
    ).toBe("setup");
  });

  test("verifiedAt of 0 / invalid does not satisfy", () => {
    expect(
      decideMfaGate(
        inputs({
          session: {
            factors: { totp: { verifiedAt: undefined } },
            metadata: {},
          },
          hasEnrolledFactors: true,
        }),
      ),
    ).toBe("challenge");
  });
});
