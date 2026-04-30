import { kiss } from '../packages/kiss-core/src/index.js';
import { defineConfig } from 'vite';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const runtimeShim = resolve(__dir, 'app/.kiss-runtime.ts');

export default defineConfig({
  base: '/demo/',
  plugins: [
    kiss({
      routesDir: 'app/routes',
      islandsDir: 'app/islands',
      pwa: {
        name: 'KISS Dogfood',
        shortName: 'KISS DF2',
        themeColor: '#0f172a',
        backgroundColor: '#0f172a',
      },
      inject: {
        headFragments: [
          '<link rel="icon" href="/demo/favicon.svg" />',
        ],
      },
      ssr: {
        noExternal: ['@kissjs/core'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@kissjs/core': runtimeShim,
    },
  },
});
