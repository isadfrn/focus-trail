import { beforeEach, describe, expect, it, vi } from "vitest";

const { envMock } = vi.hoisted(() => {
  const envMock: {
    NODE_ENV: "development" | "production" | "test";
    CORS_ORIGIN: string;
  } = {
    NODE_ENV: "development",
    CORS_ORIGIN: "http://localhost:5173",
  };
  return { envMock };
});

vi.mock("../env.js", () => ({
  env: envMock,
}));

import { isTrustedOriginRequest } from "./origin.js";

describe("isTrustedOriginRequest", () => {
  beforeEach(() => {
    envMock.NODE_ENV = "development";
    envMock.CORS_ORIGIN = "http://localhost:5173";
  });

  it("allows non-mutating methods", () => {
    expect(
      isTrustedOriginRequest({
        method: "GET",
        headers: {},
      } as never),
    ).toBe(true);
  });

  it("allows matching Origin", () => {
    expect(
      isTrustedOriginRequest({
        method: "POST",
        headers: { origin: "http://localhost:5173" },
      } as never),
    ).toBe(true);
  });

  it("allows matching Referer when Origin is missing", () => {
    expect(
      isTrustedOriginRequest({
        method: "POST",
        headers: { referer: "http://localhost:5173/app" },
      } as never),
    ).toBe(true);
  });

  it("rejects foreign Origin", () => {
    expect(
      isTrustedOriginRequest({
        method: "POST",
        headers: { origin: "https://evil.example" },
      } as never),
    ).toBe(false);
  });

  it("rejects malformed Origin and Referer", () => {
    expect(
      isTrustedOriginRequest({
        method: "POST",
        headers: { origin: "not-a-url" },
      } as never),
    ).toBe(false);
    expect(
      isTrustedOriginRequest({
        method: "DELETE",
        headers: { referer: "also-not-a-url" },
      } as never),
    ).toBe(false);
  });

  it("relaxes checks in test env", () => {
    envMock.NODE_ENV = "test";
    expect(
      isTrustedOriginRequest({
        method: "POST",
        headers: {},
      } as never),
    ).toBe(true);
  });
});
