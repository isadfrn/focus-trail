import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

const BACKEND = "backend";

function run(command, options = {}) {
  execSync(command, { stdio: "inherit", ...options });
}

function step(message) {
  console.log(`\n→ ${message}`);
}

if (!existsSync(`${BACKEND}/.env`)) {
  console.error(
    "backend/.env not found. Copy backend/.env.example to backend/.env and fill it in before continuing.",
  );
  process.exit(1);
}

try {
  execSync("docker info", { stdio: "ignore" });
} catch {
  console.error(
    "Docker is not reachable. Open Docker Desktop (wait for the daemon to start) and try again.",
  );
  process.exit(1);
}

step("Removing previous local container and volume (local data will be lost)...");
run("docker compose down -v --remove-orphans", { cwd: BACKEND });

step("Starting Postgres and waiting until it is healthy...");
run("docker compose up -d --wait db", { cwd: BACKEND });

step("Applying migrations...");
run("npx prisma migrate deploy", { cwd: BACKEND });

step("Generating Prisma Client...");
run("npx prisma generate", { cwd: BACKEND });

console.log(
  "\n✔ Database is ready and migrated. Start the app (npm run dev) and create a user via the signup screen to test.",
);
