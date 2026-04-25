/**
 * @kissjs/core - HTML Template Plugin
 * Implements the `transformIndexHtml` Vite hook.
 *
 * Injects into the HTML document:
 * - Preload hints for island chunks
 * - CSS stylesheet links
 * - Meta tags from route module exports
 *
 * PIA: Uses Hono ContextVariableMap for type extension
 * instead of declare module 'vite' augmentation.
 */

import type { HtmlTagDescriptor, Plugin } from 'vite';
import type { FrameworkOptions, RouteMeta } from './types.js';

/** Route metadata key for Vite HTML transform context */
const KISS_ROUTE_META_KEY = '__kissRouteMeta' as const;

/** Extend Vite's transformIndexHtml context with KISS route metadata */
declare module 'vite' {
  interface IndexHtmlTransformContext {
    [KISS_ROUTE_META_KEY]?: RouteMeta;
  }
}

/** Vite plugin for HTML transform — injects preload hints, meta tags, and island hydration scripts */
export function htmlTemplatePlugin(_options: FrameworkOptions = {}): Plugin {
  return {
    name: 'kiss:html-template',

    transformIndexHtml: {
      // Run after Vite's built-in HTML transforms
      order: 'post',

      handler(_html, ctx) {
        const tags: HtmlTagDescriptor[] = [];

        // Get the route-specific data from server context if available
        const routeMeta = ctx[KISS_ROUTE_META_KEY];

        if (routeMeta) {
          // Inject meta tags
          if (routeMeta.title) {
            tags.push({
              tag: 'title',
              children: routeMeta.title,
              injectTo: 'head',
            });
          }

          if (routeMeta.description) {
            tags.push({
              tag: 'meta',
              attrs: { name: 'description', content: routeMeta.description },
              injectTo: 'head',
            });
          }

          // Inject preload hints for island chunks
          if (routeMeta.islandChunks) {
            for (const chunk of routeMeta.islandChunks) {
              tags.push({
                tag: 'link',
                attrs: {
                  rel: 'modulepreload',
                  href: chunk,
                },
                injectTo: 'head',
              });
            }
          }
        }

        return tags;
      },
    },
  };
}

/**
 * Extract route metadata from a module's exports.
 * Looks for `meta` export or individual `title`/`description` exports.
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
