/**
 * ssg-helpers.ts - SSG helper utilities
 *
 * Pure utility functions used by the SSG render pipeline.
 * This module sits at the bottom of the dependency graph.
 */

import type { IsrManifestEntry } from '../protocol/framework.ts';
import type { RouteInfoEntry } from '../protocol/ssg.ts';
import { createIsrCacheKey } from '@openelement/element/build-utils';
import { walkHtmlFileEntries } from '../html-files.ts';

// ─── Path / URL helpers ────────────────────────────────────────

/** Recursively find all .html files under a directory. */
export function findHtmlFiles(dir: string): string[] {
  return walkHtmlFileEntries(dir).map((entry) => entry.absolutePath);
}

// ─── Route helpers ─────────────────────────────────────────────

/**
 * Resolve a dynamic route path by substituting param values.
 * Validates param values to prevent path traversal and control characters.
 */
export function resolveDynamicRoutePath(
  routePath: string,
  paramNames: string[],
  params: Record<string, string>,
): string {
  let resolvedPath = routePath;
  for (const name of paramNames) {
    const raw = params[name];
    if (raw === undefined || raw === null || raw === '') {
      throw new Error(
        `Missing value for route parameter "${name}" in ${routePath}`,
      );
    }

    const value = String(raw);
    if (
      value === '.' ||
      value === '..' ||
      /[\\/\0]/.test(value)
    ) {
      throw new Error(
        `Unsafe value for route parameter "${name}" in ${routePath}: ${value}`,
      );
    }

    // Encode spaces and URL-unsafe chars, but preserve @ for scoped packages.
    // Full encodeURIComponent would encode @ -> %40, breaking file-to-URL matching.
    // `%` is encoded first so an already-encoded sequence is not double-encoded.
    const safeValue = value
      .replace(/%/g, '%25')
      .replace(/#/g, '%23')
      .replace(/\?/g, '%3F')
      .replace(/&/g, '%26')
      .replace(/ /g, '%20');
    resolvedPath = resolvedPath.replace(`:${name}`, safeValue);
  }
  return resolvedPath;
}

// ─── Hash helpers ──────────────────────────────────────────────

/**
 * Stable SHA-256 hash for SSG-generated asset names.
 * Returns a deterministic lowercase hex string.
 */
export async function stableHash(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(str));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ─── ISR manifest builder ──────────────────────────────────────

export function buildIsrManifestEntries(
  routeInfo: RouteInfoEntry[],
  staticPathParamsByRoute: Map<string, Array<Record<string, string>>>,
): IsrManifestEntry[] {
  const entries: IsrManifestEntry[] = [];
  for (const route of routeInfo) {
    const revalidate = typeof route.revalidate === 'number' && route.revalidate > 0
      ? route.revalidate
      : undefined;
    if (!revalidate) continue;

    const paramsList = route.isDynamic
      ? staticPathParamsByRoute.get(route.path) ?? []
      : [route.params ?? {}];

    for (const params of paramsList) {
      entries.push({
        path: route.path,
        revalidate,
        cacheKey: createIsrCacheKey(route.path, params),
        params,
      });
    }
  }
  return entries;
}

// ─── Request-time server entry module (0.42.0-alpha.1, ADR-0120) ──────────

/** One request-time route as recorded in server-manifest.json. */
interface RequestTimeRoutePattern {
  path: string;
  paramNames: string[];
}

/**
 * Translate a request-time route pattern ('/item/:id', '/docs/:path{.+}')
 * into a WHATWG URLPattern pathname (#856, ADR-0123). The framework dialect
 * is already URLPattern-shaped except for the Hono-style `:name{regex}`
 * catch-all emitted by the route scanner (#812), which rewrites to the
 * URLPattern `:name(regex)` form. Used to generate the self-contained
 * matcher inside dist/server/index.js (#556): hosts get a dispatch function
 * instead of re-implementing pattern matching against the raw ':param'
 * strings in server-manifest.json.
 */
export function routePatternToURLPatternPath(path: string): string {
  return path
    .split('/')
    .map((segment) => {
      const brace = segment.startsWith(':') ? segment.indexOf('{') : -1;
      if (brace === -1 || !segment.endsWith('}')) return segment;
      return `${segment.slice(0, brace)}(${segment.slice(brace + 1, -1)})`;
    })
    .join('/');
}

/** Serialize the request-time route table embedded in the generated server entry. */
function renderRequestTimeRouteTable(routes: RequestTimeRoutePattern[]): string {
  // Exact paths first, then parameterized, then catch-alls: the first match
  // wins, so the most specific pattern must be consulted first.
  const rank = (path: string): number => path.includes('{.+}') ? 2 : path.includes(':') ? 1 : 0;
  const sorted = [...routes].sort((a, b) => rank(a.path) - rank(b.path));
  return sorted
    .map((route) => {
      const params = route.paramNames.map((name) => JSON.stringify(name)).join(', ');
      const pattern = JSON.stringify(routePatternToURLPatternPath(route.path));
      return `  { path: ${JSON.stringify(route.path)}, paramNames: [${params}], ` +
        `pattern: new URLPattern({ pathname: ${pattern} }) },`;
    })
    .join('\n');
}

/**
 * Source of the generated `dist/server/index.js`. Emitted only when at
 * least one route declares `renderIntent: { mode: 'dynamic' }`, so
 * pure-static output trees stay byte-identical. The module mounts the
 * prerendering SSR bundle (the same Hono app, with loaders/actions) on the
 * public `nitro-mount` seam; Nitro Node/Workers builds bundle it as the
 * server entry, and plain Node can run it directly with adapter-vite
 * installed.
 *
 * The named `matchRequestTimeRoute` export (#556) is a self-contained
 * pathname matcher generated from the route table, so hosts dispatch
 * '/item/1' to the '/item/:id' request-time route without reading
 * server-manifest.json or re-implementing pattern matching. Matching
 * semantics are the WHATWG URLPattern standard (#856, ADR-0123), same as
 * the SPA client router and the element context's extractParams.
 */
export function renderRequestTimeServerModule(routes: RequestTimeRoutePattern[] = []): string {
  return `// Generated by openElement build — request-time server entry (0.42.0-alpha.1).
// Serves renderIntent: { mode: 'dynamic' } routes at request time through the
// same SSR bundle used for prerendering. Do not edit; regenerated per build.
import { createOpenElementNitroHandler } from '@openelement/adapter-vite/nitro-mount';
import { openElementHandler } from './entry.js';
import { clientScriptSrc } from './client-script.js';

// ADR-0123 item 2 (#858): the entry's openElementHandler export already
// carries the composed middleware.use fetch middleware chain when configured,
// so the start CLI, the e2e fixture server, and Nitro run the same middleware
// semantics as the dev server.
const nitroHandler = createOpenElementNitroHandler({
  handler: openElementHandler,
});

// Request-time route table (#556): pathname -> { path, params }. Exact paths
// first, then parameterized, then catch-alls; the first match wins. Matching
// semantics are WHATWG URLPattern (#856, ADR-0123).
const requestTimeRoutes = [
${renderRequestTimeRouteTable(routes)}
];

export function matchRequestTimeRoute(pathname) {
  for (let i = 0; i < requestTimeRoutes.length; i++) {
    const route = requestTimeRoutes[i];
    const match = route.pattern.exec({ protocol: 'https', hostname: 'localhost', pathname });
    if (!match) continue;
    const params = {};
    for (let p = 0; p < route.paramNames.length; p++) {
      // URLPattern groups are raw percent-encoded text; decodeURIComponent
      // intentionally throws URIError on malformed escapes (#823).
      params[route.paramNames[p]] = decodeURIComponent(match.pathname.groups[route.paramNames[p]]);
    }
    return { path: route.path, params };
  }
  return null;
}

// Island hydration parity with static pages: the static pipeline injects the
// island client entry into prerendered HTML as a post-build step, which
// request-time rendering bypasses. Inject the same script at serve time.
function withClientScript(response) {
  if (!clientScriptSrc) return response;
  const type = response.headers.get('content-type') || '';
  if (!type.includes('text/html')) return Promise.resolve(response);
  return response.text().then((html) => {
    if (html.includes(clientScriptSrc)) {
      return new Response(html, { status: response.status, headers: response.headers });
    }
    const tag = '<script type="module" src="' + clientScriptSrc + '"></script>';
    const out = html.includes('</body>')
      ? html.replace('</body>', '  ' + tag + '\\n</body>')
      : html + tag;
    return new Response(out, { status: response.status, headers: response.headers });
  });
}

export default async function openElementRequestTimeServer(event) {
  const response = await nitroHandler(event);
  return withClientScript(response);
}
`;
}

/**
 * Source of the generated `dist/server/serve.mjs` (#959): a standalone
 * production server entry, so the build output runs without the CLI and
 * without a hand-written Nitro bootstrap. Emitted alongside index.js, i.e.
 * only when request-time routes exist — pure-static projects have no
 * dist/server at all (#953) and are served by any static host.
 *
 * Self-contained by contract: dist/ is a portable artifact, so the module
 * imports only node: builtins plus ./index.js (which itself resolves
 * @openelement/adapter-vite/nitro-mount from the project's dependencies).
 * Cross-runtime (#622): node:http/node:fs run on Node 18+, Deno and Bun.
 *
 * Request semantics intentionally mirror cli/start.ts: request-time route
 * match (or any mutating method) dispatches to the server entry, otherwise
 * static files win, with the server entry as the final fallback.
 */
export function renderStandaloneServerModule(): string {
  // Regexes use [x] character classes instead of \\x escapes so this
  // template literal needs no backslash escaping.
  return `// Generated by openElement build — standalone production server (#959).
// Serves the static dist/ tree and dispatches request-time (dynamic)
// loader/action routes to the generated server entry (./index.js).
// Do not edit; regenerated per build.
//
// Usage:
//   node dist/server/serve.mjs
//   OPEN_ELEMENT_PORT=8080 OPEN_ELEMENT_HOST=127.0.0.1 node dist/server/serve.mjs
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import openElementServer, { matchRequestTimeRoute } from './index.js';

const distDir = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const rawPort = process.env.OPEN_ELEMENT_PORT || process.env.PORT || '4173';
const port = Number(rawPort);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error(
    'Invalid port "' + rawPort + '": expected an integer between 1 and 65535 ' +
      '(OPEN_ELEMENT_PORT / PORT).',
  );
  process.exit(1);
}
const hostname = process.env.OPEN_ELEMENT_HOST || '0.0.0.0';

// Keep this table in parity with internal/static-serve.ts (pinned by
// __tests__/ssg-helpers.test.ts) — serve.mjs is self-contained, so it
// cannot import the shared table, but the values must match.
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml; charset=utf-8',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

function tryStatic(pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname.split('?')[0] || '/');
  } catch {
    return new Response('Bad Request', { status: 400 });
  }
  const rel = decoded === '/' ? 'index.html' : decoded.replace(/^[/]+/, '');
  const trimmed = rel.replace(/[/]+$/, '');
  const candidates = [rel, trimmed + '/index.html'];
  if (!rel.endsWith('/') && !rel.endsWith('.html')) candidates.push(rel + '.html');
  const root = resolve(distDir);
  for (const candidate of new Set(candidates)) {
    const filePath = resolve(join(root, candidate));
    if (!filePath.startsWith(root + sep)) continue;
    if (!existsSync(filePath) || !statSync(filePath).isFile()) continue;
    return new Response(readFileSync(filePath), {
      status: 200,
      headers: {
        'content-type': MIME[extname(filePath).toLowerCase()] || 'application/octet-stream',
      },
    });
  }
  return null;
}

async function callServer(request) {
  try {
    return await openElementServer({ req: request });
  } catch (err) {
    console.error('[openElement serve] request-time handler error:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
}

async function handleRequest(request) {
  const url = new URL(request.url);
  let match = null;
  try {
    match = typeof matchRequestTimeRoute === 'function'
      ? matchRequestTimeRoute(url.pathname)
      : null;
  } catch (err) {
    // Malformed percent-encoding is a client error, not a crash (#823).
    if (err instanceof URIError) return new Response('Bad Request', { status: 400 });
    throw err;
  }
  const isMutating = request.method !== 'GET' && request.method !== 'HEAD';
  if (match || isMutating) return callServer(request);
  const staticResponse = tryStatic(url.pathname);
  if (staticResponse) return staticResponse;
  return callServer(request);
}

const server = createServer((req, res) => {
  const host = hostname === '0.0.0.0' ? 'localhost' : hostname;
  const url = new URL(req.url || '/', 'http://' + host + ':' + port);
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) headers.set(key, Array.isArray(value) ? value.join(', ') : value);
  }
  const method = req.method || 'GET';
  const hasBody = method !== 'GET' && method !== 'HEAD';
  const request = new Request(url.href, {
    method,
    headers,
    body: hasBody
      ? new ReadableStream({
        start(controller) {
          req.on('data', (chunk) => controller.enqueue(new Uint8Array(chunk)));
          req.on('end', () => controller.close());
          req.on('error', (err) => controller.error(err));
        },
      })
      : undefined,
    // Node 18 requires this for a non-GET body; ignored elsewhere.
    duplex: hasBody ? 'half' : undefined,
  });
  handleRequest(request).then((response) => {
    res.statusCode = response.status;
    response.headers.forEach((value, key) => res.setHeader(key, value));
    if (!response.body) {
      res.end();
      return;
    }
    const reader = response.body.getReader();
    const pump = () =>
      reader.read().then(({ done, value }) => {
        if (done) {
          res.end();
          return;
        }
        res.write(value);
        return pump();
      });
    pump().catch(() => res.end());
  }).catch((err) => {
    console.error('[openElement serve] fatal handler error:', err);
    res.statusCode = 500;
    res.end('Internal Server Error');
  });
});

server.listen(port, hostname, () => {
  const shown = hostname === '0.0.0.0' ? 'localhost' : hostname;
  console.log('[openElement serve] http://' + shown + ':' + port);
});
`;
}
