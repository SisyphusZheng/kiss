/**
 * PWA Support — architecture decision for KISS SSG
 */
import { css, html, LitElement } from '@kissjs/core';
import { pageStyles } from '../../components/page-styles.js';
import '@kissjs/ui/kiss-layout';

export class PwaPage extends LitElement {
  static override styles = [
    pageStyles,
    css`
      .adr-meta { font-size: 0.75rem; color: var(--kiss-text-muted); margin-bottom: 1.5rem; }
      h2 { font-size: 1rem; font-weight: 500; margin: 1.5rem 0 0.5rem; color: var(--kiss-text-primary); }
      h3 { font-size: 0.875rem; font-weight: 500; margin: 1rem 0 0.25rem; color: var(--kiss-text-secondary); }
      p { font-size: 0.8125rem; line-height: 1.7; color: var(--kiss-text-secondary); margin: 0 0 0.75rem; }
      .code-block {
        background: var(--kiss-bg-surface);
        border: 1px solid var(--kiss-border);
        border-radius: 4px;
        padding: 1rem;
        font-family: "SF Mono","Fira Code",monospace;
        font-size: 0.75rem;
        line-height: 1.6;
        overflow-x: auto;
        margin: 0.75rem 0 1.25rem;
        color: var(--kiss-text-secondary);
        white-space: pre;
      }
    `,
  ];

  override render() {
    return html`
      <kiss-layout currentPath="/guide/pwa">
        <div class="container">
          <p class="adr-meta">ADR 0003 · 2026-04-30 · Draft</p>
          <h1>PWA Support for KISS SSG</h1>

          <h2>Context</h2>
          <p>
            KISS generates pure static HTML with Declarative Shadow DOM. This is the ideal substrate for a PWA:
            all pages are pre-rendered, assets are versioned hashes, no server state. A service worker can precache
            the entire site at install time.
          </p>

          <h2>Implementation</h2>
          <p>
            Added to <code>build-ssg.ts</code> — after Phase 3, the SSG script generates:
          </p>
          <ul style="font-size:0.8125rem;color:var(--kiss-text-secondary);margin:0.5rem 0 1rem;line-height:1.8">
            <li><code>manifest.json</code> — Web App Manifest with name, theme_color, icons</li>
            <li><code>sw.js</code> — Service Worker with CacheFirst (static) + NetworkFirst (API) strategy</li>
            <li>HTML injection — <code>&lt;link rel="manifest"&gt;</code> + sw registration script</li>
          </ul>

          <h3>API</h3>
          <div class="code-block">// vite.config.ts
export default defineConfig({
  plugins: [kiss({
    pwa: {
      name: 'My KISS App',
      shortName: 'KISS',
      themeColor: '#000000',
      backgroundColor: '#ffffff',
    },
  })],
})</div>

          <h3>Service Worker strategy</h3>
          <div class="code-block">self.addEventListener('install', (e) => {
  e.waitUntil(caches.open('kiss-v1').then(c => c.addAll([
    '/', '/index.html', // precache root
  ])))
  self.skipWaiting();
})
self.addEventListener('fetch', (e) => {
  if (e.request.url.includes('/api/')) {
    e.respondWith(networkFirst(e.request));
  } else {
    e.respondWith(cacheFirst(e.request));
  }
})</div>

          <h2>Current status</h2>
          <p>
            The <code>build-ssg.ts</code> script accepts a <code>pwa</code> option. When provided, it generates
            manifest.json and sw.js in the output directory, and injects manifest links + sw registration into
            every HTML file. The <code>kiss()</code> plugin will expose this option in the next release.
          </p>
          <p>
            Benefit: offline access, instant repeat visits, installable on mobile. Cost: ~100 lines of code.
            No dependency on Workbox — hand-written 30-line sw.js covers CacheFirst + NetworkFirst.
          </p>

          <div class="nav-row" style="margin-top:2rem">
            <a href="/guide/kiss-compiler" class="nav-link">&larr; KISS Compiler</a>
            <a href="/roadmap" class="nav-link">Roadmap &rarr;</a>
          </div>
        </div>
      </kiss-layout>
    `;
  }
}

customElements.define('page-pwa', PwaPage);
export default PwaPage;
export const tagName = 'page-pwa';
