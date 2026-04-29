# VisOpus Login Fork Changelog

Tracks downstream changes on the `visopus-customizations` lineage. Upstream
zitadel/zitadel changes are not duplicated here.

## [Unreleased]

### Added — Soft-required MFA: HMAC-signed backend client (Issue #206, Task 2.3)

- **`src/lib/server/visopus-backend.ts`** — typed client for the Phase 1
  backend endpoints. HMAC-SHA256 over `<ts>.<sha256(body)>` matching the
  backend's `_verify_mfa_recovery_signature`. Six wrappers: `skip`,
  `verifyRecoveryCode`, `regenerateRecoveryCodes`, `initiateFullReset`,
  `completeFullReset`, `auditLog`.
- Fail-fast on missing `MFA_RECOVERY_HMAC_SECRET` or
  `BACKEND_INTERNAL_API_URL` — refuses to fire an unsigned or
  unconfigured request. Non-2xx response throws with status + body.
- 10 vitest tests including a cross-validated signature check (test
  computes expected HMAC independently).

### Added — Soft-required MFA: `visopus-mfa` metadata helpers (Issue #206, Task 2.2)

- **`src/lib/server/visopus-mfa.ts`** — pure helpers for the
  `visopus_mfa_satisfied_via` session-metadata marker:
  `SATISFIED_VIA_KEY`, `encodeSatisfiedVia`, `decodeSatisfiedVia`.
- `decodeSatisfiedVia` returns `null` for missing key, missing metadata
  bag, and zero-length values (defensive against empty-value
  false-positives).
- 7 vitest tests; full suite still green.

### Added — Soft-required MFA: `setSession` metadata plumbing (Issue #206, Task 2.1)

- **`setSession`** (`src/lib/zitadel.ts`) now accepts an optional
  `metadata: Record<string, Uint8Array>` field which is forwarded to
  `sessionService.setSession`. Defaults to `{}` when omitted, preserving
  existing call sites byte-for-byte.
- **`setSessionAndUpdateCookie`** (`src/lib/server/cookie.ts`) accepts the
  same optional `metadata` field and threads it through.
- This unblocks Task 2.2's `setMfaSatisfiedViaRecoveryCode` helper, which
  writes a `visopus_mfa_satisfied_via=recovery_code` marker into session
  metadata so the soft-gate decision (Task 2.4) can treat a recovery-code
  challenge as MFA-satisfied for the lifetime of that session.
- 2 vitest cases at `src/lib/zitadel.test.ts` cover the empty-default and
  the explicit-metadata path. Full suite: 231 passed.

## [0.2.0] — 2026-04-29

VisOpus visual rebrand (navy/amber, Noto Sans, en/nb/de/nl/da copy) — see
commit history `2a1efc0a` .. `626f9c80` and issue #199.
