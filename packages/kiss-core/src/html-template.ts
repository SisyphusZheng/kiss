/**
 * @kissjs/core - HTML Template Plugin
 * Implements the `transformIndexHtml` Vite hook.
 *
 * Current status: minimal shell. The meta tag / preload hint injection
 * was designed around a __kissRouteMeta context property that is never
 * set by any code path. SSG uses wrapInDocument() directly (bypassing
 * Vite's HTML transform), and dev mode doesn't propagate route metadata
 * to this hook either.
 *
 * This plugin is kept as a registration point for future dev-server
 * route awareness (e.g., per-route title/description/preload injection).
 * When that feature is implemented, add the injection logic here.
 *
 * KISS Architecture: Uses Hono ContextVariableMap for type extension
 * instead of declare module 'vite' augmentation.
 */

import type { HtmlTagDescriptor, Plugin } from 'vite';
import type { FrameworkOptions } from './types.js';

/** Vite plugin for HTML transform — placeholder for future per-route HTML injection */
export function htmlTemplatePlugin(_options: FrameworkOptions = {}): Plugin {
  return {
    name: 'kiss:html-template',

    transformIndexHtml: {
      // Run after Vite's built-in HTML transforms
      order: 'post',

      // Currently returns empty tags — no injection happens.
      // TODO: Implement when dev-server gains route-awareness:
      //   1. Read route metadata from transform context
      //   2. Inject <title>, <meta description>, <link rel="modulepreload">
      handler() {
        return [];
      },
    },
  };
}

/**
 * Extract route metadata from a module's exports.
 * Looks for `meta` export or individual `title`/`description` exports.
 *
 * Used by SSG pipeline (build-ssg.ts → hono-entry.ts) to build docConfig,
 * NOT by htmlTemplatePlugin (which currently does nothing).
 */
export function extractRouteMeta(module: Record<string, unknown>): import('./types.js').RouteMeta {
  const meta: import('./types.js').RouteMeta = {};

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
