import type { FastifyReply } from "fastify";

import { env } from "../env.js";
import {
  authSessionRepository,
  type AuthSessionRepository,
} from "../repositories/auth-session.repository.js";

export const COOKIE_NAME = "ft_token";

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: env.SESSION_MAX_AGE,
  };
}

export async function issueSession(
  reply: FastifyReply,
  payload: { sub: string; email: string },
  sessions: AuthSessionRepository = authSessionRepository,
): Promise<void> {
  const expiresAt = new Date(Date.now() + env.SESSION_MAX_AGE * 1000);
  const session = await sessions.create({
    userId: payload.sub,
    expiresAt,
  });

  const token = await reply.jwtSign(
    { sub: payload.sub, email: payload.email, jti: session.id },
    { expiresIn: env.SESSION_MAX_AGE },
  );
  reply.setCookie(COOKIE_NAME, token, sessionCookieOptions());
}

export async function revokeSession(
  jti: string,
  sessions: AuthSessionRepository = authSessionRepository,
): Promise<void> {
  await sessions.revokeById(jti);
}
