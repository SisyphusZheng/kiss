/**
 * @kissjs/core - SSG Post-Processing
 *
 * Pure Node.js fs operations for SSG output post-processing.
 * No Vite dependency — these functions only read/write files.
 *
 * What this module does:
 *   1. buildIslandChunkMap — scan client build output → tagName → chunk path
 *   2. rewriteHtmlFiles — rewrite Island paths + apply aria-current highlights
 *
 * KISS Architecture:
 *   - K+S (Knowledge + Static): SSG output is pure static HTML
 *   - I (Isolated): Islands are the only JS that gets rewritten
 *   - S (Semantic): aria-current for accessibility without JS
 */

import { join, resolve } from 'node:path';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';

/**
 * Scan client build output to build tagName → chunk path mapping.
 * Called from SSG plugin after HTML is generated.
 */
export function buildIslandChunkMap(
  root: string,
  outDir: string,
  islands: string[],
  basePath: string = '/',
): Record<string, string> {
  const distDir = resolve(root, outDir);
  const clientDir = resolve(distDir, 'client');
  const islandChunkMap: Record<string, string> = {};

  if (!existsSync(clientDir)) return islandChunkMap;

  const islandsBuildDir = join(clientDir, 'islands');
  if (existsSync(islandsBuildDir)) {
    const files = readdirSync(islandsBuildDir);
    for (const file of files) {
      if (file.endsWith('.js')) {
        const content = readFileSync(join(islandsBuildDir, file), 'utf-8');
        for (const tagName of islands) {
          // Match tagName as a string constant in the built output.
          // Minified code may use: const X="code-block" or customElements.define(X,I)
          // So we search for the quoted tagName string rather than the define call.
          if (content.includes(`"${tagName}"`) || content.includes(`'${tagName}'`)) {
            islandChunkMap[tagName] = `${basePath}client/islands/${file}`;
          }
        }
      }
    }
  }

  // Fallback: check main client entry if no island-specific chunks found
  if (Object.keys(islandChunkMap).length === 0) {
    const clientEntry = join(clientDir, 'islands', 'client.js');
    if (existsSync(clientEntry)) {
      for (const tagName of islands) {
        islandChunkMap[tagName] = `${basePath}client/islands/client.js`;
      }
    }
  }

  return islandChunkMap;
}

/**
 * Walk all HTML files in dist and rewrite hydration script Island paths.
 *
 * Before: import('/app/islands/code-block.ts')
 * After:  import('/client/islands/island-code-block-abc123.js')
 *
 * v0.3.0: Removed sidebar active-link highlighting — this is application
 * responsibility. Use <kiss-layout currentPath="..."> which renders
 * aria-current="page" directly in SSR output.
 */
export function rewriteHtmlFiles(
  dir: string,
  islandChunkMap: Record<string, string>,
): void {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      rewriteHtmlFiles(fullPath, islandChunkMap);
    } else if (entry.name.endsWith('.html')) {
      let content = readFileSync(fullPath, 'utf-8');
      let modified = false;

      // 1. Rewrite Island hydration paths
      for (const [tagName, chunkPath] of Object.entries(islandChunkMap)) {
        const sourcePattern = `import('/app/islands/${tagName}.ts')`;
        if (content.includes(sourcePattern)) {
          content = content.replaceAll(sourcePattern, `import('${chunkPath}')`);
          modified = true;
        }
        const sourcePattern2 = `import('app/islands/${tagName}.ts')`;
        if (content.includes(sourcePattern2)) {
          content = content.replaceAll(sourcePattern2, `import('${chunkPath}')`);
          modified = true;
        }
      }

      if (modified) {
        writeFileSync(fullPath, content, 'utf-8');
      }
    }
  }
}
