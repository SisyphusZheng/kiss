/**
 * @openelement/core - Request Context
 * Provides a per-request context object that flows through SSR rendering
 * and is accessible to islands and layout components.
 *
 * Web Standards alignment:
 * - Built on standard Request/URL APIs
 * - Minimal framework overhead - only what's needed for SSR + Islands
 */

import type { RouteEntry } from './schemas.js';
import { createLogger } from './logger.js';
import { formatError } from './errors.js';

/**
 * Minimal island descriptor used in SSR context.
 * Full IslandDecl (with import paths, strategy, etc.) lives in @openelement/adapter-vite.
 * This keeps @openelement/core zero-dependency on build orchestration.
 */
export interface IslandDescriptor {
  /** Custom element tag name */
  tagName: string;
  /** Import path for the island module */
  importPath: string;
}

const log = createLogger('core');

/**
 * Resolved SSR context passed through the rendering pipeline.
 * Created fresh for each request, carries params/query/status/islands.
 */
export interface SsrContext {
  /** Matched route entry */
  route: RouteEntry;
  /** The original request URL */
  url: URL;
  /** Route params extracted from dynamic segments (e.g., { id: '123' }) */
  params: Record<string, string>;
  /** Parsed query/search parameters (supports multi-value) */
  query: Record<string, string | string[]>;
  /** Islands collected during SSR rendering */
  islands: IslandDescriptor[];
  /** HTTP status code (default: 200) */
  status: number;
  /** Custom data bag - for loaders, middleware, etc. */
  data: Record<string, unknown>;
  /** Request ID for tracing */
  requestId?: string;
}

/**
 * Extract route params from a pathname using a route pattern.
 * e.g., pattern '/posts/:id' + pathname '/posts/123' -> { id: '123' }
 *
 * Uses WHATWG URLPattern API - available in:
 *   ✅ Deno 1.33+ (native, no flags)
 *   ✅ Node.js 19+ (--experimental-url-pattern)
 *   ✅ Bun (native)
 *   ✅ All modern browsers
 */
export function extractParams(
  pattern: string,
  pathname: string,
): Record<string, string> {
  try {
    const urlPattern = new URLPattern({ pathname: pattern });
    const match = urlPattern.exec({
      pathname,
      protocol: 'https',
      hostname: 'localhost',
    });
    return (match?.pathname?.groups ?? {}) as Record<string, string>;
  } catch (err) {
    log.error(
      `URLPattern failed for pattern "${pattern}" on pathname "${pathname}": ${formatError(err)}`,
    );
    return {};
  }
}

/**
 * Parse URL search params into a plain object.
 * Uses standard URLSearchParams - zero framework magic.
 * Supports multi-value keys (e.g., ?tag=a&tag=b -> { tag: ['a', 'b'] }).
 */
export function parseQuery(url: URL): Record<string, string | string[]> {
  const query: Record<string, string | string[]> = {};
  // v0.14.3: Simplified - use `key in query` instead of separate `seen` Set
  url.searchParams.forEach((value, key) => {
    if (key in query) {
      const existing = query[key];
      // M-02 fix: Use Array.isArray check instead of fragile type assertion
      query[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
    } else {
      query[key] = value;
    }
  });
  return query;
}

/**
 * Create a fresh SsrContext for a request.
 * This is the single source of truth for per-request state.
 */
export function createSsrContext(
  route: RouteEntry,
  url: URL,
  options: {
    requestId?: string;
  } = {},
): SsrContext {
  return {
    route,
    url,
    params: extractParams(route.path, url.pathname),
    query: parseQuery(url),
    islands: [],
    status: 200,
    data: {},
    requestId: options.requestId,
  };
}
