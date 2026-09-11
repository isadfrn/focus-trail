import { describe, expect, it } from "vitest";

import { credentialsSchema } from "./auth.schema.js";

describe("credentialsSchema", () => {
  it("accepts valid credentials", () => {
    const result = credentialsSchema.safeParse({
      email: "user@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email and short password", () => {
    expect(
      credentialsSchema.safeParse({
        email: "not-an-email",
        password: "short",
      }).success,
    ).toBe(false);
  });
});
