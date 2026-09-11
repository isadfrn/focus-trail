import fastifyCookie from "@fastify/cookie";
import fastifyCors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import fastifyRateLimit from "@fastify/rate-limit";
import Fastify from "fastify";

import { registerSwagger } from "./docs/swagger.js";
import { healthSchema } from "./docs/openapi-schemas.js";
import { env } from "./env.js";
import { registerErrorHandler } from "./errors/send-app-error.js";
import { isTrustedOriginRequest } from "./lib/origin.js";
import { COOKIE_NAME } from "./lib/session.js";
import { authSessionRepository } from "./repositories/auth-session.repository.js";
import { authRoutes } from "./routes/auth.js";
import { meRoutes } from "./routes/me.js";
import { sessionRoutes } from "./routes/sessions.js";

export async function buildApp() {
  const app = Fastify({
    logger:
      env.NODE_ENV === "test"
        ? false
        : env.NODE_ENV === "development"
          ? { transport: { target: "pino-pretty" } }
          : true,
  });

  registerErrorHandler(app);

  app.setValidatorCompiler(() => {
    return (data: unknown) => ({ value: data });
  });
  app.setSerializerCompiler(() => {
    return (data: unknown) => JSON.stringify(data);
  });

  await app.register(fastifyRateLimit, {
    global: true,
    max: env.NODE_ENV === "test" ? 10_000 : 100,
    timeWindow: "1 minute",
    errorResponseBuilder: () => ({
      error: "Too Many Requests",
    }),
  });

  await app.register(fastifyCors, {
    origin: env.CORS_ORIGIN,
    credentials: true,
  });
  await app.register(fastifyCookie);
  await app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    cookie: {
      cookieName: COOKIE_NAME,
      signed: false,
    },
  });

  app.addHook("onRequest", async (request, reply) => {
    if (request.headers.authorization) {
      delete request.headers.authorization;
    }
    if (!isTrustedOriginRequest(request)) {
      return reply.code(403).send({ error: "Forbidden Origin" });
    }
  });

  if (env.NODE_ENV === "development" || env.ENABLE_SWAGGER) {
    await registerSwagger(app);
  }

  app.decorate("authenticate", async (request, reply) => {
    try {
      await request.jwtVerify();
      const jti = request.user.jti;
      if (!jti) {
        return reply.code(401).send({ error: "Unauthorized" });
      }
      const session = await authSessionRepository.findActiveById(jti);
      if (!session) {
        return reply.code(401).send({ error: "Unauthorized" });
      }
    } catch {
      return reply.code(401).send({ error: "Unauthorized" });
    }
  });

  app.get("/api/health", { schema: healthSchema }, async () => ({
    status: "ok",
  }));

  await app.register(authRoutes, { prefix: "/api/auth" });
  await app.register(meRoutes, { prefix: "/api" });
  await app.register(sessionRoutes, { prefix: "/api/sessions" });

  return app;
}
