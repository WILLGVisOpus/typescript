import { describe, expect, test, vi, beforeEach } from "vitest";

vi.mock("./service", () => ({
  createServiceForHost: vi.fn(),
}));

import { createServiceForHost } from "./service";
import { setSession } from "./zitadel";

describe("setSession metadata forwarding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("passes empty metadata when caller omits the field", async () => {
    const setSessionMock = vi.fn().mockResolvedValue({ session: {} });
    vi.mocked(createServiceForHost).mockResolvedValue({
      setSession: setSessionMock,
    } as any);

    await setSession({
      serviceUrl: "https://x",
      sessionId: "s",
      sessionToken: "t",
      challenges: undefined,
      lifetime: { seconds: 60n, nanos: 0 } as any,
    });

    expect(setSessionMock).toHaveBeenCalledTimes(1);
    const call = setSessionMock.mock.calls[0][0];
    expect(call.metadata).toEqual({});
    expect(call.sessionId).toBe("s");
  });

  test("forwards explicit metadata to sessionService.setSession", async () => {
    const setSessionMock = vi.fn().mockResolvedValue({ session: {} });
    vi.mocked(createServiceForHost).mockResolvedValue({
      setSession: setSessionMock,
    } as any);

    const marker = new TextEncoder().encode("recovery_code");
    await setSession({
      serviceUrl: "https://x",
      sessionId: "s",
      sessionToken: "t",
      challenges: undefined,
      lifetime: { seconds: 60n, nanos: 0 } as any,
      metadata: { visopus_mfa_satisfied_via: marker },
    });

    expect(setSessionMock).toHaveBeenCalledTimes(1);
    const call = setSessionMock.mock.calls[0][0];
    expect(call.metadata).toEqual({ visopus_mfa_satisfied_via: marker });
  });
});
