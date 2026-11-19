import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "tests/functions.test.ts",
      "tests/builders.test.ts",
      "tests/results.test.ts",
      "tests/type-display.test.ts",
    ],
  },
});
