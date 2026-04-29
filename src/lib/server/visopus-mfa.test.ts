import { describe, expect, test } from "vitest";

import {
  SATISFIED_VIA_KEY,
  decodeSatisfiedVia,
  encodeSatisfiedVia,
} from "./visopus-mfa";

describe("visopus-mfa metadata helpers", () => {
  test("SATISFIED_VIA_KEY is the agreed string", () => {
    expect(SATISFIED_VIA_KEY).toBe("visopus_mfa_satisfied_via");
  });

  test("encode produces a typed-array of the UTF-8 bytes", () => {
    const out = encodeSatisfiedVia("recovery_code");
    expect(Array.from(out)).toEqual(
      Array.from(new TextEncoder().encode("recovery_code")),
    );
  });

  test("round-trips recovery_code marker", () => {
    const encoded = encodeSatisfiedVia("recovery_code");
    expect(decodeSatisfiedVia({ [SATISFIED_VIA_KEY]: encoded })).toBe(
      "recovery_code",
    );
  });

  test("returns null when the key is absent", () => {
    expect(decodeSatisfiedVia({})).toBeNull();
  });

  test("returns null when metadata is undefined", () => {
    expect(decodeSatisfiedVia(undefined)).toBeNull();
  });

  test("returns null when the bound value is empty", () => {
    expect(decodeSatisfiedVia({ [SATISFIED_VIA_KEY]: new Uint8Array() })).toBeNull();
  });

  test("ignores other metadata keys", () => {
    expect(
      decodeSatisfiedVia({ unrelated_marker: encodeSatisfiedVia("nope") }),
    ).toBeNull();
  });
});
