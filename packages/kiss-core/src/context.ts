/**
 * @kissjs/core - Request Context
 * Provides a per-request context object that flows through SSR rendering
 * and is accessible to islands and layout components.
 *
 * Web Standards alignment:
 * - Built on standard Request/URL APIs
 * - Minimal framework overhead — only what's needed for SSR + Islands
 */

import type { RouteEntry } from './types.js';
import type { IslandDecl } from './entry-descriptor.js';

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
  /** Parsed query/search parameters */
  query: Record<string, string>;
  /** Islands collected during SSR rendering */
  islands: IslandDecl[];
  /** HTTP status code (default: 200) */
  status: number;
  /** Custom data bag — for loaders, middleware, etc. */
  data: Record<string, unknown>;
  /** Request ID for tracing */
  requestId?: string;
}

/**
 * Extract route params from a pathname using a route pattern.
 * e.g., pattern '/posts/:id' + pathname '/posts/123' → { id: '123' }
 */
export function extractParams(
  pattern: string,
  pathname: string,
): Record<string, string> {
  const params: Record<string, string> = {};

  const patternParts = pattern.split('/');
  const pathParts = pathname.split('/');

  for (let i = 0; i < patternParts.length; i++) {
    const part = patternParts[i];
    if (part.startsWith(':')) {
      const paramName = part.slice(1);
      if (i < pathParts.length) {
        try {
          params[paramName] = decodeURIComponent(pathParts[i]);
        } catch {
          params[paramName] = pathParts[i]; // fallback: raw on malformed encoding
        }
      }
    }
  }

  return params;
}

/**
 * Parse URL search params into a plain object.
 * Uses standard URLSearchParams — zero framework magic.
 */
export function parseQuery(url: URL): Record<string, string> {
  const query: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    query[key] = value;
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
