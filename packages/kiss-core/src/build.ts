/**
 * @kiss/core - Build plugin
 * Handles dual-end build (SSR + Client) for production.
 *
 * Build strategy (Web Standards aligned):
 * - SSR build: produces ESM bundle for server runtimes (Deno/Node/CF Workers)
 * - Client build: produces minimal JS — only island components + hydration
 * - Zero-JS pages output nothing to client (Level 0 progressive enhancement)
 * - SSG is handled by the separate @kiss/ssg plugin
 *
 * The build happens in `closeBundle` so Vite's own build runs first,
 * then we kick off the secondary build(s).
 */

import type { Plugin, ResolvedConfig } from 'vite'
import type { FrameworkOptions } from './types.js'
import type { KissBuildContext } from './build-context.js'
import { build as viteBuild, type InlineConfig } from 'vite'
import { resolve } from 'node:path'
import { existsSync } from 'node:fs'

/** SSR noExternal packages — Lit must be bundled into SSR output */
const DEFAULT_SSR_NO_EXTERNAL = [
  'lit',
  'lit-html',
  'lit-element',
  '@lit/reactive-element',
  '@lit-labs/ssr',
]

// Module-level flag remains as a safety net for viteBuild() spawning new instances.
// In normal use, the KissBuildContext.clientBuildTriggered flag is checked first.
// This module-level flag catches the edge case where viteBuild() creates a new
// plugin instance that doesn't share the same context object.
let GLOBAL_BUILT = false

/** Vite plugin for dual-end production build (SSR + Client islands) */
export function buildPlugin(options: FrameworkOptions = {}, ctx?: KissBuildContext): Plugin {
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
      // Prevent infinite recursion — viteBuild() spawns new plugin instances.
      // Two-level check:
      //   1. KissBuildContext flag (per-kiss() instance, resettable for testing)
      //   2. Module-level flag (safety net for viteBuild() spawning new instances)
      if (ctx?.clientBuildTriggered || GLOBAL_BUILT) return
      if (ctx) ctx.clientBuildTriggered = true
      GLOBAL_BUILT = true

      // Only run in build mode (not dev)
      if (config.command !== 'build') return

      const root = config.root

      // Check if SSR entry exists
      const serverEntry = resolve(root, 'app/server.ts')
      const clientEntry = resolve(root, 'app/client.ts')

      // === Step 1: SSR Build ===
      // Only run if serverEntry exists
      if (existsSync(serverEntry)) {
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
      if (existsSync(clientEntry)) {
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
                  manualChunks(id: string) {
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
      } else {
        console.log('[KISS] No client entry found, skipping client build')
      }

      console.log('[KISS] Build complete!')
      console.log('[KISS]   Server: ', resolve(root, outDir, 'server'))
      console.log('[KISS]   Client: ', resolve(root, outDir, 'client'))
    },
  }
}


