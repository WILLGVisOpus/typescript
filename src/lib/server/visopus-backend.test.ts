import { createHash, createHmac } from "node:crypto";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vitest";

import {
  auditLog,
  completeFullReset,
  initiateFullReset,
  regenerateRecoveryCodes,
  skip,
  verifyRecoveryCode,
} from "./visopus-backend";

const SECRET = "test-secret";
const BASE = "https://api.example.com";

function expectedSig(ts: string, body: string): string {
  const digest = createHash("sha256").update(body).digest();
  return createHmac("sha256", SECRET)
    .update(`${ts}.`)
    .update(digest)
    .digest("hex");
}

describe("visopus-backend HMAC client", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env.MFA_RECOVERY_HMAC_SECRET = SECRET;
    process.env.BACKEND_INTERNAL_API_URL = BASE;
    fetchMock = vi
      .fn()
      .mockResolvedValue(new Response('{"ok": true}', { status: 200 }));
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  test("skip POSTs to /api/v1/internal/mfa/skip with valid HMAC", async () => {
    await skip("user-123");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE}/api/v1/internal/mfa/skip`);
    expect(init.method).toBe("POST");
    expect(init.headers["Content-Type"]).toBe("application/json");

    const body = init.body as string;
    const ts = init.headers["X-MFA-Recovery-Timestamp"];
    expect(ts).toMatch(/^\d+$/);
    expect(JSON.parse(body)).toEqual({ user_id: "user-123" });
    expect(init.headers["X-MFA-Recovery-Signature"]).toBe(expectedSig(ts, body));
  });

  test("verifyRecoveryCode includes context default 'challenge'", async () => {
    await verifyRecoveryCode("u-1", "ABCDEFGHJK");
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body as string)).toEqual({
      user_id: "u-1",
      code: "ABCDEFGHJK",
      context: "challenge",
    });
  });

  test("verifyRecoveryCode forwards explicit context", async () => {
    await verifyRecoveryCode("u-1", "ABCDEFGHJK", "fork-self-test");
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body as string).context).toBe("fork-self-test");
  });

  test("regenerateRecoveryCodes default trigger is 'user_request'", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('{"codes": ["A","B"]}', { status: 200 }),
    );
    const result = await regenerateRecoveryCodes("u-1");
    expect(result).toEqual({ codes: ["A", "B"] });
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body as string)).toEqual({
      user_id: "u-1",
      trigger: "user_request",
    });
  });

  test("initiateFullReset POSTs the email", async () => {
    await initiateFullReset("trainee@example.com");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE}/api/v1/internal/mfa/full-reset/initiate`);
    expect(JSON.parse(init.body as string)).toEqual({
      email: "trainee@example.com",
    });
  });

  test("completeFullReset POSTs token + code", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('{"login_url":"https://x"}', { status: 200 }),
    );
    const result = await completeFullReset("tok", "ABCDEFGHJK");
    expect(result).toEqual({ login_url: "https://x" });
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body as string)).toEqual({
      token: "tok",
      code: "ABCDEFGHJK",
    });
  });

  test("auditLog POSTs the event + metadata", async () => {
    await auditLog("u-1", "mfa_skip_expired_reprompted", {
      previous_grace_until: "2026-03-29T00:00:00Z",
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE}/api/v1/internal/mfa/audit-log`);
    expect(JSON.parse(init.body as string)).toEqual({
      user_id: "u-1",
      event: "mfa_skip_expired_reprompted",
      metadata: { previous_grace_until: "2026-03-29T00:00:00Z" },
    });
  });

  test("non-2xx response throws with status + body", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('{"detail":"bad"}', { status: 400 }),
    );
    await expect(skip("u-1")).rejects.toThrow(/400/);
  });

  test("missing secret throws before fetch", async () => {
    delete process.env.MFA_RECOVERY_HMAC_SECRET;
    await expect(skip("u-1")).rejects.toThrow(/MFA_RECOVERY_HMAC_SECRET/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("missing base URL throws before fetch", async () => {
    delete process.env.BACKEND_INTERNAL_API_URL;
    await expect(skip("u-1")).rejects.toThrow(/BACKEND_INTERNAL_API_URL/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
