import fastifyCookie from "@fastify/cookie";
import fastifyCors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import Fastify from "fastify";

import { registerSwagger } from "./docs/swagger.js";
import { healthSchema } from "./docs/openapi-schemas.js";
import { env } from "./env.js";
import { COOKIE_NAME } from "./lib/session.js";
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

  // Keep Zod as the request validator; route schemas are for OpenAPI docs.
  app.setValidatorCompiler(() => {
    return (data: unknown) => ({ value: data });
  });
  app.setSerializerCompiler(() => {
    return (data: unknown) => JSON.stringify(data);
  });

  await app.register(fastifyCors, {
    origin: env.CORS_ORIGIN,
    credentials: true,
  });
  await app.register(fastifyCookie);
  await app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    cookie: { cookieName: COOKIE_NAME, signed: false },
  });

  await registerSwagger(app);

  app.decorate("authenticate", async (request, reply) => {
    try {
      await request.jwtVerify();
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
