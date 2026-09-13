import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../api/auth.api", () => ({
  authApi: {
    me: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    verifyEmail: vi.fn(),
    logout: vi.fn(),
  },
}));

import { authApi } from "../api/auth.api";
import { ApiError } from "../errors/api-error";
import { AuthProvider, useAuth } from "./AuthProvider";

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

const aUser = { id: "1", email: "a@b.com", character: "mario-world" };

afterEach(() => vi.clearAllMocks());

describe("AuthProvider", () => {
  it("throws when used outside the provider", () => {
    expect(() => renderHook(() => useAuth())).toThrow();
  });

  it("loads the current user on mount", async () => {
    vi.mocked(authApi.me).mockResolvedValue({ user: aUser } as never);
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user?.email).toBe("a@b.com");
  });

  it("stays logged out on a 401 without logging an error", async () => {
    vi.mocked(authApi.me).mockRejectedValue(new ApiError(401, "unauthorized"));
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
    expect(logged).not.toHaveBeenCalled();
  });

  it("logs an unexpected load error", async () => {
    vi.mocked(authApi.me).mockRejectedValue(new Error("boom"));
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(logged).toHaveBeenCalled();
  });

  it("keeps the user null when registration needs verification", async () => {
    vi.mocked(authApi.me).mockRejectedValue(new ApiError(401, "x"));
    vi.mocked(authApi.register).mockResolvedValue({
      verificationRequired: true,
      email: "a@b.com",
    } as never);
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.register("a@b.com", "pw");
    });
    expect(result.current.user).toBeNull();
  });

  it("updates the user through login, register, verify and logout", async () => {
    vi.mocked(authApi.me).mockRejectedValue(new ApiError(401, "x"));
    vi.mocked(authApi.login).mockResolvedValue({ user: aUser } as never);
    vi.mocked(authApi.register).mockResolvedValue({ user: aUser } as never);
    vi.mocked(authApi.verifyEmail).mockResolvedValue({
      user: { ...aUser, email: "v@b.com" },
    } as never);
    vi.mocked(authApi.logout).mockResolvedValue({ ok: true } as never);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.login("a@b.com", "pw");
    });
    expect(result.current.user?.email).toBe("a@b.com");

    await act(async () => {
      await result.current.logout();
    });
    expect(result.current.user).toBeNull();

    await act(async () => {
      await result.current.register("a@b.com", "pw");
    });
    expect(result.current.user?.email).toBe("a@b.com");

    await act(async () => {
      await result.current.verifyEmail("a@b.com", "123456");
    });
    expect(result.current.user?.email).toBe("v@b.com");
  });
});
