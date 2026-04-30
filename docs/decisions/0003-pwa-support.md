# PWA Support for KISS SSG

## Status

**DRAFT** — Proposed for v0.4.

## Context

KISS generates pure static HTML with Declarative Shadow DOM. This is the ideal substrate for a Progressive Web App:

- All pages are pre-rendered HTML (no server needed)
- Assets are versioned hashes (perfect cache keys)
- No sessions, no auth, no server state
- Service worker can precache the entire site at install time

## Proposal

Add a `pwa` option to the `kiss()` plugin that automatically generates:

1. `manifest.json` — Web App Manifest (name, icons, display, theme_color)
2. `sw.js` — Service Worker with CacheFirst strategy
3. HTML `<head>` injection — `<link rel="manifest">`, `<meta name="theme-color">`, `<link rel="service-worker">`

### API

```ts
// vite.config.ts
export default defineConfig({
  plugins: [kiss({
    pwa: {
      name: 'My KISS App',
      shortName: 'KISS',
      themeColor: '#000000',
      backgroundColor: '#ffffff',
      icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
      // Default: CacheFirst for all static assets, NetworkFirst for API routes
      sw: { strategy: 'cache-first' },
    },
  })],
})
```

### Service Worker Strategy

```js
// Generated sw.js (~30 lines)
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open('kiss-v1').then(c => c.addAll([
    '/', '/index.html', '/assets/*.js', '/assets/*.css',
    // Dynamic island chunks are loaded on demand — cache on fetch
  ])))
})
self.addEventListener('fetch', (e) => {
  if (e.request.url.includes('/api/')) {
    // NetworkFirst for API calls
    e.respondWith(networkFirst(e.request))
  } else {
    // CacheFirst for static assets
    e.respondWith(cacheFirst(e.request))
  }
})
```

### SSG Integration

In `build-ssg.ts`, after Phase 3:

```ts
if (options.pwa) {
  writeFileSync(join(outputDir, 'manifest.json'), generateManifest(options.pwa))
  writeFileSync(join(outputDir, 'sw.js'), generateSwScript(options.pwa))
  // inject manifest link + sw registration into all HTML files
  injectIntoHtml(outputDir, {
    head: `<link rel="manifest" href="/manifest.json">`,
    body: `<script>navigator.serviceWorker?.register('/sw.js')</script>`,
  })
}
```

## Consequences

- **Positive**: Offline access, instant repeat visits, installable on mobile
- **Positive**: Minimal code (~100 lines total across plugin + generator + sw script)
- **Neutral**: Service worker scope limited to site root (no cross-site impact)
- **Negative**: Cache invalidation needs version bumping in sw.js (solved by hash in sw name)
