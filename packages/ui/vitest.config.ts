/**
 * Тесты кита: DOM-окружение jsdom, jest-dom для доступных утверждений.
 * Настройки повторяют apps/web — компоненты из кита тестируются в обоих местах.
 */
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: false,
    setupFiles: ["./src/test-setup.ts"],
  },
});
