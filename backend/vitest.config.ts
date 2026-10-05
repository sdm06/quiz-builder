import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    root: './',
    environment: 'node',
    include: ['**/*.spec.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/src/generated/**', 'test/**/*.e2e-spec.ts'],
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      exclude: ['src/generated/**', 'test/**', '**/*.module.ts'],
    },
  },
});