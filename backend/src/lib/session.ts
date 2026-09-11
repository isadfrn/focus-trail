import type { FastifyReply } from "fastify";

import { env } from "../env.js";

export const COOKIE_NAME = "ft_token";

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: env.SESSION_MAX_AGE,
  };
}

export async function issueSession(
  reply: FastifyReply,
  payload: { sub: string; email: string },
): Promise<void> {
  const token = await reply.jwtSign(payload, {
    expiresIn: env.SESSION_MAX_AGE,
  });
  reply.setCookie(COOKIE_NAME, token, sessionCookieOptions());
}
