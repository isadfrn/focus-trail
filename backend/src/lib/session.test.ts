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

import {
  COOKIE_NAME,
  issueSession,
  sessionCookieOptions,
} from "./session.js";

describe("session helpers", () => {
  beforeEach(() => {
    envMock.NODE_ENV = "development";
    envMock.SESSION_MAX_AGE = 604800;
  });

  it("exports cookie name", () => {
    expect(COOKIE_NAME).toBe("ft_token");
  });

  it("builds cookie options for development", () => {
    expect(sessionCookieOptions()).toEqual({
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 604800,
    });
  });

  it("sets secure cookie in production", () => {
    envMock.NODE_ENV = "production";
    expect(sessionCookieOptions().secure).toBe(true);
  });

  it("signs jwt and sets cookie", async () => {
    const reply = {
      jwtSign: vi.fn().mockResolvedValue("signed-token"),
      setCookie: vi.fn(),
    };

    await issueSession(reply as never, {
      sub: "user-1",
      email: "a@b.com",
    });

    expect(reply.jwtSign).toHaveBeenCalledWith(
      { sub: "user-1", email: "a@b.com" },
      { expiresIn: 604800 },
    );
    expect(reply.setCookie).toHaveBeenCalledWith(
      "ft_token",
      "signed-token",
      expect.objectContaining({ httpOnly: true }),
    );
  });
});
