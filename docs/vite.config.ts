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
const kissUISrc = resolve(__dir, '../packages/kiss-ui/src');

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
          '<style>:root,[data-theme="dark"]{--bg-base:#000;--bg-surface:#0a0a0a;--bg-elevated:#111;--bg-hover:#0e0e0e;--bg-card:#0a0a0a;--border:#1a1a1a;--border-hover:#333;--text-primary:#fff;--text-secondary:#999;--text-tertiary:#666;--text-muted:#444;--accent:#fff;--accent-dim:#ccc;--accent-subtle:rgba(255,255,255,0.05);--code-bg:#111;--code-border:#1a1a1a;--scrollbar-track:transparent;--scrollbar-thumb:#222;color-scheme:dark}[data-theme="light"]{--bg-base:#fff;--bg-surface:#fafafa;--bg-elevated:#f5f5f5;--bg-hover:#f0f0f0;--bg-card:#fff;--border:#e5e5e5;--border-hover:#ccc;--text-primary:#000;--text-secondary:#555;--text-tertiary:#888;--text-muted:#aaa;--accent:#000;--accent-dim:#333;--accent-subtle:rgba(0,0,0,0.03);--code-bg:#f5f5f5;--code-border:#e5e5e5;--scrollbar-track:transparent;--scrollbar-thumb:#ccc;color-scheme:light}body{margin:0;background:var(--bg-base);color:var(--text-primary);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}</style>',
          // Init theme from localStorage or prefers-color-scheme
          '<script>(function(){var s=localStorage.getItem("kiss-theme");var p=window.matchMedia("(prefers-color-scheme:light)").matches;var t=s||(p?"light":"dark");document.documentElement.setAttribute("data-theme",t)})()</script>',
          // Theme toggle: event delegation via composedPath() to penetrate Shadow DOM
          // Also initializes button state on DOMContentLoaded
          // KISS Architecture: L2 (browser API), not L4 (Lit component hydration)
          '<script>(function(){function syncToggle(btn){var t=document.documentElement.getAttribute("data-theme")||"dark";if(t==="light"){btn.classList.add("is-light")}else{btn.classList.remove("is-light")}btn.setAttribute("title","Switch to "+(t==="dark"?"light":"dark")+" theme")}document.addEventListener("click",function(e){var p=e.composedPath();for(var i=0;i<p.length;i++){if(p[i].classList&&p[i].classList.contains("theme-toggle")){var c=document.documentElement.getAttribute("data-theme")||"dark";var n=c==="dark"?"light":"dark";document.documentElement.setAttribute("data-theme",n);localStorage.setItem("kiss-theme",n);syncToggle(p[i]);break}}});document.addEventListener("DOMContentLoaded",function(){document.querySelectorAll("app-layout").forEach(function(el){var sr=el.shadowRoot;if(sr){var b=sr.querySelector(".theme-toggle");if(b)syncToggle(b)}})})})()</script>',
          // Mobile sidebar: close on backdrop click — L2 (browser API)
          // KISS Architecture: L0 <details> + L1 :has() opens sidebar,
          // L2 backdrop click closes it by removing [open] attribute
          '<script>document.addEventListener("click",function(e){var p=e.composedPath();for(var i=0;i<p.length;i++){if(p[i].classList&&p[i].classList.contains("mobile-backdrop")){document.querySelectorAll("app-layout").forEach(function(el){var sr=el.shadowRoot;if(sr){var d=sr.querySelector("details.mobile-menu");if(d&&d.open)d.removeAttribute("open")}});break}}})</script>',
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@kissjs/core': runtimeShim,
      '@kissjs/ui': kissUISrc,
    },
  },
});
