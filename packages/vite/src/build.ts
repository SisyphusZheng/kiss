/**
 * @hvl/vite - Build plugin
 * Handles dual-end build (SSR + Client) for production.
 */

import type { Plugin, ResolvedConfig } from 'vite'
import type { FrameworkOptions } from './types.js'
import { build as viteBuild, type BuildOptions } from 'vite'
import { resolve, join } from 'node:path'

export function buildPlugin(options: FrameworkOptions = {}): Plugin {
  const routesDir = options.routesDir || 'app/routes'
  const islandsDir = options.islandsDir || 'app/islands'
  const outDir = options.build?.outDir || 'dist'
  const ssrNoExternal = options.ssr?.noExternal || [
    'lit',
    'lit-html',
    'lit-element',
    '@lit/reactive-element',
    '@lit-labs/ssr',
    '@lit-labs/ssr-client',
  ]

  let config: ResolvedConfig

  return {
    name: 'hvl:build',

    configResolved(resolvedConfig) {
      config = resolvedConfig
    },

    async closeBundle() {
      // Only run in build mode
      if (config.command !== 'build') return

      const root = config.root

      // Step 1: SSR build
      console.log('[HVL] Building SSR bundle...')
      const ssrBuildOptions: BuildOptions = {
        ssr: true,
        outDir: resolve(root, outDir, 'server'),
        rollupOptions: {
          input: {
            server: resolve(root, 'app/server.ts'),
          },
          output: {
            format: 'esm',
          },
        },
      }

      // Step 2: Client build (only islands + hydration)
      console.log('[HVL] Building client bundle (islands)...')
      const clientBuildOptions: BuildOptions = {
        outDir: resolve(root, outDir, 'client'),
        rollupOptions: {
          input: {
            client: resolve(root, 'app/client.ts'),
          },
          output: {
            format: 'esm',
            manualChunks(id) {
              // Split each island into its own chunk
              if (id.includes(`/${islandsDir}/`)) {
                const match = id.match(/\/([^/]+)\.(ts|js)$/)
                return match ? `island-${match[1]}` : undefined
              }
            },
          },
        },
      }

      // Note: In a real implementation, we'd need to run these builds
      // through Vite's build API. For PoC, this demonstrates the structure.
      console.log('[HVL] Build configuration ready')
      console.log('[HVL]   SSR output:', resolve(root, outDir, 'server'))
      console.log('[HVL]   Client output:', resolve(root, outDir, 'client'))
    },
  }
}

/**
 * Generate the SSR entry point file content.
 */
export function generateServerEntry(routesDir: string): string {
  return `// HVL Server Entry (auto-generated)
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
 */
export function generateClientEntry(islandsDir: string, islandFiles: string[]): string {
  if (islandFiles.length === 0) {
    return '// HVL Client Entry — No islands detected\n'
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

  return `// HVL Client Entry (auto-generated)
${imports}

// Register all island custom elements
${registrations}
`
}
