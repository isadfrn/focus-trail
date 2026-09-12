import { describe, expect, it } from "vitest";

import { registerPasswordError } from "./credentials";

describe("registerPasswordError", () => {
  it("accepts a valid, matching password", () => {
    expect(registerPasswordError("password123", "password123")).toBeNull();
  });

  it("rejects a password shorter than 10 characters", () => {
    expect(registerPasswordError("short1", "short1")).toMatch(/10 caracteres/);
  });

  it("rejects a password without a digit", () => {
    expect(registerPasswordError("onlyletters", "onlyletters")).toMatch(
      /letra e um número/,
    );
  });

  it("rejects a password without a letter", () => {
    expect(registerPasswordError("1234567890", "1234567890")).toMatch(
      /letra e um número/,
    );
  });

  it("rejects when the confirmation does not match", () => {
    expect(registerPasswordError("password123", "password124")).toMatch(
      /não conferem/,
    );
  });
});
