import { describe, expect, it, vi } from "vitest";

import {
  AppError,
  ConflictError,
  InvalidCredentialsError,
  UnauthorizedError,
  ValidationError,
} from "./app-error.js";
import { sendAppError } from "./send-app-error.js";

describe("AppError hierarchy", () => {
  it("creates base AppError", () => {
    const error = new AppError("boom", 500, "BOOM");
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("boom");
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe("BOOM");
    expect(error.name).toBe("AppError");
  });

  it("uses default messages for subclasses", () => {
    expect(new ValidationError()).toMatchObject({
      message: "Invalid Body",
      statusCode: 400,
      code: "VALIDATION_ERROR",
      name: "ValidationError",
    });
    expect(new ConflictError()).toMatchObject({
      message: "Email Taken",
      statusCode: 409,
      code: "CONFLICT",
    });
    expect(new UnauthorizedError()).toMatchObject({
      message: "Unauthorized",
      statusCode: 401,
      code: "UNAUTHORIZED",
    });
    expect(new InvalidCredentialsError()).toMatchObject({
      message: "Invalid Credentials",
      statusCode: 401,
      code: "INVALID_CREDENTIALS",
    });
  });
});

describe("sendAppError", () => {
  it("maps AppError to HTTP response", () => {
    const send = vi.fn();
    const reply = {
      code: vi.fn().mockReturnValue({ send }),
    };

    sendAppError(reply as never, new ConflictError());

    expect(reply.code).toHaveBeenCalledWith(409);
    expect(send).toHaveBeenCalledWith({ error: "Email Taken" });
  });

  it("rethrows unknown errors", () => {
    const reply = { code: vi.fn() };
    expect(() => sendAppError(reply as never, new Error("nope"))).toThrow(
      "nope",
    );
  });
});
