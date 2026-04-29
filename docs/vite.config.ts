import { kiss } from '../packages/kiss-core/src/index.js';
import { kissRootColorCSS } from '../packages/kiss-ui/src/tokens/colors.js';
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

// DRY: All color token values come from a single source of truth.
// kissRootColorCSS is generated from kissDarkColors/kissLightColors in tokens/colors.ts.
// Do NOT hand-write color values here — edit the source objects instead.
const colorTokensStyle = `<style>${kissRootColorCSS}body{margin:0;background:var(--kiss-bg-base);color:var(--kiss-text-primary);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}</style>`;

export default defineConfig({
  base: '/',
  plugins: [
    kiss({
      routesDir: 'app/routes',
      islandsDir: 'app/islands',
      componentsDir: 'app/components',
      html: {
        title: 'KISS',
      },
      // Use packageIslands to consume @kissjs/ui components
      // (kiss-theme-toggle is no longer a local copy — it comes from the package)
      packageIslands: ['@kissjs/ui'],
      // SSR configuration: bundle @kissjs/ui instead of externalizing
      // This fixes "Unsupported decorator location: field" error in SSR
      ssr: {
        noExternal: ['@kissjs/ui'],
      },
      inject: {
        stylesheets: [
          'https://ka-f.webawesome.com/webawesome@3.5.0/styles/webawesome.css',
        ],
        scripts: [
          'https://ka-f.webawesome.com/webawesome@3.5.0/webawesome.loader.js',
        ],
        headFragments: [
          // Favicon
          '<link rel="icon" type="image/svg+xml" href="/favicon.svg" />',
          // DSD (Declarative Shadow DOM) polyfill removed — all modern browsers
          // (Chrome 90+, Safari 16.4+, Firefox 123+) support native DSD.
          // The old document.write() polyfill caused:
          //   1. "parser-blocking, cross-site script" browser warnings
          //   2. "Cannot use import statement outside a module" SyntaxError
          //   3. document.write() is hostile to modern browsers and CSP
          // Theme system: Pure B&W — Dark / Light
          // DRY: CSS values come from @kissjs/ui/tokens/colors.ts (single source of truth)
          colorTokensStyle,
          // Init theme from localStorage or prefers-color-scheme
          '<script src="/theme-init.js"></script>',
          // Mobile sidebar: close on backdrop click
          '<script src="/mobile-sidebar.js"></script>',
          // :has() fallback for older browsers (Safari < 15.4, Firefox < 121)
          '<script src="/has-fallback.js"></script>',
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
