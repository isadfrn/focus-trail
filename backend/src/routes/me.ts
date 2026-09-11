import type { FastifyInstance } from "fastify";

import { meController } from "../controllers/me.controller.js";
import { meSchema } from "../docs/openapi-schemas.js";

export async function meRoutes(app: FastifyInstance) {
  app.get(
    "/me",
    { schema: meSchema, preHandler: app.authenticate },
    (request, reply) => meController.getMe(request, reply),
  );
}
