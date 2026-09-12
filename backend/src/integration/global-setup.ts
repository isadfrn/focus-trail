import { execSync } from "node:child_process";

/**
 * Runs once before the integration suite: applies migrations to the test
 * database so its schema matches production.
 */
export default function setup() {
  const DATABASE_URL =
    process.env.INTEGRATION_DATABASE_URL ??
    "postgresql://focus:focus@127.0.0.1:5432/focustrail_test?schema=public";

  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL },
  });
}
