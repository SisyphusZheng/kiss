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
 * Also applies aria-current="page" + class="active" to the matching sidebar link.
 *
 * Before: import('/app/islands/code-block.ts')
 * After:  import('/client/islands/island-code-block-abc123.js')
 *
 * Before: <a href="/kiss/guide/dia" class="" aria-current="">
 * After:  <a href="/kiss/guide/dia" class="active" aria-current="page">
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

      // 2. Apply sidebar active highlight based on file's URL path
      // Extract currentpath from the <app-layout> element
      const currentPathMatch = content.match(/currentpath="([^"]*)"/);
      if (currentPathMatch) {
        const currentPage = currentPathMatch[1];

        // Step 1: Remove all empty aria-current="" attributes (Lit SSR artifact for undefined)
        // Non-active links should not have aria-current at all
        if (content.includes('aria-current=""')) {
          content = content.replaceAll('aria-current=""', '');
          modified = true;
        }

        // Step 2: Find the sidebar link matching current page and add active state
        // Sidebar links are inside <nav class="docs-sidebar">, format:
        //   <a href="/kiss/guide/dia" class="" >Design Philosophy</a>
        // After step 1, aria-current="" is removed, so we only need to add class="active" + aria-current="page"
        const linkPattern = `href="${currentPage}"`;
        // Find ALL occurrences — we want the one inside the sidebar (second occurrence typically)
        let searchFrom = 0;
        while (true) {
          const linkIdx = content.indexOf(linkPattern, searchFrom);
          if (linkIdx === -1) break;

          // Find the <a tag before this href (search up to 200 chars back for multi-line tags)
          const searchBack = Math.max(0, linkIdx - 200);
          const beforeHref = content.substring(searchBack, linkIdx);
          const aTagOffset = beforeHref.lastIndexOf('<a');
          if (aTagOffset !== -1) {
            const aTagStart = searchBack + aTagOffset;
            const aTagEnd = content.indexOf('>', linkIdx);
            if (aTagEnd !== -1) {
              const fullLink = content.substring(aTagStart, aTagEnd + 1);
              // Only modify links that have class="" (sidebar links, not header nav links)
              if (fullLink.includes('class=""')) {
                const updatedLink = fullLink
                  .replace('class=""', 'class="active"')
                  // Add aria-current="page" as an attribute on the <a tag
                  .replace(/(<a\s)/, '$1aria-current="page" ');
                if (updatedLink !== fullLink) {
                  content = content.replace(fullLink, updatedLink);
                  modified = true;
                }
                break; // Only modify the first sidebar match
              }
            }
          }
          searchFrom = linkIdx + linkPattern.length;
        }
      }

      if (modified) {
        writeFileSync(fullPath, content, 'utf-8');
      }
    }
  }
}
