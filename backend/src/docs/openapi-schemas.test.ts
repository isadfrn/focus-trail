import { describe, expect, it } from "vitest";

import {
  createSessionSchemaDoc,
  healthSchema,
  loginSchema,
  meSchema,
  registerSchema,
} from "./openapi-schemas.js";

describe("openapi schemas", () => {
  it("exposes route schemas with tags", () => {
    expect(healthSchema.tags).toEqual(["Health"]);
    expect(registerSchema.tags).toEqual(["Auth"]);
    expect(loginSchema.tags).toEqual(["Auth"]);
    expect(meSchema.tags).toEqual(["User"]);
    expect(createSessionSchemaDoc.tags).toEqual(["Sessions"]);
  });
});
