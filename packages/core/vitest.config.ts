import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    typecheck: {
      // Surface expectTypeOf failures alongside runtime test failures.
      enabled: true,
      tsconfig: './tsconfig.json',
    },
  },
})
