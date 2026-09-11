import { buildApp } from "./app.js";
import { env } from "./env.js";
import { assertDatabaseReady, DatabaseNotReadyError } from "./lib/db-health.js";
import { prisma } from "./prisma.js";

if (env.NODE_ENV === "development") {
  const { default: figlet } = await import("figlet");
  console.log(figlet.textSync("Focus Trail", { font: "Standard" }));
}

const app = await buildApp();

try {
  await assertDatabaseReady(prisma, app.log);
} catch (err) {
  if (err instanceof DatabaseNotReadyError) {
    await prisma.$disconnect().catch(() => {});
    process.exit(1);
  }
  throw err;
}

const shutdown = async (signal: string) => {
  app.log.info(`Received ${signal}, shutting down...`);
  await app.close();
  await prisma.$disconnect();
  process.exit(0);
};

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

try {
  await app.listen({ port: env.PORT, host: env.HOST });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
