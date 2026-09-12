import { describe, expect, it } from "vitest";

import {
  changePasswordSchema,
  updatePreferencesSchema,
} from "./preferences.schema.js";

describe("updatePreferencesSchema", () => {
  it("accepts a partial update", () => {
    expect(updatePreferencesSchema.safeParse({ focusMinutes: 30 }).success).toBe(
      true,
    );
  });

  it("accepts all fields", () => {
    const result = updatePreferencesSchema.safeParse({
      character: "luigi",
      focusMinutes: 50,
      breakMinutes: 10,
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty body", () => {
    expect(updatePreferencesSchema.safeParse({}).success).toBe(false);
  });

  it("rejects out-of-range durations", () => {
    expect(updatePreferencesSchema.safeParse({ focusMinutes: 0 }).success).toBe(
      false,
    );
    expect(
      updatePreferencesSchema.safeParse({ focusMinutes: 181 }).success,
    ).toBe(false);
    expect(updatePreferencesSchema.safeParse({ breakMinutes: 61 }).success).toBe(
      false,
    );
  });

  it("rejects non-integer durations", () => {
    expect(
      updatePreferencesSchema.safeParse({ focusMinutes: 25.5 }).success,
    ).toBe(false);
  });
});

describe("changePasswordSchema", () => {
  it("accepts a strong new password", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "currentpass1",
      newPassword: "newpassword1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a weak new password", () => {
    expect(
      changePasswordSchema.safeParse({
        currentPassword: "currentpass1",
        newPassword: "short",
      }).success,
    ).toBe(false);
  });

  it("rejects a new password without a digit", () => {
    expect(
      changePasswordSchema.safeParse({
        currentPassword: "currentpass1",
        newPassword: "onlyletters",
      }).success,
    ).toBe(false);
  });

  it("requires the current password", () => {
    expect(
      changePasswordSchema.safeParse({ newPassword: "newpassword1" }).success,
    ).toBe(false);
  });
});
