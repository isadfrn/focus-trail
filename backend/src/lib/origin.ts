import type { FastifyRequest } from "fastify";

import { env } from "../env.js";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function originAllowed(origin: string): boolean {
  try {
    return new URL(origin).origin === new URL(env.CORS_ORIGIN).origin;
  } catch {
    return false;
  }
}

function refererAllowed(referer: string): boolean {
  try {
    return new URL(referer).origin === new URL(env.CORS_ORIGIN).origin;
  } catch {
    return false;
  }
}

export function isMutatingMethod(method: string): boolean {
  return MUTATING_METHODS.has(method.toUpperCase());
}

export function isTrustedOriginRequest(request: FastifyRequest): boolean {
  if (!isMutatingMethod(request.method)) return true;
  if (env.NODE_ENV === "test") return true;

  const origin = request.headers.origin;
  if (typeof origin === "string" && originAllowed(origin)) return true;

  const referer = request.headers.referer;
  if (typeof referer === "string" && refererAllowed(referer)) return true;

  return false;
}
