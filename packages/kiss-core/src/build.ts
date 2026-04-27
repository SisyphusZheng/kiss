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
import type { FrameworkOptions, PackageIslandMeta } from './types.js';
import type { KissBuildContext } from './build-context.js';
import { build as viteBuild, type InlineConfig } from 'vite';
import { join, resolve } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import { generateClientEntry, type ClientIslandEntry } from './entry-generators.js';

// Re-export SSG post-processing functions (pure fs operations, no Vite dependency)
export { buildIslandChunkMap, rewriteHtmlFiles } from './ssg-postprocess.js';

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
      const localIslands = ctx?.islandTagNames || [];
      const packageIslands = ctx?.packageIslands || [];

      // KISS Architecture: Only client build (Islands). No SSR runtime bundle.
      // If no islands found, skip client build entirely (S constraint: zero JS).
      if (localIslands.length === 0 && packageIslands.length === 0) {
        console.log('[KISS] No islands found, skipping client build');
        console.log('[KISS] KISS Architecture: Static pages only, zero client JS');
        console.log('[KISS] Build complete!');
        return;
      }

      const totalIslands = localIslands.length + packageIslands.length;
      console.log(`[KISS] Building client bundle for ${totalIslands} island(s)...`);
      if (localIslands.length > 0) {
        console.log(`  - Local islands: ${localIslands.length}`);
      }
      if (packageIslands.length > 0) {
        console.log(`  - Package islands: ${packageIslands.length}`);
      }

      // Auto-generate client entry from Island list
      const kissTmpDir = join(root, '.kiss');
      mkdirSync(kissTmpDir, { recursive: true });
      const clientEntryPath = join(kissTmpDir, '.kiss-client-entry.ts');

      // Build unified island entry list (local + package)
      const islandEntries: ClientIslandEntry[] = [
        ...localIslands.map((tagName) => ({
          tagName,
          modulePath: resolve(root, `${islandsDir}/${tagName}.ts`).replace(/\\/g, '/'),
        })),
        ...packageIslands.map((island) => ({
          tagName: island.tagName,
          modulePath: island.modulePath,
        })),
      ];

      const clientEntryCode = generateClientEntry(islandEntries);
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
                // Generate manifest for SSG post-processing (v0.3.0)
                // Replaces string-grep approach in ssg-postprocess.ts
                manifest: true,
                // Split each island into its own chunk for per-page loading
                manualChunks(id: string) {
                  if (id.includes(`/${islandsDir}/`)) {
                    const match = id.match(/\/([^/]+)\.(ts|js)$/);
                    if (match) {
                      return `island-${match[1]}`;
                    }
                  }
                  // Package islands - split by modulePath
                  for (const island of packageIslands) {
                    if (id.includes(island.modulePath)) {
                      return `island-${island.tagName}`;
                    }
                  }
                },
              },
            },
          },
          // Pass user's resolve.alias so Island imports from @kissjs/core resolve
          resolve: ctx?.userResolveAlias ? { alias: ctx.userResolveAlias } : undefined,
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
