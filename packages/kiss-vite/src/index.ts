/**
 * @kiss/vite - Main entry
 * Exports the kiss() function that composes all sub-plugins.
 *
 * Plugin composition order:
 * 1. dev-server      — Hono middleware + SSR rendering + virtual modules
 * 2. island-transform — AST markers for island components
 * 3. island-extractor — Build-time island dependency analysis
 * 4. html-template   — transformIndexHtml (preload, meta, hydration script)
 * 5. build           — Dual-end build (SSR + Client)
 */

import type { Plugin } from 'vite'
import type { FrameworkOptions } from './types.js'
import { devServerPlugin } from './dev-server.js'
import { islandTransformPlugin } from './island-transform.js'
import { islandExtractorPlugin } from './island-extractor.js'
import { htmlTemplatePlugin } from './html-template.js'
import { buildPlugin } from './build.js'

export type { FrameworkOptions, RouteEntry, IslandMeta, SsrContext, SpecialFileType } from './types.js'
export { KissError, NotFoundError, UnauthorizedError, ForbiddenError, ValidationError, ConflictError, RateLimitError, SsrRenderError, HydrationError } from './errors.js'
export { createSsrContext, extractParams, parseQuery } from './context.js'
export { collectIslands, renderSsrError, wrapInDocument } from './ssr-handler.js'
export { generateHydrationScript } from './island-transform.js'
export { getKnownIslandsMap } from './island-extractor.js'

/**
 * KISS Framework Vite Plugin
 *
 * Usage:
 * ```ts
 * // vite.config.ts
 * import { kiss } from '@kiss/vite'
 *
 * export default defineConfig({
 *   plugins: [kiss()]
 * })
 * ```
 */
export function kiss(options: FrameworkOptions = {}): Plugin[] {
  const resolvedOptions: FrameworkOptions = {
    routesDir: options.routesDir || 'app/routes',
    islandsDir: options.islandsDir || 'app/islands',
    componentsDir: options.componentsDir || 'app/components',
    ...options,
  }

  return [
    // 1. Dev server — Hono middleware + SSR rendering + virtual modules
    devServerPlugin(resolvedOptions),

    // 2. Island transform — AST markers (__island, __tagName)
    islandTransformPlugin(resolvedOptions.islandsDir || 'app/islands'),

    // 3. Island extractor — Build-time island dependency analysis
    islandExtractorPlugin(resolvedOptions),

    // 4. HTML template — transformIndexHtml (preload, meta, hydration)
    htmlTemplatePlugin(resolvedOptions),

    // 5. Build — dual-end build (SSR + Client)
    buildPlugin(resolvedOptions),
  ]
}

// Default export for convenience
export default kiss
