import { kiss } from '@kissjs/core';
import { defineConfig } from 'vite';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Vite needs resolve.alias because JSR packages aren't in node_modules.
// Route components import from '@kissjs/core' for unified DX,
// but at build time Vite resolves to the local source.
// We point to a shim that only re-exports runtime APIs (LitElement, html, css, Hono),
// avoiding pull-in of build-time code (node:fs, Vite plugin internals).
// NOTE: __dirname is unavailable in Deno ESM — use import.meta instead.
const __dir = dirname(fileURLToPath(import.meta.url));
const runtimeShim = resolve(__dir, 'app/.kiss-runtime.ts');

export default defineConfig({
  base: '/kiss/',
  plugins: [
    kiss({
      routesDir: 'app/routes',
      islandsDir: 'app/islands',
      componentsDir: 'app/components',
      inject: {
        stylesheets: [
          'https://ka-f.webawesome.com/webawesome@3.5.0/styles/webawesome.css',
        ],
        scripts: [
          'https://ka-f.webawesome.com/webawesome@3.5.0/webawesome.loader.js',
        ],
        headFragments: [
          // DSD polyfill for browsers without native Declarative Shadow DOM support.
          // Must load synchronously before any custom element definitions.
          // Browsers with native DSD (Chrome 90+, Safari 16.4+, Firefox 123+) skip this.
          '<script>if(!HTMLTemplateElement.prototype.hasOwnProperty("shadowRoot"))document.write(\'<script src="https://unpkg.com/@webcomponents/template-shadowroot@0.2.1/template-shadowroot.js"><\\/script>\')</script>',
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@kissjs/core': runtimeShim,
    },
  },
});
