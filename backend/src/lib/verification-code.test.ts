import { describe, expect, it, vi } from "vitest";

vi.mock("../env.js", () => ({
  env: { JWT_SECRET: "test-secret-at-least-32-characters-long" },
}));

import { generateCode, hashCode, verifyCode } from "./verification-code.js";

describe("verification-code", () => {
  it("generates zero-padded 6-digit codes", () => {
    for (let i = 0; i < 100; i++) {
      expect(generateCode()).toMatch(/^\d{6}$/);
    }
  });

  it("verifies the matching code and rejects others", () => {
    const hash = hashCode("123456");
    expect(verifyCode("123456", hash)).toBe(true);
    expect(verifyCode("654321", hash)).toBe(false);
  });

  it("returns false for a malformed hash", () => {
    expect(verifyCode("123456", "not-hex")).toBe(false);
  });
});
