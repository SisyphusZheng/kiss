import { kiss } from '@kissjs/core'
import { defineConfig } from 'vite'
import { resolve } from 'node:path'

// Vite needs resolve.alias because JSR packages aren't in node_modules.
// Route components import from '@kissjs/core' for unified DX,
// but at build time Vite resolves to the local source.
// We point to a shim that only re-exports runtime APIs (LitElement, html, css, Hono),
// avoiding pull-in of build-time code (node:fs, Vite plugin internals).
const runtimeShim = resolve(__dirname, 'app/.kiss-runtime.ts')

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
