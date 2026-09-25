/**
 * Покрытие домена — критерий приёмки G2: ≥90% веток в @tw/core (task.md §10).
 * Отчёт собирается командой `yarn workspace @tw/core test:coverage`.
 */
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/contracts/**"],
      reporter: ["text", "html"],
      thresholds: {
        lines: 90,
        branches: 90,
        functions: 90,
        statements: 90,
      },
    },
  },
});
