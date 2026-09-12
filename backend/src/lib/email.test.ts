import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../env.js", () => ({
  env: {
    EMAIL_ENABLED: true,
    NODE_ENV: "test",
    RESEND_API_KEY: "test-key",
    EMAIL_FROM: "Focus Trail <no-reply@example.com>",
  },
}));

import { isEmailEnabled, sendEmail } from "./email.js";

const message = {
  to: "a@b.com",
  subject: "Hello",
  html: "<p>Hi</p>",
  text: "Hi",
};

describe("email (enabled)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reports enabled from env", () => {
    expect(isEmailEnabled()).toBe(true);
  });

  it("posts the message to Resend", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    await sendEmail(message);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({ method: "POST" }),
    );
    const options = fetchMock.mock.calls[0]?.[1] as { body: string } | undefined;
    const body = JSON.parse(options?.body ?? "{}") as {
      to: string[];
      subject: string;
    };
    expect(body.to).toEqual(["a@b.com"]);
    expect(body.subject).toBe("Hello");
  });

  it("throws when Resend responds with an error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => "unauthorized",
      }),
    );

    await expect(sendEmail(message)).rejects.toThrow(/Resend/);
  });
});
