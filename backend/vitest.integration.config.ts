import { defineConfig } from "vitest/config";

// A dedicated test database, overridable in CI via INTEGRATION_DATABASE_URL.
const DATABASE_URL =
  process.env.INTEGRATION_DATABASE_URL ??
  "postgresql://focus:focus@127.0.0.1:5432/focustrail_test?schema=public";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.integration.test.ts"],
    globalSetup: ["src/integration/global-setup.ts"],
    setupFiles: ["src/integration/setup.ts"],
    // Serialize: the suites share one database.
    fileParallelism: false,
    env: {
      NODE_ENV: "test",
      DATABASE_URL,
      JWT_SECRET: "integration-tests-jwt-secret-min-32-characters",
      CORS_ORIGIN: "http://localhost:5173",
    },
  },
});
