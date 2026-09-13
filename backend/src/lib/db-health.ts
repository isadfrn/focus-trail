import { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";

interface StartupLogger {
  info: (msg: string) => void;
  error: (obj: unknown, msg?: string) => void;
}

export type DatabaseNotReadyReason = "not-migrated" | "unreachable" | "unknown";

export class DatabaseNotReadyError extends Error {
  readonly reason: DatabaseNotReadyReason;

  constructor(reason: DatabaseNotReadyReason, options?: { cause?: unknown }) {
    super(`Database is not ready (${reason}).`);
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
    log.info("Database: connected and migrated.");
  } catch (err) {
    const code =
      err instanceof Prisma.PrismaClientKnownRequestError ? err.code : undefined;

    if (code === "P2021" || code === "P2022") {
      log.error(
        err,
        "Database connected, but the schema is not applied (missing tables/columns). " +
          'Run the migrations: "npm run prisma:migrate" (dev) or ' +
          '"npx prisma migrate deploy" (prod).',
      );
      throw new DatabaseNotReadyError("not-migrated", { cause: err });
    }

    if (
      err instanceof Prisma.PrismaClientInitializationError ||
      (code !== undefined && CONNECTIVITY_CODES.has(code))
    ) {
      log.error(
        err,
        "Could not connect to the database. Check that Postgres is running " +
          "and DATABASE_URL in .env.",
      );
      throw new DatabaseNotReadyError("unreachable", { cause: err });
    }

    log.error(err, "Failed to check the database on startup.");
    throw new DatabaseNotReadyError("unknown", { cause: err });
  }
}
