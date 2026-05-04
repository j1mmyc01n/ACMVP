import { defineConfig } from 'vitest/config';
export default defineConfig({
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
//# sourceMappingURL=vitest.config.js.map