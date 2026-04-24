/**
 * @kissjs/core - HTML Template Plugin
 * Implements the `transformIndexHtml` Vite hook.
 *
 * Injects into the HTML document:
 * - Preload hints for island chunks
 * - CSS stylesheet links
 * - Meta tags from route module exports
 * - The island hydration script (only when islands are detected)
 */

import type { Plugin, HtmlTagDescriptor } from 'vite'
import type { FrameworkOptions, RouteMeta } from './types.js'

export function htmlTemplatePlugin(options: FrameworkOptions = {}): Plugin {
  return {
    name: 'kiss:html-template',

    transformIndexHtml: {
      // Run after Vite's built-in HTML transforms
      order: 'post',

      handler(html, ctx) {
        const tags: HtmlTagDescriptor[] = []

        // Get the route-specific data from server context if available
        const routeMeta = (ctx as any).__kissRouteMeta as RouteMeta | undefined

        if (routeMeta) {
          // Inject meta tags
          if (routeMeta.title) {
            tags.push({
              tag: 'title',
              children: routeMeta.title,
              injectTo: 'head',
            })
          }

          if (routeMeta.description) {
            tags.push({
              tag: 'meta',
              attrs: { name: 'description', content: routeMeta.description },
              injectTo: 'head',
            })
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
              })
            }
          }
        }

        return tags
      },
    },
  }
}

/**
 * Extract route metadata from a module's exports.
 * Looks for `meta` export or individual `title`/`description` exports.
 */
export function extractRouteMeta(module: Record<string, any>): RouteMeta {
  const meta: RouteMeta = {}

  // Check for a `meta` export object
  if (module.meta && typeof module.meta === 'object') {
    if (module.meta.title) meta.title = String(module.meta.title)
    if (module.meta.description) meta.description = String(module.meta.description)
  }

  // Individual exports take precedence
  if (module.title && typeof module.title === 'string') {
    meta.title = module.title
  }
  if (module.description && typeof module.description === 'string') {
    meta.description = module.description
  }

  return meta
}
