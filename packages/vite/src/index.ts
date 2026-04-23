/**
 * @hvl/vite - Main entry
 * Exports the framework() function that composes all sub-plugins.
 */

import type { Plugin } from 'vite'
import type { FrameworkOptions } from './types.js'
import { devServerPlugin } from './dev-server.js'
import { islandTransformPlugin } from './island-transform.js'
import { buildPlugin } from './build.js'

export type { FrameworkOptions, RouteEntry, IslandMeta, SsrContext } from './types.js'
export { HvlError, NotFoundError, UnauthorizedError, ForbiddenError, ValidationError, ConflictError, RateLimitError, SsrRenderError, HydrationError } from './errors.js'

/**
 * HVL Framework Vite Plugin
 *
 * Usage:
 * ```ts
 * // vite.config.ts
 * import { framework } from '@hvl/vite'
 * export default defineConfig({
 *   plugins: [framework()]
 * })
 * ```
 */
export function framework(options: FrameworkOptions = {}): Plugin[] {
  const resolvedOptions: FrameworkOptions = {
    routesDir: options.routesDir || 'app/routes',
    islandsDir: options.islandsDir || 'app/islands',
    componentsDir: options.componentsDir || 'app/components',
    ...options,
  }

  return [
    // 1. Dev server — Hono middleware + SSR rendering + virtual modules
    devServerPlugin(resolvedOptions),

    // 2. Island transform — AST markers + client registration
    islandTransformPlugin(resolvedOptions.islandsDir || 'app/islands'),

    // 3. Build — dual-end build (SSR + Client)
    buildPlugin(resolvedOptions),
  ]
}

// Default export for convenience
export default framework
