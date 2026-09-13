import { afterEach, describe, expect, it, vi } from "vitest";

import { request } from "./http";

function stubFetch(response: {
  ok: boolean;
  status: number;
  text: () => Promise<string>;
}) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("request", () => {
  it("returns parsed JSON on success", async () => {
    stubFetch({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({ hello: "world" })),
    });
    await expect(request("/x")).resolves.toEqual({ hello: "world" });
  });

  it("sends credentials and a JSON content-type when a body is present", async () => {
    const fetchMock = stubFetch({
      ok: true,
      status: 200,
      text: () => Promise.resolve("{}"),
    });
    await request("/x", { method: "POST", body: JSON.stringify({ a: 1 }) });
    const init = fetchMock.mock.calls[0][1];
    expect(init.credentials).toBe("include");
    expect(init.headers["Content-Type"]).toBe("application/json");
  });

  it("throws an ApiError carrying the error code on a non-2xx", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    stubFetch({
      ok: false,
      status: 401,
      text: () => Promise.resolve(JSON.stringify({ error: "invalid_credentials" })),
    });
    await expect(request("/x")).rejects.toMatchObject({
      status: 401,
      code: "invalid_credentials",
    });
  });

  it("falls back to http_<status> when there is no error code", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    stubFetch({ ok: false, status: 500, text: () => Promise.resolve("") });
    await expect(request("/x")).rejects.toMatchObject({
      status: 500,
      code: "http_500",
    });
  });

  it("rethrows network errors", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("boom")));
    await expect(request("/x")).rejects.toThrow("boom");
  });
});
