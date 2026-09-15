import { describe, expect, it } from "vitest";

import {
  changePasswordSchema,
  deleteAccountSchema,
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
      autoCycle: true,
      longBreakMinutes: 20,
      pomodorosUntilLongBreak: 3,
      dailyFocusGoalMinutes: 120,
    });
    expect(result.success).toBe(true);
  });

  it("accepts clearing the daily focus goal with zero", () => {
    expect(
      updatePreferencesSchema.safeParse({ dailyFocusGoalMinutes: 0 }).success,
    ).toBe(true);
  });

  it("rejects a daily focus goal above the daily maximum", () => {
    expect(
      updatePreferencesSchema.safeParse({ dailyFocusGoalMinutes: 1441 }).success,
    ).toBe(false);
  });

  it("accepts toggling only the auto-cycle preference", () => {
    expect(updatePreferencesSchema.safeParse({ autoCycle: false }).success).toBe(
      true,
    );
  });

  it("rejects out-of-range cycle preferences", () => {
    expect(
      updatePreferencesSchema.safeParse({ longBreakMinutes: 61 }).success,
    ).toBe(false);
    expect(
      updatePreferencesSchema.safeParse({ pomodorosUntilLongBreak: 0 }).success,
    ).toBe(false);
    expect(
      updatePreferencesSchema.safeParse({ pomodorosUntilLongBreak: 13 }).success,
    ).toBe(false);
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

describe("deleteAccountSchema", () => {
  it("accepts a password", () => {
    expect(deleteAccountSchema.safeParse({ password: "secret123" }).success).toBe(
      true,
    );
  });

  it("rejects a missing or empty password", () => {
    expect(deleteAccountSchema.safeParse({}).success).toBe(false);
    expect(deleteAccountSchema.safeParse({ password: "" }).success).toBe(false);
  });
});
