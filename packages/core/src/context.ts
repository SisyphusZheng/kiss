/**
 * @openelement/core - Request Context
 * Provides a per-request context object that flows through SSR rendering
 * and is accessible to islands and layout components.
 *
 * Web Standards alignment:
 * - Built on standard Request/URL APIs
 * - Minimal framework overhead - only what's needed for SSR + Islands
 */

import type { RouteEntry } from '@openelement/protocol/framework';
import type { IslandDescriptor, SsrContext } from '@openelement/protocol/context';
export type { IslandDescriptor, SsrContext };
import { createLogger } from './logger.js';
import { formatError } from './errors.js';

const log = createLogger('core');

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
