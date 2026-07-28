/**
 * ./index.ts - SSG helper utilities
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
export interface RequestTimeRoutePattern {
  path: string;
  paramNames: string[];
}

function escapeRegExpLiteral(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Convert a route path pattern ('/item/:id', '/docs/:path{.+}') into a RegExp
 * source string that captures params in `paramNames` order. Used to generate
 * the self-contained matcher inside dist/server/index.js (#556): hosts get a
 * dispatch function instead of re-implementing pattern matching against the
 * raw ':param' strings in server-manifest.json.
 */
export function routePatternToRegExpSource(path: string): string {
  let source = '';
  for (const segment of path.split('/')) {
    if (segment === '') continue;
    source += '/';
    if (segment.startsWith(':')) {
      const brace = segment.indexOf('{');
      if (brace !== -1 && segment.endsWith('}')) {
        // Named regex parameter (:path{.+} from a [...path] catch-all).
        source += `(${segment.slice(brace + 1, -1)})`;
      } else {
        source += '([^/]+)';
      }
    } else {
      source += escapeRegExpLiteral(segment);
    }
  }
  return `^${source}$`;
}

/** Serialize the request-time route table embedded in the generated server entry. */
export function renderRequestTimeRouteTable(routes: RequestTimeRoutePattern[]): string {
  // Exact paths first, then parameterized, then catch-alls: the first match
  // wins, so the most specific pattern must be consulted first.
  const rank = (path: string): number => path.includes('{.+}') ? 2 : path.includes(':') ? 1 : 0;
  const sorted = [...routes].sort((a, b) => rank(a.path) - rank(b.path));
  return sorted
    .map((route) => {
      const params = route.paramNames.map((name) => JSON.stringify(name)).join(', ');
      // '/' must be escaped or it would terminate the regex literal.
      const pattern = routePatternToRegExpSource(route.path).replace(/\//g, '\\/');
      return `  { path: ${JSON.stringify(route.path)}, paramNames: [${params}], ` +
        `pattern: /${pattern}/ },`;
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
 * server-manifest.json or re-implementing pattern matching.
 */
export function renderRequestTimeServerModule(routes: RequestTimeRoutePattern[] = []): string {
  return `// Generated by openElement build — request-time server entry (0.42.0-alpha.1).
// Serves renderIntent: { mode: 'dynamic' } routes at request time through the
// same SSR bundle used for prerendering. Do not edit; regenerated per build.
import { createOpenElementNitroHandler } from '@openelement/adapter-vite/nitro-mount';
import app from './entry.js';
import { clientScriptSrc } from './client-script.js';

const openElementHandler = createOpenElementNitroHandler({
  handler: (request, context) =>
    app.fetch(request, context?.env || {}, context?.platform),
});

// Request-time route table (#556): pathname -> { path, params }. Exact paths
// first, then parameterized, then catch-alls; the first match wins.
const requestTimeRoutes = [
${renderRequestTimeRouteTable(routes)}
];

export function matchRequestTimeRoute(pathname) {
  for (let i = 0; i < requestTimeRoutes.length; i++) {
    const route = requestTimeRoutes[i];
    const match = route.pattern.exec(pathname);
    if (!match) continue;
    const params = {};
    for (let p = 0; p < route.paramNames.length; p++) {
      params[route.paramNames[p]] = decodeURIComponent(match[p + 1]);
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
  const result = await openElementHandler(event ?? {});
  return withClientScript(result.response);
}
`;
}
