import { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";

interface StartupLogger {
  info: (msg: string) => void;
  error: (obj: unknown, msg?: string) => void;
}

export type DatabaseNotReadyReason = "nao-migrado" | "inacessivel" | "desconhecido";

export class DatabaseNotReadyError extends Error {
  readonly reason: DatabaseNotReadyReason;

  constructor(reason: DatabaseNotReadyReason, options?: { cause?: unknown }) {
    super(`Banco de dados nao esta pronto (${reason}).`);
    this.name = "DatabaseNotReadyError";
    this.reason = reason;
    if (options?.cause !== undefined) this.cause = options.cause;
  }
}

const CONNECTIVITY_CODES = new Set([
  "P1000",
  "P1001",
  "P1002",
  "P1003",
  "P1010",
  "P1017",
]);

export async function assertDatabaseReady(
  prisma: Pick<PrismaClient, "user">,
  log: StartupLogger,
): Promise<void> {
  try {
    await prisma.user.count();
    log.info("Banco de dados: conectado e migrado.");
  } catch (err) {
    const code =
      err instanceof Prisma.PrismaClientKnownRequestError ? err.code : undefined;

    if (code === "P2021" || code === "P2022") {
      log.error(
        err,
        'Banco conectado, mas o schema nao esta aplicado (tabelas/colunas ausentes). ' +
          'Rode as migrations: "npm run prisma:migrate" (dev) ou ' +
          '"npx prisma migrate deploy" (prod).',
      );
      throw new DatabaseNotReadyError("nao-migrado", { cause: err });
    }

    if (
      err instanceof Prisma.PrismaClientInitializationError ||
      (code !== undefined && CONNECTIVITY_CODES.has(code))
    ) {
      log.error(
        err,
        "Nao foi possivel conectar ao banco. Confira se o Postgres esta no ar " +
          "e a DATABASE_URL no .env.",
      );
      throw new DatabaseNotReadyError("inacessivel", { cause: err });
    }

    log.error(err, "Falha ao verificar o banco de dados no startup.");
    throw new DatabaseNotReadyError("desconhecido", { cause: err });
  }
}
