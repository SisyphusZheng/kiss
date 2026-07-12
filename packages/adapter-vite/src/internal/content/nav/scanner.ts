/**
 * ./index.ts navigation tools - Navigation scanner
 *
 * Scans route files, extracts `meta` exports, and aggregates NavSection[].
 * Build-time only - data stored in ctx.navSections (ADR 0010: no .openElement/ temp files).
 */

import { join, resolve } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import type { HeaderNavLink, NavItem, NavOptions, NavSection, RouteMeta } from '../types.ts';
import { createLogger } from '@openelement/element';
import { scanRoutes } from '../../ssg/index.ts';

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

function isExcludedEntry(filePath: string, exclude: string[]): boolean {
  return exclude.some((pattern) => {
    if (pattern === '_') return filePath.startsWith('_');
    return filePath.includes(pattern);
  });
}

/**
 * Scan route files and aggregate NavSection[].
 *
 * Reuses the SSG route scanner so route discovery, index handling, and dynamic
 * parameter mapping are defined in a single place. Source text captured during
 * scanning is used to extract `meta` exports without a second disk read.
 */
export async function scanNavData(options: NavOptions): Promise<NavSection[]> {
  const routesDir = resolve(options.routesDir ?? 'app/routes');
  const exclude = options.exclude || [];

  // Default excludes: 404. Files starting with _ and dot-files are already
  // skipped by the shared route scanner.
  const defaultExclude = ['404'];
  const allExclude = [...defaultExclude, ...exclude];

  if (!existsSync(routesDir)) {
    log.warn(`Routes directory not found: ${routesDir}`);
    return [];
  }

  // Collect route entries with source text so we can extract meta inline.
  const entries = await scanRoutes(routesDir, '', { includeSource: true });

  // Extract meta from each page route, collecting section info
  const itemsWithSection: Array<{
    path: string;
    label: string;
    order: number;
    section: string;
  }> = [];

  for (const entry of entries) {
    if (entry.type !== 'page') continue;
    if (isExcludedEntry(entry.filePath, allExclude)) continue;

    const source = entry.source;
    if (!source) {
      // Fallback for consumers that call scanRoutes without includeSource.
      try {
        const fullPath = join(routesDir, entry.filePath);
        const fallback = readFileSync(fullPath, 'utf-8');
        const meta = extractMeta(fallback);
        if (meta) {
          itemsWithSection.push({
            path: entry.path,
            label: meta.label,
            order: meta.order ?? 100,
            section: meta.section,
          });
        }
      } catch (e) {
        log.debug(`Failed to read route file ${entry.filePath}: ${e}`);
      }
      continue;
    }

    const meta = extractMeta(source);
    if (meta) {
      itemsWithSection.push({
        path: entry.path,
        label: meta.label,
        order: meta.order ?? 100,
        section: meta.section,
      });
    }
  }

  // Group by section, preserving first-seen order
  const sectionOrder: string[] = [];
  const sectionItems = new Map<string, NavItem[]>();

  for (const item of itemsWithSection) {
    let bucket = sectionItems.get(item.section);
    if (!bucket) {
      bucket = [];
      sectionItems.set(item.section, bucket);
      sectionOrder.push(item.section);
    }
    bucket.push({
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
