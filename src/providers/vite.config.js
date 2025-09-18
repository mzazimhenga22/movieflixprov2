import path from 'path';
import { defineConfig } from 'vitest/config';
import eslintPlugin from '@nabla/vite-plugin-eslint';
import dts from 'vite-plugin-dts';
import rawPkg from './package.json';
const pkg = rawPkg;
const shouldTestProviders = process.env.MW_TEST_PROVIDERS === 'true';
const tests = shouldTestProviders
    ? ['src/__test__/providers/**/*.test.ts']
    : ['src/__test__/standard/**/*.test.ts'];
export default defineConfig((env) => ({
    plugins: [
        env.mode !== 'test' && eslintPlugin(),
        dts({
            rollupTypes: true,
        }),
    ].filter(Boolean),
    css: {
        postcss: {
            plugins: [],
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    build: {
        minify: false,
        rollupOptions: {
            external: Object.keys(pkg.dependencies ?? {}),
            output: {
                globals: Object.fromEntries(Object.keys(pkg.dependencies ?? {}).map((v) => [v, v])),
            },
        },
        outDir: 'lib',
        lib: {
            entry: path.resolve(__dirname, 'src/index.ts'),
            name: 'index',
            fileName: 'index',
            formats: ['umd', 'es'],
        },
    },
    test: {
        include: tests,
    },
}));
