/**
 * @kiss/vite - Build plugin
 * Handles dual-end build (SSR + Client) for production.
 *
 * Phase 1: Actually executes Vite builds instead of just logging config.
 *
 * Build strategy (Web Standards aligned):
 * - SSR build: produces ESM bundle for server runtimes (Deno/Node/CF Workers)
 * - Client build: produces minimal JS — only island components + hydration
 * - Zero-JS pages output nothing to client (Level 0 progressive enhancement)
 *
 * The build happens in `closeBundle` so Vite's own build runs first,
 * then we kick off the secondary build(s).
 */

import type { Plugin, ResolvedConfig } from 'vite'
import type { FrameworkOptions } from './types.js'
import { build as viteBuild, type InlineConfig } from 'vite'
import { resolve, join } from 'node:path'

/** SSR noExternal packages — Lit must be bundled into SSR output */
const DEFAULT_SSR_NO_EXTERNAL = [
  'lit',
  'lit-html',
  'lit-element',
  '@lit/reactive-element',
  '@lit-labs/ssr',
]

// Module-level flag to prevent re-entry across plugin instances (viteBuild spawns new plugin instances)
let GLOBAL_BUILT = false

export function buildPlugin(options: FrameworkOptions = {}): Plugin {
  const routesDir = options.routesDir || 'app/routes'
  const islandsDir = options.islandsDir || 'app/islands'
  const outDir = options.build?.outDir || 'dist'
  const ssrNoExternal = options.ssr?.noExternal || DEFAULT_SSR_NO_EXTERNAL

  let config: ResolvedConfig

  return {
    name: 'kiss:build',

    configResolved(resolvedConfig) {
      config = resolvedConfig
    },

    async closeBundle() {
      // Prevent infinite recursion — viteBuild() spawns new plugin instances,
      // so we use a module-level flag to prevent re-entry across all instances.
      if (GLOBAL_BUILT) return
      GLOBAL_BUILT = true

      // Only run in build mode (not dev)
      if (config.command !== 'build') return

      const root = config.root

      // Check if SSR entry exists
      const serverEntry = resolve(root, 'app/server.ts')
      const clientEntry = resolve(root, 'app/client.ts')

      // === Step 1: SSR Build ===
      // Only run if serverEntry exists
      const fs = await import('node:fs')
      if (fs.existsSync(serverEntry)) {
        console.log('[KISS] Building SSR bundle...')
        try {
          const ssrConfig: InlineConfig = {
            root,
            plugins: [], // Prevent KISS plugins from re-loading in nested build
            build: {
              ssr: true,
              outDir: resolve(root, outDir, 'server'),
              rollupOptions: {
                input: {
                  server: serverEntry,
                },
                output: {
                  format: 'esm',
                  entryFileNames: '[name].js',
                },
              },
              minify: false,
            },
            ssr: {
              noExternal: ssrNoExternal,
            },
          }

          await viteBuild(ssrConfig)
          console.log('[KISS] SSR bundle built →', resolve(root, outDir, 'server'))
        } catch (error) {
          console.error('[KISS] SSR build failed:', error)
          throw error
        }
      } else {
        console.log('[KISS] No server entry found, skipping SSR build')
      }

      // === Step 2: Client Build (Islands only) ===
      // Only run if clientEntry exists
      if (fs.existsSync(clientEntry)) {
        console.log('[KISS] Building client bundle (islands)...')
        try {
          const clientConfig: InlineConfig = {
            root,
            plugins: [], // Prevent KISS plugins from re-loading in nested build
            build: {
              outDir: resolve(root, outDir, 'client'),
              rollupOptions: {
              input: {
                client: clientEntry,
              },
              output: {
                format: 'esm',
                entryFileNames: '[name].js',
                chunkFileNames: 'islands/[name]-[hash].js',
                // Split each island into its own chunk for per-page loading
                manualChunks(id) {
                  if (id.includes(`/${islandsDir}/`)) {
                    const match = id.match(/\/([^/]+)\.(ts|js)$/)
                    if (match) {
                      return `island-${match[1]}`
                    }
                  }
                },
              },
            },
          },
        }

        await viteBuild(clientConfig)
        console.log('[KISS] Client bundle built →', resolve(root, outDir, 'client'))
      } catch (error) {
        console.error('[KISS] Client build failed:', error)
        throw error
      }

      console.log('[KISS] Build complete!')
      console.log('[KISS]   Server: ', resolve(root, outDir, 'server'))
      console.log('[KISS]   Client: ', resolve(root, outDir, 'client'))
    },
  }
}

/**
 * Generate the SSR entry point file content.
 * This is used when no custom server.ts is provided.
 */
export function generateServerEntry(routesDir: string): string {
  return `// KISS Server Entry (auto-generated)
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { requestId } from 'hono/request-id'

const app = new Hono()
app.use('*', requestId())
app.use('*', logger())

// Import and register all route modules
// This will be populated by the build process based on scanned routes

export default app
`
}

/**
 * Generate the client entry point file content.
 * This is used when no custom client.ts is provided.
 * It imports all island components and registers them as custom elements.
 */
export function generateClientEntry(islandsDir: string, islandFiles: string[]): string {
  if (islandFiles.length === 0) {
    return '// KISS Client Entry — No islands detected, zero client JS needed\n'
  }

  const imports = islandFiles
    .map((f, i) => {
      const tagName = f.replace(/\.[^.]+$/, '')
      return `import Island_${i} from './${islandsDir}/${f}';`
    })
    .join('\n')

  const registrations = islandFiles
    .map((f, i) => {
      const tagName = f.replace(/\.[^.]+$/, '')
      return `if (!customElements.get('${tagName}')) customElements.define('${tagName}', Island_${i});`
    })
    .join('\n  ')

  return `// KISS Client Entry (auto-generated)
${imports}

// Register all island custom elements
${registrations}
`
}
