import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    fileParallelism: false,
    include: ["tests/performance.test.ts"],
    maxWorkers: 1,
    pool: "threads",
    testTimeout: 600_000,
  },
});
