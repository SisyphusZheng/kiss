/**
 * @openelement/content navigation tools - Navigation scanner
 *
 * Scans route files, extracts `meta` exports, and aggregates NavSection[].
 * Build-time only - data stored in ctx.navSections (ADR 0010: no .openElement/ temp files).
 */

import { join, resolve } from 'node:path';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import type { HeaderNavLink, NavItem, NavOptions, NavSection, RouteMeta } from '../types.ts';
import { createLogger } from '@openelement/core/logger';

/** Aggregated navigation data ready for module generation */
export interface NavData {
  /** Header navigation links (manually configured) */
  headerNav: HeaderNavLink[];
  /** Navigation sections with items */
  navSections: NavSection[];
}

const log = createLogger('content:nav');

/**
 * Extract `export const meta = { ... }` from source text using regex.
 * Only string values for section/label and numeric order are supported.
 */
export function extractMeta(source: string): RouteMeta | null {
  const match = source.match(/export\s+const\s+meta\s*=\s*\{([\s\S]*?)\}/);
  if (!match) return null;

  const body = match[1];
  const result: Record<string, unknown> = {};
  const propRe = /(section|label|order)\s*:\s*(["']([^"']*)["']|(\d+))/g;
  let m: RegExpExecArray | null;

  while ((m = propRe.exec(body)) !== null) {
    const key = m[1];
    const value = m[2];
    if (key === 'order') {
      result[key] = Number(value);
    } else {
      result[key] = value.slice(1, -1);
    }
  }

  return toRouteMeta(result);
}

function toRouteMeta(value: Record<string, unknown>): RouteMeta | null {
  if (typeof value.section !== 'string') return null;
  if (typeof value.label !== 'string') return null;
  if (value.order !== undefined && typeof value.order !== 'number') return null;
  return {
    section: value.section,
    label: value.label,
    ...(value.order !== undefined ? { order: value.order } : {}),
  };
}

/**
 * Convert a relative file path to a URL route path.
 * e.g. 'guide/getting-started.ts' -> '/guide/getting-started'
 *      'index/index.ts' -> '/'
 *      'blog/[slug].ts' -> '/blog/:slug'
 */
function filePathToNavPath(filePath: string): string {
  let p = filePath.replace(/\\/g, '/'); // normalize separators
  p = p.replace(/\.[^.]+$/, ''); // remove extension
  p = p.replace(/\[([^\]]+)\]/g, ':$1'); // [slug] -> :slug

  // Handle index
  if (p === 'index') return '/';
  if (p.endsWith('/index')) p = p.slice(0, -6);

  // Ensure leading slash
  if (!p.startsWith('/')) p = '/' + p;

  return p;
}

/**
 * Recursively scan a directory for route files with meta exports.
 */
export function scanNavData(options: NavOptions): NavSection[] {
  const routesDir = resolve(options.routesDir ?? 'app/routes');
  const exclude = options.exclude || [];

  // Default excludes: _renderer, _middleware, 404, dot-files
  const defaultExclude = ['_', '404'];
  const allExclude = [...defaultExclude, ...exclude];

  if (!existsSync(routesDir)) {
    log.warn(`Routes directory not found: ${routesDir}`);
    return [];
  }

  // Collect all route files
  const routeFiles = collectRouteFiles(routesDir, '', allExclude);

  // Extract meta from each file, collecting section info
  const itemsWithSection: Array<{
    path: string;
    label: string;
    order: number;
    section: string;
  }> = [];
  for (const file of routeFiles) {
    const fullPath = join(routesDir, file);
    try {
      const source = readFileSync(fullPath, 'utf-8');
      const meta = extractMeta(source);
      if (meta) {
        itemsWithSection.push({
          path: filePathToNavPath(file),
          label: meta.label,
          order: meta.order ?? 100,
          section: meta.section,
        });
      }
    } catch (e) {
      log.debug(`Failed to read route file ${file}: ${e}`);
    }
  }

  // Group by section, preserving first-seen order
  const sectionOrder: string[] = [];
  const sectionItems = new Map<string, NavItem[]>();

  for (const item of itemsWithSection) {
    if (!sectionItems.has(item.section)) {
      sectionOrder.push(item.section);
      sectionItems.set(item.section, []);
    }
    sectionItems.get(item.section)!.push({
      path: item.path,
      label: item.label,
      order: item.order,
    });
  }

  // Build NavSection[] - sort items within each section by order
  const sections: NavSection[] = sectionOrder.map((section) => ({
    section,
    items: (sectionItems.get(section) || []).sort(
      (a, b) => (a.order ?? 100) - (b.order ?? 100),
    ),
  }));

  log.info(
    `Nav: ${sections.length} section(s), ${itemsWithSection.length} item(s) from ${routesDir}`,
  );
  return sections;
}

/**
 * Recursively collect route file paths relative to routesDir.
 * Skips files starting with _ and files matching exclude patterns.
 */
function collectRouteFiles(
  dir: string,
  baseDir: string,
  exclude: string[],
): string[] {
  const files: string[] = [];
  let entries: string[];

  try {
    entries = readdirSync(dir);
  } catch {
    return files;
  }

  for (const entry of entries) {
    if (entry.startsWith('.')) continue;

    const fullPath = join(dir, entry);
    const relativePath = baseDir ? `${baseDir}/${entry}` : entry;

    // Skip excluded patterns
    if (
      exclude.some((pattern) => {
        if (pattern === '_') return entry.startsWith('_');
        return relativePath.includes(pattern);
      })
    ) {
      continue;
    }

    try {
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        files.push(...collectRouteFiles(fullPath, relativePath, exclude));
      } else if (/\.(ts|tsx|js|jsx)$/.test(entry)) {
        files.push(relativePath);
      }
    } catch {
      continue;
    }
  }

  return files.sort();
}
