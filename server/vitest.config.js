import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    testTimeout: 60000,
    hookTimeout: 60000,
    globals: true,
    fileParallelism: false,
    maxConcurrency: 1,
  },
});
