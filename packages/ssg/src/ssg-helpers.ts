/**
 * @openelement/ssg - SSG helper utilities
 *
 * Pure utility functions used by the SSG render pipeline.
 * This module sits at the bottom of the dependency graph.
 */

import { join } from 'node:path';
import { readdirSync } from 'node:fs';
import type { HydrationHint, RenderError } from '@openelement/core';
import type { IsrManifestEntry } from '@openelement/core';
import { createIsrCacheKey } from '@openelement/core/isr';

// ─── Path / URL helpers ────────────────────────────────────────

/** Recursively find all .html files under a directory. */
export function findHtmlFiles(dir: string): string[] {
  const results: string[] = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...findHtmlFiles(fullPath));
      } else if (entry.name.endsWith('.html')) {
        results.push(fullPath);
      }
    }
  } catch {
    // Directory may not exist yet
  }
  return results;
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
      /[\\/]/.test(value)
    ) {
      throw new Error(
        `Unsafe value for route parameter "${name}" in ${routePath}: ${value}`,
      );
    }

    // Encode spaces and other URL-unsafe chars, but preserve @ for scoped packages.
    // Full encodeURIComponent would encode @ -> %40, breaking file-to-URL matching.
    const safeValue = value.replace(/ /g, '%20');
    resolvedPath = resolvedPath.replace(`:${name}`, safeValue);
  }
  return resolvedPath;
}

// ─── Hash helpers ──────────────────────────────────────────────

/**
 * FNV-1a 64-bit hash for stable SSG-generated asset names.
 */
export function stableHash(str: string): string {
  const fnvOffsetBasis = 14695981039346656037n;
  const fnvPrime = 1099511628211n;
  const mask64 = (1n << 64n) - 1n;

  let hash = fnvOffsetBasis;
  for (let i = 0; i < str.length; i++) {
    hash ^= BigInt(str.charCodeAt(i));
    hash = (hash * fnvPrime) & mask64;
  }
  return hash.toString(36);
}

// ─── ISR manifest builder ──────────────────────────────────────

export function buildIsrManifestEntries(
  routeInfo: Array<{
    path: string;
    isDynamic: boolean;
    revalidate?: number;
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

// ─── Per-page diagnostic collector ─────────────────────────────

/** Page-level render diagnostic entry used during SSG render. */
export interface PageDiagnostic {
  path: string;
  errors: RenderError[];
  hydrationHints: HydrationHint[];
  componentCount: number;
  renderTimeMs: number;
}

/**
 * Collect per-page render diagnostics (backward-compat with string output).
 * Returns the rendered HTML string.
 */
export function collectPageOutput(
  routePath: string,
  output: {
    html: string;
    errors: RenderError[];
    hydrationHints: HydrationHint[];
    componentCount: number;
    renderTimeMs: number;
  } | string,
  pageDiagnostics: PageDiagnostic[],
): string {
  const html = typeof output === 'string' ? output : output.html;
  if (typeof output !== 'string') {
    pageDiagnostics.push({
      path: routePath,
      errors: output.errors,
      hydrationHints: output.hydrationHints,
      componentCount: output.componentCount,
      renderTimeMs: output.renderTimeMs,
    });
  }
  return html;
}
