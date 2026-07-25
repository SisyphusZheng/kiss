/**
 * ./index.ts - SSG helper utilities
 *
 * Pure utility functions used by the SSG render pipeline.
 * This module sits at the bottom of the dependency graph.
 */

import type { IsrManifestEntry } from '../protocol/framework.ts';
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
  routeInfo: Array<{
    path: string;
    isDynamic: boolean;
    revalidate?: number | false;
    params?: Record<string, string>;
  }>,
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
