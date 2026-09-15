import { afterEach, describe, expect, it, vi } from "vitest";

import * as http from "../lib/http";
import { authApi } from "./auth.api";

afterEach(() => vi.restoreAllMocks());

describe("authApi", () => {
  it("calls the expected endpoints", async () => {
    const request = vi
      .spyOn(http, "request")
      .mockResolvedValue({} as never);

    await authApi.me();
    await authApi.login("a@b.com", "password10");
    await authApi.register("a@b.com", "password10");
    await authApi.verifyEmail("a@b.com", "123456");
    await authApi.resendVerification("a@b.com");
    await authApi.forgotPassword("a@b.com");
    await authApi.resetPassword("a@b.com", "123456", "password10");
    await authApi.logout();
    await authApi.updatePreferences({
      character: "mario-world",
      focusMinutes: 25,
      breakMinutes: 5,
    });
    await authApi.changePassword("old-password", "new-password10");
    await authApi.exportData();
    await authApi.deleteAccount("password10");

    const paths = request.mock.calls.map((call) => call[0]);
    expect(paths).toEqual(
      expect.arrayContaining([
        "/me",
        "/auth/login",
        "/auth/register",
        "/auth/verify-email",
        "/auth/resend-verification",
        "/auth/forgot-password",
        "/auth/reset-password",
        "/auth/logout",
        "/me/password",
        "/me/export",
      ]),
    );

    const deleteCall = request.mock.calls.find(
      (call) => call[0] === "/me" && call[1]?.method === "DELETE",
    );
    expect(deleteCall).toBeTruthy();
  });
});
