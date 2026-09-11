import type { FastifyInstance } from "fastify";

import { sessionController } from "../controllers/session.controller.js";
import {
  createSessionSchemaDoc,
  deleteSessionSchemaDoc,
  deleteSessionsSchemaDoc,
  listSessionsSchema,
} from "../docs/openapi-schemas.js";

export async function sessionRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.post("/", { schema: createSessionSchemaDoc }, (request, reply) =>
    sessionController.create(request, reply),
  );
  app.get("/", { schema: listSessionsSchema }, (request) =>
    sessionController.list(request),
  );
  app.delete("/", { schema: deleteSessionsSchemaDoc }, (request, reply) =>
    sessionController.removeMany(request, reply),
  );
  app.delete("/:id", { schema: deleteSessionSchemaDoc }, (request, reply) =>
    sessionController.remove(request, reply),
  );
}
