/**
 * context.ts - Request context contracts.
 *
 * Per-request context object that flows through SSR rendering
 * and is accessible to islands and layout components.
 */

import type { RouteEntry } from './framework.ts';

/**
 * Minimal island descriptor used in SSR context.
 */
export interface IslandDescriptor {
  /** Custom element tag name */
  tagName: string;
  /** Import path for the island module */
  importPath: string;
}

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
