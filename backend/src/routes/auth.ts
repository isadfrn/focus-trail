import type { FastifyInstance } from "fastify";

import { authController } from "../controllers/auth.controller.js";
import {
  loginSchema,
  logoutSchema,
  registerSchema,
} from "../docs/openapi-schemas.js";

export async function authRoutes(app: FastifyInstance) {
  app.post("/register", { schema: registerSchema }, (request, reply) =>
    authController.register(request, reply),
  );
  app.post("/login", { schema: loginSchema }, (request, reply) =>
    authController.login(request, reply),
  );
  app.post("/logout", { schema: logoutSchema }, (request, reply) =>
    authController.logout(request, reply),
  );
}
