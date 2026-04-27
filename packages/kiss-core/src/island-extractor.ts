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

import type { Plugin, ResolvedConfig } from 'vite';
import type { FrameworkOptions } from './types.js';
import type { IslandDecl } from './entry-descriptor.js';
import { fileToTagName, scanIslands } from './route-scanner.js';
import { join } from 'node:path';

export function islandExtractorPlugin(options: FrameworkOptions = {}): Plugin {
  const islandsDir = options.islandsDir || 'app/islands';
  let config: ResolvedConfig;
  const islandMap: Map<string, IslandDecl> = new Map();

  return {
    name: 'kiss:island-extractor',

    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },

    async buildStart() {
      // Scan for island files at build start
      const root = config.root;
      const islandFiles = await scanIslands(join(root, islandsDir));

      islandMap.clear();
      for (const file of islandFiles) {
        const tagName = fileToTagName(file);
        const modulePath = `/${islandsDir}/${file}`;
        islandMap.set(tagName, {
          tagName,
          modulePath,
        });
      }

      if (islandMap.size > 0) {
        console.log(`[KISS] Found ${islandMap.size} island(s):`);
        for (const [tag, entry] of islandMap) {
          console.log(`[KISS]   <${tag}> → ${entry.modulePath}`);
        }
      } else {
        console.log('[KISS] No islands detected — zero client JS output');
      }
    },
  };
}


