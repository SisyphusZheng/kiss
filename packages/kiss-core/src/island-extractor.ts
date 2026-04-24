/**
 * @kissjs/core - Island Extractor
 * Build-time analysis of island dependencies and mapping table generation.
 *
 * Purpose: During production build, analyze which island components are used
 * by which routes, so the client build can tree-shake unused islands.
 *
 * Output: a mapping table (tagName → chunk file) that the HTML template
 * uses to inject only the necessary island scripts per page.
 *
 * Web Standards alignment:
 * - No runtime dependency — this runs only at build time
 * - Output is standard ESM dynamic import() calls
 */

import type { Plugin, ResolvedConfig } from 'vite'
import type { FrameworkOptions, IslandMeta } from './types.js'
import { scanIslands, fileToTagName } from './route-scanner.js'
import { join, resolve, relative } from 'node:path'

/** Island chunk mapping entry */
export interface IslandChunkMap {
  /** Custom element tag name */
  tagName: string
  /** Source module path (relative to project root) */
  modulePath: string
  /** Output chunk file name (set after client build) */
  chunkFile?: string
  /** Estimated size in bytes (after client build) */
  estimatedSize?: number
}

/**
 * Create the island extractor plugin.
 * Runs during build to analyze island usage and generate the chunk map.
 */
export function islandExtractorPlugin(options: FrameworkOptions = {}): Plugin {
  const islandsDir = options.islandsDir || 'app/islands'
  let config: ResolvedConfig
  let islandMap: Map<string, IslandChunkMap> = new Map()

  return {
    name: 'kiss:island-extractor',

    configResolved(resolvedConfig) {
      config = resolvedConfig
    },

    async buildStart() {
      // Scan for island files at build start
      const root = config.root
      const islandFiles = await scanIslands(join(root, islandsDir))

      islandMap.clear()
      for (const file of islandFiles) {
        const tagName = fileToTagName(file)
        const modulePath = `/${islandsDir}/${file}`
        islandMap.set(tagName, {
          tagName,
          modulePath,
        })
      }

      if (islandMap.size > 0) {
        console.log(`[KISS] Found ${islandMap.size} island(s):`)
        for (const [tag, entry] of islandMap) {
          console.log(`[KISS]   <${tag}> → ${entry.modulePath}`)
        }
      } else {
        console.log('[KISS] No islands detected — zero client JS output')
      }
    },

    /**
     * Generate the island registry module.
     * This is imported by the client entry point.
     */
    generateBundle() {
      // Generate the island registry as a virtual module
      const entries = Array.from(islandMap.values())

      if (entries.length === 0) return

      const registryCode = generateIslandRegistry(entries, islandsDir)

      this.emitFile({
        type: 'asset',
        fileName: 'kiss-island-registry.js',
        source: registryCode,
      })
    },
  }
}

/**
 * Generate the island registry module code.
 * This module is used by the client build to register island custom elements.
 */
function generateIslandRegistry(
  entries: IslandChunkMap[],
  islandsDir: string
): string {
  const imports = entries
    .map((entry, i) => {
      return `import Island_${i} from '.${entry.modulePath}';`
    })
    .join('\n')

  const registrations = entries
    .map((entry, i) => {
      return `if (!customElements.get('${entry.tagName}')) {
  customElements.define('${entry.tagName}', Island_${i});
}`
    })
    .join('\n')

  return `// KISS Island Registry (auto-generated at build time)
// DO NOT EDIT — changes will be overwritten

${imports}

// Register all island custom elements
${registrations}
`
}

/**
 * Generate the island manifest JSON.
 * Used by the HTML template to inject per-page island scripts.
 */
export function generateIslandManifest(
  islandMap: Map<string, IslandChunkMap>
): string {
  const manifest: Record<string, { modulePath: string; chunkFile?: string }> = {}
  for (const [tagName, entry] of islandMap) {
    manifest[tagName] = {
      modulePath: entry.modulePath,
      chunkFile: entry.chunkFile,
    }
  }
  return JSON.stringify(manifest, null, 2)
}

/**
 * Get the known islands map for SSR island collection.
 * This is used by ssr-handler and the generated Hono entry.
 */
export function getKnownIslandsMap(
  islandFiles: string[],
  islandsDir: string
): Map<string, string> {
  const map = new Map<string, string>()
  for (const file of islandFiles) {
    const tagName = fileToTagName(file)
    map.set(tagName, `/${islandsDir}/${file}`)
  }
  return map
}
