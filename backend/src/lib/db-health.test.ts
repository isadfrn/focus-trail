import { Prisma } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import { assertDatabaseReady } from "./db-health.js";

function makeLog() {
  return { info: vi.fn(), error: vi.fn() };
}

function prismaWith(count: () => Promise<number>) {
  return { user: { count } } as never;
}

const CLIENT_VERSION = "6.12.0";

describe("assertDatabaseReady", () => {
  it("passes and logs success when the table exists", async () => {
    const log = makeLog();
    await expect(
      assertDatabaseReady(
        prismaWith(() => Promise.resolve(0)),
        log,
      ),
    ).resolves.toBeUndefined();

    expect(log.info).toHaveBeenCalledOnce();
    expect(log.error).not.toHaveBeenCalled();
  });

  it("points to migrations when the table is missing (P2021)", async () => {
    const err = new Prisma.PrismaClientKnownRequestError("no table", {
      code: "P2021",
      clientVersion: CLIENT_VERSION,
    });
    const log = makeLog();

    await expect(
      assertDatabaseReady(
        prismaWith(() => Promise.reject(err)),
        log,
      ),
    ).rejects.toMatchObject({ reason: "not-migrated" });

    expect(log.error).toHaveBeenCalledOnce();
    expect(String(log.error.mock.calls[0]?.[1])).toContain("prisma:migrate");
  });

  it("points to the connection when the database is unreachable (P1001)", async () => {
    const err = new Prisma.PrismaClientKnownRequestError("unreachable", {
      code: "P1001",
      clientVersion: CLIENT_VERSION,
    });
    const log = makeLog();

    await expect(
      assertDatabaseReady(
        prismaWith(() => Promise.reject(err)),
        log,
      ),
    ).rejects.toMatchObject({ reason: "unreachable" });
  });

  it("treats a Prisma initialization error as unreachable", async () => {
    const err = new Prisma.PrismaClientInitializationError(
      "cant init",
      CLIENT_VERSION,
    );
    const log = makeLog();

    await expect(
      assertDatabaseReady(
        prismaWith(() => Promise.reject(err)),
        log,
      ),
    ).rejects.toMatchObject({ reason: "unreachable" });
  });

  it("marks unknown for unclassified errors", async () => {
    const log = makeLog();

    await expect(
      assertDatabaseReady(
        prismaWith(() => Promise.reject(new Error("boom"))),
        log,
      ),
    ).rejects.toMatchObject({ reason: "unknown" });

    expect(log.error).toHaveBeenCalledOnce();
  });
});
