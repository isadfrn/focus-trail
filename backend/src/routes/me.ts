import type { FastifyInstance } from "fastify";

import { meController } from "../controllers/me.controller.js";
import {
  changePasswordSchemaDoc,
  deleteAccountSchemaDoc,
  exportDataSchemaDoc,
  meSchema,
  updatePreferencesSchemaDoc,
} from "../docs/openapi-schemas.js";
import { env } from "../env.js";

const sensitiveRateLimit = {
  max: env.NODE_ENV === "test" ? 10_000 : 5,
  timeWindow: "1 minute" as const,
  errorResponseBuilder: () => ({
    error: "Too Many Requests",
  }),
};

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

  app.get(
    "/me/export",
    {
      schema: exportDataSchemaDoc,
      preHandler: app.authenticate,
      config: { rateLimit: sensitiveRateLimit },
    },
    (request, reply) => meController.exportData(request, reply),
  );

  app.delete(
    "/me",
    {
      schema: deleteAccountSchemaDoc,
      preHandler: app.authenticate,
      config: { rateLimit: sensitiveRateLimit },
    },
    (request, reply) => meController.deleteAccount(request, reply),
  );
}
