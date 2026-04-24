import { kiss } from '@kissjs/core'
import { defineConfig } from 'vite'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// Vite needs resolve.alias because JSR packages aren't in node_modules.
// Route components import from '@kissjs/core' for unified DX,
// but at build time Vite resolves to the local source.
// We point to a shim that only re-exports runtime APIs (LitElement, html, css, Hono),
// avoiding pull-in of build-time code (node:fs, Vite plugin internals).
// NOTE: __dirname is unavailable in Deno ESM — use import.meta instead.
const __dir = dirname(fileURLToPath(import.meta.url))
const runtimeShim = resolve(__dir, 'app/.kiss-runtime.ts')

export default defineConfig({
  base: '/kiss/',
  plugins: [
    kiss({
      routesDir: 'app/routes',
      islandsDir: 'app/islands',
      componentsDir: 'app/components',
      ui: { cdn: true },
    }),
  ],
  resolve: {
    alias: {
      '@kissjs/core': runtimeShim,
    },
  },
})
