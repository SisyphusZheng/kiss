import { kiss } from '../packages/kiss-core/src/index.js';
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
          // DSD polyfill for browsers without native Declarative Shadow DOM support.
          '<script>if(!HTMLTemplateElement.prototype.hasOwnProperty("shadowRoot"))document.write(\'<script src="https://unpkg.com/@webcomponents/template-shadowroot@0.2.1/template-shadowroot.js"><\\/script>\')</script>',
          // Theme system: Pure B&W — Dark / Light
          '<style>:root,[data-theme="dark"]{--kiss-bg-base:#000;--kiss-bg-surface:#0a0a0a;--kiss-bg-elevated:#111;--kiss-bg-hover:#0e0e0e;--kiss-bg-card:#0a0a0a;--kiss-border:#1a1a1a;--kiss-border-hover:#333;--kiss-text-primary:#fff;--kiss-text-secondary:#999;--kiss-text-tertiary:#666;--kiss-text-muted:#444;--kiss-accent:#fff;--kiss-accent-dim:#ccc;--kiss-accent-subtle:rgba(255,255,255,0.05);--kiss-code-bg:#111;--kiss-code-border:#1a1a1a;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#222;color-scheme:dark}[data-theme="light"]{--kiss-bg-base:#fff;--kiss-bg-surface:#fafafa;--kiss-bg-elevated:#f5f5f5;--kiss-bg-hover:#f0f0f0;--kiss-bg-card:#fff;--kiss-border:#e5e5e5;--kiss-border-hover:#ccc;--kiss-text-primary:#000;--kiss-text-secondary:#555;--kiss-text-tertiary:#888;--kiss-text-muted:#aaa;--kiss-accent:#000;--kiss-accent-dim:#333;--kiss-accent-subtle:rgba(0,0,0,0.03);--kiss-code-bg:#f5f5f5;--kiss-code-border:#e5e5e5;--kiss-scrollbar-track:transparent;--kiss-scrollbar-thumb:#ccc;color-scheme:light}body{margin:0;background:var(--kiss-bg-base);color:var(--kiss-text-primary);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}</style>',
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
