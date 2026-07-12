/**
 * openElement dev:fast — zero-bundler development server.
 *
 * Uses Deno.serve + Hono to serve pre-built SSR output directly.
 * No Vite, no virtual modules. Cold start target < 1s.
 *
 * Architecture:
 *   Deno.serve (port 3000)
 *     ├── Hono app
 *     ├── /__health — health check
 *     ├── Static middleware — serve dist/client/* directly
 *     ├── SSR middleware — import dist/server/entry.js and call renderRoute()
 *     └── SPA fallback — serve dist/index.html for unrecognized paths
 *
 * Pre-requisite: `deno task build` must have been run to generate dist/.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStaticAssets } from './middleware/dev-static.ts';

const PORT = 3000;

// Compute paths relative to the project root (www/).
// The dev:fast task runs from www/ with `--config ../deno.json`,
// so cwd is www/ and ./dist resolves correctly.
const PROJECT_ROOT = Deno.cwd();
const DIST_ROOT = `${PROJECT_ROOT}/dist`;
const SSR_ENTRY_PATH = `${DIST_ROOT}/server/entry.js`;

const app = new Hono();

// ── CORS (local development only) ───────────────────────────
app.use(
  '*',
  cors({
    origin: (origin) => {
      if (!origin) return null;
      const host = new URL(origin).hostname;
      return host === 'localhost' || host === '127.0.0.1' || host === '::1' ? origin : null;
    },
  }),
);

// ── Health check ────────────────────────────────────────────
app.get('/__health', (c) => c.json({ ok: true, mode: 'dev:fast', port: PORT }));

// ── Static assets (must come before SSR catch-all) ──────────
app.use('*', serveStaticAssets(`${DIST_ROOT}/client/`));

// ── SSR catch-all ───────────────────────────────────────────
app.get('*', async (c) => {
  try {
    // Import the pre-built SSR bundle (produced by `deno task build`)
    // Uses cache-busting query param so changes are picked up between builds.
    // Must use file:// protocol for cross-platform path compatibility.
    const cacheBuster = Date.now();
    const entryUrl = `file:///${SSR_ENTRY_PATH.replace(/\\/g, '/')}?t=${cacheBuster}`;
    const mod = await import(entryUrl);

    if (typeof mod.renderRoute === 'function') {
      const url = new URL(c.req.url);
      const result = await mod.renderRoute(url.pathname, {
        lang: url.pathname.startsWith('/zh') ? 'zh' : 'en',
      });
      return c.html(result.html);
    }

    // Fallback: no renderRoute export — serve index.html
    const indexPath = `${DIST_ROOT}/index.html`;
    try {
      const indexHtml = await Deno.readTextFile(indexPath);
      return c.html(indexHtml);
    } catch {
      return c.html(
        '<!DOCTYPE html><html><body><h1>openElement dev:fast</h1><p>No build output found. Run <code>deno task build</code> first.</p></body></html>',
        503,
      );
    }
  } catch (err) {
    console.error('[dev:fast] SSR error:', err);
    const message = String(err instanceof Error ? err.stack || err.message : err)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
    return c.html(
      `<!DOCTYPE html><html><body><h1>Dev Server Error</h1><pre>${message}</pre></body></html>`,
      500,
    );
  }
});

// ── Start ───────────────────────────────────────────────────
Deno.serve({ port: PORT }, app.fetch);
console.info(`[dev:fast] Server running at http://localhost:${PORT}`);
console.info(`[dev:fast] Serving static files from ${DIST_ROOT}/client/`);
console.info(`[dev:fast] SSR bundle: ${SSR_ENTRY_PATH}`);
