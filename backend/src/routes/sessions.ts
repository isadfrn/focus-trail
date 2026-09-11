import type { FastifyInstance } from "fastify";

import { sessionController } from "../controllers/session.controller.js";
import {
  createSessionSchemaDoc,
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
}
