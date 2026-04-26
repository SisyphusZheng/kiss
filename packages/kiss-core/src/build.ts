/**
 * @kissjs/core - Build plugin
 * KISS Architecture (K·I·S·S): Knowledge · Isolated · Semantic · Static
 * Build produces only static files (K+S), Islands are the only JS (I).
 * API Routes (S — Serverless extension) deploy separately.
 *
 * What this plugin does:
 * - Auto-generates client entry from scanned Island list (I constraint)
 * - Client build: produces minimal JS — only island components + hydration
 * - Zero-JS pages output nothing to client (S constraint — semantic baseline)
 * - SSG is handled by the separate kiss:ssg plugin (K constraint)
 * - NO SSR runtime bundle (S constraint — static only)
 *
 * Build pipeline order (all in closeBundle):
 *   1. Vite's own build completes (SSR bundle for SSG)
 *   2. Client build: compile Islands into minimal JS chunks
 *   3. SSG: render all pages to static HTML with DSD
 *   4. Post-process: rewrite Island paths in HTML to point to built chunks
 *
 * IMPORTANT: SSG must run AFTER client build so we can map
 * Island source paths → built chunk paths in hydration scripts.
 */

import type { Plugin, ResolvedConfig } from 'vite';
import type { FrameworkOptions } from './types.js';
import type { KissBuildContext } from './build-context.js';
import { build as viteBuild, type InlineConfig } from 'vite';
import { join, resolve } from 'node:path';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';

/** Vite plugin for client build (Islands) and SSG orchestration */
export function buildPlugin(options: FrameworkOptions = {}, ctx?: KissBuildContext): Plugin {
  const islandsDir = options.islandsDir || 'app/islands';
  const outDir = options.build?.outDir || 'dist';

  let config: ResolvedConfig;
  let base: string = '/';

  return {
    name: 'kiss:build',

    configResolved(resolvedConfig) {
      config = resolvedConfig;
      base = resolvedConfig.base || '/';
      // Ensure base ends with /
      if (!base.endsWith('/')) base += '/';
    },

    async closeBundle() {
      // Prevent infinite recursion — viteBuild() spawns new plugin instances.
      // Use KissBuildContext flag exclusively (no module-level globals).
      if (ctx?.clientBuildTriggered) return;
      if (ctx) ctx.clientBuildTriggered = true;

      // Only run in build mode (not dev)
      if (config.command !== 'build') return;

      const root = config.root;
      const islands = ctx?.islandTagNames || [];

      // KISS Architecture: Only client build (Islands). No SSR runtime bundle.
      // If no islands found, skip client build entirely (S constraint: zero JS).
      if (islands.length === 0) {
        console.log('[KISS] No islands found, skipping client build');
        console.log('[KISS] KISS Architecture: Static pages only, zero client JS');
        console.log('[KISS] Build complete!');
        return;
      }

      console.log(`[KISS] Building client bundle for ${islands.length} island(s)...`);

      // Auto-generate client entry from Island list
      const kissTmpDir = join(root, '.kiss');
      mkdirSync(kissTmpDir, { recursive: true });
      const clientEntryPath = join(kissTmpDir, '.kiss-client-entry.ts');

      // Generate imports and registrations for all scanned islands
      const islandImports = islands.map((tagName, i) => {
        const modulePath = resolve(root, `${islandsDir}/${tagName}.ts`);
        return `import Island_${i} from '${modulePath.replace(/\\/g, '/')}';`;
      }).join('\n');

      const islandRegistrations = islands.map((tagName, i) => {
        return `if (!customElements.get('${tagName}')) customElements.define('${tagName}', Island_${i});`;
      }).join('\n');

      const clientEntryCode =
        `// KISS Client Entry (auto-generated — KISS Architecture: Islands only)
// DO NOT EDIT — changes will be overwritten
${islandImports}

// Register all island custom elements
${islandRegistrations}
`;

      writeFileSync(clientEntryPath, clientEntryCode, 'utf-8');

      try {
        const clientOutDir = resolve(root, outDir, 'client');
        const clientConfig: InlineConfig = {
          // CRITICAL: configFile:false prevents loading user's vite.config.ts
          // which would re-instantiate KISS plugins and cause infinite recursion
          configFile: false,
          root,
          logLevel: 'warn',
          build: {
            outDir: clientOutDir,
            emptyOutDir: true,
            rollupOptions: {
              input: {
                client: clientEntryPath,
              },
              output: {
                format: 'esm',
                entryFileNames: 'islands/[name].js',
                chunkFileNames: 'islands/[name]-[hash].js',
                // Split each island into its own chunk for per-page loading
                manualChunks(id: string) {
                  if (id.includes(`/${islandsDir}/`)) {
                    const match = id.match(/\/([^/]+)\.(ts|js)$/);
                    if (match) {
                      return `island-${match[1]}`;
                    }
                  }
                },
              },
            },
          },
          // Pass user's resolve.alias so Island imports from @kissjs/core resolve
          resolve: ctx.userResolveAlias ? { alias: ctx.userResolveAlias } : undefined,
        };

        await viteBuild(clientConfig);
        console.log('[KISS] Client bundle built →', clientOutDir);
      } catch (error) {
        console.error('[KISS] Client build failed:', error);
        throw error;
      }

      console.log('[KISS] Build complete!');
    },
  };
}

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
