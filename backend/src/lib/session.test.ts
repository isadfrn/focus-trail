import { beforeEach, describe, expect, it, vi } from "vitest";

const { envMock } = vi.hoisted(() => {
  const envMock: {
    NODE_ENV: "development" | "production" | "test";
    SESSION_MAX_AGE: number;
  } = {
    NODE_ENV: "development",
    SESSION_MAX_AGE: 604800,
  };
  return { envMock };
});

vi.mock("../env.js", () => ({
  env: envMock,
}));

const { create, revokeById } = vi.hoisted(() => ({
  create: vi.fn(),
  revokeById: vi.fn(),
}));

vi.mock("../repositories/auth-session.repository.js", () => ({
  authSessionRepository: {
    create,
    revokeById,
    findActiveById: vi.fn(),
  },
}));

import {
  COOKIE_NAME,
  issueSession,
  revokeSession,
  sessionCookieOptions,
} from "./session.js";

describe("session helpers", () => {
  beforeEach(() => {
    envMock.NODE_ENV = "development";
    envMock.SESSION_MAX_AGE = 604800;
    vi.clearAllMocks();
    create.mockResolvedValue({ id: "session-1" });
  });

  it("exports cookie name", () => {
    expect(COOKIE_NAME).toBe("ft_token");
  });

  it("builds cookie options for development", () => {
    expect(sessionCookieOptions()).toEqual({
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      path: "/",
      maxAge: 604800,
    });
  });

  it("sets secure cookie in production", () => {
    envMock.NODE_ENV = "production";
    expect(sessionCookieOptions().secure).toBe(true);
  });

  it("creates auth session, signs jwt and sets cookie", async () => {
    const reply = {
      jwtSign: vi.fn().mockResolvedValue("signed-token"),
      setCookie: vi.fn(),
    };

    await issueSession(reply as never, {
      sub: "user-1",
      email: "a@b.com",
    });

    expect(create).toHaveBeenCalledOnce();
    const createArg = create.mock.calls[0]?.[0] as {
      userId: string;
      expiresAt: Date;
    };
    expect(createArg.userId).toBe("user-1");
    expect(createArg.expiresAt).toBeInstanceOf(Date);
    expect(reply.jwtSign).toHaveBeenCalledWith(
      { sub: "user-1", email: "a@b.com", jti: "session-1" },
      { expiresIn: 604800 },
    );
    expect(reply.setCookie).toHaveBeenCalledWith(
      "ft_token",
      "signed-token",
      expect.objectContaining({ httpOnly: true, sameSite: "strict" }),
    );
  });

  it("revokes a session by jti", async () => {
    await revokeSession("session-1");
    expect(revokeById).toHaveBeenCalledWith("session-1");
  });
});
