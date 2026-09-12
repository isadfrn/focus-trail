import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Integration tests hit a real database and run under their own config.
    exclude: ["**/node_modules/**", "**/*.integration.test.ts"],
    // env.ts validates these on import. Unit tests mock Prisma, so the values
    // are placeholders — this just lets the suite run in CI (no .env there).
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://test:test@localhost:5432/test?schema=public",
      JWT_SECRET: "unit-tests-jwt-secret-at-least-32-characters",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.test.ts",
        "src/integration/**",
        // Thin route wiring — declarative and exercised by integration tests.
        "src/routes/**",
        "src/server.ts",
        "src/env.ts",
        "src/prisma.ts",
        "src/types.d.ts",
      ],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 85,
        statements: 85,
      },
    },
  },
});
