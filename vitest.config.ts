import path from 'node:path'
import { defineConfig } from 'vitest/config'


export default defineConfig({
  root: '.',
  resolve: {
    alias: {
      src: path.resolve(__dirname, './src')
    },
  },
  test: {
    include: [
      '**/src/**/*.test.ts',
      '**/tests/**/*.ts'
    ]
  }
})
