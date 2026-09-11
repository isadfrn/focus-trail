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
  it("passa e loga sucesso quando a tabela existe", async () => {
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

  it("aponta as migrations quando a tabela nao existe (P2021)", async () => {
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
    ).rejects.toMatchObject({ reason: "nao-migrado" });

    expect(log.error).toHaveBeenCalledOnce();
    expect(String(log.error.mock.calls[0]?.[1])).toContain("prisma:migrate");
  });

  it("aponta conexao quando o banco esta inacessivel (P1001)", async () => {
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
    ).rejects.toMatchObject({ reason: "inacessivel" });
  });

  it("trata erro de inicializacao do Prisma como inacessivel", async () => {
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
    ).rejects.toMatchObject({ reason: "inacessivel" });
  });

  it("marca desconhecido para erros nao classificados", async () => {
    const log = makeLog();

    await expect(
      assertDatabaseReady(
        prismaWith(() => Promise.reject(new Error("boom"))),
        log,
      ),
    ).rejects.toMatchObject({ reason: "desconhecido" });

    expect(log.error).toHaveBeenCalledOnce();
  });
});
