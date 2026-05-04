import { defineConfig } from 'vitest/config';
import path from 'node:path';

const pkg = (name: string) =>
  path.resolve(__dirname, `packages/${name}/src/index.ts`);

export default defineConfig({
  resolve: {
    alias: {
      '@acmvp/types': pkg('types'),
      '@acmvp/config': pkg('config'),
      '@acmvp/database': pkg('database'),
      '@acmvp/auth': pkg('auth'),
      '@acmvp/ui': pkg('ui'),
      '@acmvp/ai': pkg('ai'),
      '@acmvp/api': pkg('api'),
      '@acmvp/billing': pkg('billing'),
      '@acmvp/notifications': pkg('notifications'),
      '@acmvp/integrations': pkg('integrations'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/unit/**/*.{test,spec}.{ts,tsx}', 'packages/*/src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['packages/*/src/**/*.ts', 'modules/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.spec.ts', '**/index.ts'],
    },
  },
});
