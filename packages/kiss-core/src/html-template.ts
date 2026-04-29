/**
 * @kissjs/core - Route metadata extraction utilities
 *
 * Formerly the html-template Vite plugin (which was a no-op).
 * The plugin registration has been removed (minimal augmentation:
 * don't register plugins that do nothing).
 *
 * extractRouteMeta() remains as a utility for future SSG metadata extraction.
 */

import type { RouteMeta } from './types.js';

/**
 * Extract route metadata from a module's exports.
 * Looks for `meta` export or individual `title`/`description` exports.
 *
 * Used by SSG pipeline (build-ssg.ts → hono-entry.ts) to build docConfig.
 */
export function extractRouteMeta(module: Record<string, unknown>): RouteMeta {
  const meta: RouteMeta = {};

  // Check for a `meta` export object
  const modMeta = module.meta;
  if (modMeta && typeof modMeta === 'object' && modMeta !== null) {
    const m = modMeta as Record<string, unknown>;
    if (m.title) meta.title = String(m.title);
    if (m.description) meta.description = String(m.description);
  }

  // Individual exports take precedence
  if (module.title && typeof module.title === 'string') {
    meta.title = module.title;
  }
  if (module.description && typeof module.description === 'string') {
    meta.description = module.description;
  }

  return meta;
}
