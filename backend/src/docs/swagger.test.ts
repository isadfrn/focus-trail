import Fastify from "fastify";
import { describe, expect, it } from "vitest";

import { registerSwagger } from "./swagger.js";

describe("registerSwagger", () => {
  it("registers swagger ui routes", async () => {
    const app = Fastify({ logger: false });
    await registerSwagger(app);
    app.get("/ping", async () => ({ ok: true }));
    await app.ready();

    const docs = await app.inject({ method: "GET", url: "/docs" });
    expect(docs.statusCode).toBe(200);

    await app.close();
  });
});
