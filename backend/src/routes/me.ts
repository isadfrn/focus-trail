import type { FastifyInstance } from "fastify";

import { meController } from "../controllers/me.controller.js";
import {
  changePasswordSchemaDoc,
  meSchema,
  updatePreferencesSchemaDoc,
} from "../docs/openapi-schemas.js";

export async function meRoutes(app: FastifyInstance) {
  app.get(
    "/me",
    { schema: meSchema, preHandler: app.authenticate },
    (request, reply) => meController.getMe(request, reply),
  );

  app.patch(
    "/me",
    { schema: updatePreferencesSchemaDoc, preHandler: app.authenticate },
    (request, reply) => meController.updatePreferences(request, reply),
  );

  app.patch(
    "/me/password",
    { schema: changePasswordSchemaDoc, preHandler: app.authenticate },
    (request, reply) => meController.changePassword(request, reply),
  );
}
