/**
 * @kiss/core - Main entry
 * Exports the kiss() function that composes all sub-plugins.
 *
 * Plugin composition order:
 * 1. @hono/vite-dev-server — dev server (replaces manual Hono wiring)
 * 2. virtual:kiss-hono-entry — virtual module (generated Hono app)
 * 3. island-transform     — AST markers (__island, __tagName)
 * 4. island-extractor    — Build-time island dependency analysis
 * 5. html-template        — transformIndexHtml (preload, meta, hydration)
 * 6. @hono/vite-ssg       — SSG (replaces hand-written kiss-ssg)
 * 7. build                — Dual-end build (SSR + Client)
 *
 * Architecture:
 *   kiss() scans routes → generates virtual:kiss-hono-entry (Hono app code)
 *   @hono/vite-dev-server uses virtual:kiss-hono-entry as entry (dev mode)
 *   @hono/vite-ssg uses virtual:kiss-hono-entry as entry (build/SSG mode)
 */

import type { Plugin, ResolvedConfig } from 'vite'
import type { FrameworkOptions, RouteEntry } from './types.js'
import { islandTransformPlugin } from './island-transform.js'
import { islandExtractorPlugin } from './island-extractor.js'
import { htmlTemplatePlugin } from './html-template.js'
import { buildPlugin } from './build.js'
import { generateHonoEntryCode } from './hono-entry.js'
import { scanRoutes } from './route-scanner.js'

export type {
  FrameworkOptions, RouteEntry, IslandMeta, SsrContext, SpecialFileType,
} from './types.js'
export {
  KissError, NotFoundError, UnauthorizedError, ForbiddenError,
  ValidationError, ConflictError, RateLimitError, SsrRenderError, HydrationError,
} from './errors.js'
export { createSsrContext, extractParams, parseQuery } from './context.js'
export { collectIslands, renderSsrError, wrapInDocument } from './ssr-handler.js'
export { generateHydrationScript } from './island-transform.js'
export { getKnownIslandsMap } from './island-extractor.js'

// --- Static imports for Hono official Vite plugins ---
// These are dependencies (listed in package.json), so they should be installed.
// If not installed, the user gets a clear error at import time.
let honoDevServerFactory: ((opts: any) => Plugin) | null = null
let honoSsgFactory: ((opts: any) => Plugin) | null = null

try {
  // In ESM, use dynamic import() — but we need sync. Use require via createRequire.
  // Since this file is compiled to ESM (format: 'esm' in vite.config.build.ts),
  // we need to handle CJS interop. Vite plugins are typically CJS-exports.
  // The safest way: conditional require for CJS, static import for ESM.
  // Actually - just use top-level import and let Node/Deno handle it.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const dsMod = require('@hono/vite-dev-server')
  honoDevServerFactory = dsMod.default || dsMod
} catch (e) {
  // Not installed — will warn at runtime
}

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ssgMod = require('@hono/vite-ssg')
  honoSsgFactory = ssgMod.default || ssgMod
} catch (e) {
  // Not installed — will warn at runtime
}

const VIRTUAL_HONO_ENTRY = 'virtual:kiss-hono-entry'
const RESOLVED_HONO_ENTRY = '\0' + VIRTUAL_HONO_ENTRY

/**
 * KISS Framework Vite Plugin
 *
 * Usage:
 * ```ts
 * // vite.config.ts
 * import { kiss } from '@kiss/core'
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

  const routesDir   = resolvedOptions.routesDir!
  let config: ResolvedConfig

  // --- Hono entry code (generated once, served by virtual module) ---
  let honoEntryCode: string = ''

  function buildHonoEntry(): void {
    // Synchronous route scan for configResolved (which is sync)
    // scanRoutes is async, but we need sync here. Workaround: fire-and-forget
    // and also provide a sync path. Actually - let's just do it properly.
    // configResolved can't be async. So we generate a minimal entry now,
    // then regenerate with real routes in buildStart (which CAN be async).
    honoEntryCode = generateHonoEntryCode([], resolvedOptions)
  }

  // --- Plugin: virtual:kiss-hono-entry provider ---
  const virtualEntryPlugin: Plugin = {
    name: 'kiss:virtual-hono-entry',

    resolveId(id) {
      if (id === VIRTUAL_HONO_ENTRY) return RESOLVED_HONO_ENTRY
    },

    load(id) {
      if (id === RESOLVED_HONO_ENTRY) {
        if (!honoEntryCode) {
          buildHonoEntry()
        }
        return honoEntryCode
      }
    },
  }

  // --- Plugin: async route scanner (updates honoEntryCode with real routes) ---
  const routeScannerPlugin: Plugin = {
    name: 'kiss:route-scanner',

    async buildStart() {
      try {
        const root = config?.root || process.cwd()
        const routes = await scanRoutes(routesDir!)
        honoEntryCode = generateHonoEntryCode(routes, {
          routesDir: resolvedOptions.routesDir,
          componentsDir: resolvedOptions.componentsDir,
        })
        const pageCount = routes.filter(r => r.type === 'page' && !r.special).length
        const apiCount  = routes.filter(r => r.type === 'api'  && !r.special).length
        console.log(
          `[KISS] Routes: ${pageCount} page(s), ${apiCount} API route(s) ` +
          `— Hono entry generated (${honoEntryCode.length} bytes)`,
        )
      } catch (err) {
        console.error('[KISS] Failed to scan routes:', err)
      }
    },
  }

  // --- Build the final plugin array ---
  const plugins: Plugin[] = []

  // 1. @hono/vite-dev-server (dev mode)
  if (honoDevServerFactory) {
    try {
      const devServerPlugin = honoDevServerFactory({
        entry: VIRTUAL_HONO_ENTRY,
        injectClientScript: true,
      })
      plugins.push(devServerPlugin)
      console.log('[KISS] Using @hono/vite-dev-server for dev server')
    } catch (e) {
      console.warn('[KISS] Failed to init @hono/vite-dev-server:', e)
    }
  } else {
    console.warn(
      '[KISS] @hono/vite-dev-server not installed.\n' +
      '  Install with: npm install -D @hono/vite-dev-server\n' +
      '  Falling back to legacy dev server mode.',
    )
  }

  // 2. Virtual Hono entry provider
  plugins.push(virtualEntryPlugin)

  // 3. Async route scanner (updates honoEntryCode)
  plugins.push(routeScannerPlugin)

  // 4. Island transform — AST markers (__island, __tagName)
  plugins.push(
    islandTransformPlugin(resolvedOptions.islandsDir || 'app/islands'),
  )

  // 5. Island extractor — Build-time island dependency analysis
  plugins.push(islandExtractorPlugin(resolvedOptions))

  // 6. HTML template — transformIndexHtml (preload, meta, hydration)
  plugins.push(htmlTemplatePlugin(resolvedOptions))

  // 7. @hono/vite-ssg (build/SSG mode)
  if (honoSsgFactory) {
    try {
      const ssgPlugin = honoSsgFactory({
        entry: VIRTUAL_HONO_ENTRY,
      })
      plugins.push(ssgPlugin)
      console.log('[KISS] Using @hono/vite-ssg for static site generation')
    } catch (e) {
      console.warn('[KISS] Failed to init @hono/vite-ssg:', e)
    }
  } else {
    console.warn(
      '[KISS] @hono/vite-ssg not installed.\n' +
      '  Install with: npm install -D @hono/vite-ssg\n' +
      '  SSG will be skipped.',
    )
  }

  // 8. Build — dual-end build (SSR + Client)
  plugins.push(buildPlugin(resolvedOptions))

  return plugins
}

// Default export for convenience
export default kiss
