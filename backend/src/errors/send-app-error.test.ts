import { describe, expect, it, vi } from "vitest";

const { envMock } = vi.hoisted(() => ({
  envMock: {
    NODE_ENV: "test" as "development" | "production" | "test",
  },
}));

vi.mock("../env.js", () => ({
  env: envMock,
}));

import { AppError } from "./app-error.js";
import { registerErrorHandler } from "./send-app-error.js";

describe("registerErrorHandler", () => {
  function setup() {
    const handlers: ((
      error: Error,
      request: unknown,
      reply: unknown,
    ) => void)[] = [];
    const app = {
      setErrorHandler: (
        fn: (error: Error, request: unknown, reply: unknown) => void,
      ) => {
        handlers.push(fn);
      },
      log: { error: vi.fn() },
    };
    const reply = {
      sent: false,
      code: vi.fn(),
      send: vi.fn(),
    };
    reply.code.mockReturnValue(reply);
    registerErrorHandler(app as never);
    const handler = handlers[0];
    if (!handler) throw new Error("handler not registered");
    return { handler, app, reply };
  }

  it("serializes AppError responses", () => {
    const { handler, reply, app } = setup();
    handler(new AppError("nope", 400, "X"), {}, reply);

    expect(reply.code).toHaveBeenCalledWith(400);
    expect(reply.send).toHaveBeenCalledWith({ error: "nope" });
    expect(app.log.error).not.toHaveBeenCalled();
  });

  it("logs and hides internals outside development", () => {
    envMock.NODE_ENV = "test";
    const { handler, reply, app } = setup();
    handler(new Error("secret db"), {}, reply);

    expect(app.log.error).toHaveBeenCalled();
    expect(reply.send).toHaveBeenCalledWith({
      error: "Internal Server Error",
    });
  });

  it("exposes error message in development", () => {
    envMock.NODE_ENV = "development";
    const { handler, reply } = setup();
    handler(new Error("secret db"), {}, reply);

    expect(reply.send).toHaveBeenCalledWith({ error: "secret db" });
  });

  it("no-ops when reply already sent", () => {
    const { handler, reply } = setup();
    reply.sent = true;
    handler(new Error("x"), {}, reply);

    expect(reply.code).not.toHaveBeenCalled();
  });
});
