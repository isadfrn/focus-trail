import type { FastifyInstance } from "fastify";

import { sessionController } from "../controllers/session.controller.js";
import {
  createSessionSchemaDoc,
  deleteSessionSchemaDoc,
  deleteSessionsSchemaDoc,
  listSessionsSchema,
  statsSchemaDoc,
} from "../docs/openapi-schemas.js";

export async function sessionRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.post("/", { schema: createSessionSchemaDoc }, (request, reply) =>
    sessionController.create(request, reply),
  );
  app.get("/", { schema: listSessionsSchema }, (request, reply) =>
    sessionController.list(request, reply),
  );
  app.get("/stats", { schema: statsSchemaDoc }, (request, reply) =>
    sessionController.stats(request, reply),
  );
  app.delete("/", { schema: deleteSessionsSchemaDoc }, (request, reply) =>
    sessionController.removeMany(request, reply),
  );
  app.delete("/:id", { schema: deleteSessionSchemaDoc }, (request, reply) =>
    sessionController.remove(request, reply),
  );
}
