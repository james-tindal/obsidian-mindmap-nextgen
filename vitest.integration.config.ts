import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['integration/**/*.test.ts'],
    fileParallelism: false,
    testTimeout: 30_000,
    globalSetup: ['./integration/global-setup.ts'],
    setupFiles: ['obsidian-integration-testing/vitest-setup'],
  },
})
