import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { parseBody } from "./parse-body.js";

describe("parseBody", () => {
  it("returns parsed data", () => {
    const reply = { code: vi.fn(), send: vi.fn() };
    reply.code.mockReturnValue(reply);

    const data = parseBody(
      z.object({ email: z.string().email() }),
      { email: "a@b.com" },
      reply as never,
    );

    expect(data).toEqual({ email: "a@b.com" });
    expect(reply.code).not.toHaveBeenCalled();
  });

  it("sends 400 on invalid body", () => {
    const reply = { code: vi.fn(), send: vi.fn() };
    reply.code.mockReturnValue(reply);

    const data = parseBody(
      z.object({ email: z.string().email() }),
      { email: "nope" },
      reply as never,
    );

    expect(data).toBeNull();
    expect(reply.code).toHaveBeenCalledWith(400);
    expect(reply.send).toHaveBeenCalledWith({ error: "Invalid Body" });
  });
});
