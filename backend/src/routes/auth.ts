import type { FastifyInstance } from "fastify";

import { authController } from "../controllers/auth.controller.js";
import { env } from "../env.js";
import {
  loginSchema,
  logoutSchema,
  registerSchema,
} from "../docs/openapi-schemas.js";

const authRateLimit = {
  max: env.NODE_ENV === "test" ? 10_000 : 5,
  timeWindow: "1 minute" as const,
  errorResponseBuilder: () => ({
    error: "Too Many Requests",
  }),
};

export async function authRoutes(app: FastifyInstance) {
  app.post(
    "/register",
    { schema: registerSchema, config: { rateLimit: authRateLimit } },
    (request, reply) => authController.register(request, reply),
  );
  app.post(
    "/login",
    { schema: loginSchema, config: { rateLimit: authRateLimit } },
    (request, reply) => authController.login(request, reply),
  );
  app.post("/logout", { schema: logoutSchema }, (request, reply) =>
    authController.logout(request, reply),
  );

  app.post(
    "/verify-email",
    { config: { rateLimit: authRateLimit } },
    (request, reply) => authController.verifyEmail(request, reply),
  );
  app.post(
    "/resend-verification",
    { config: { rateLimit: authRateLimit } },
    (request, reply) => authController.resendVerification(request, reply),
  );
  app.post(
    "/forgot-password",
    { config: { rateLimit: authRateLimit } },
    (request, reply) => authController.forgotPassword(request, reply),
  );
  app.post(
    "/reset-password",
    { config: { rateLimit: authRateLimit } },
    (request, reply) => authController.resetPassword(request, reply),
  );
}
