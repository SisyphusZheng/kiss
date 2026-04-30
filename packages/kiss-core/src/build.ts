/**
 * @kissjs/core - Build plugin
 * KISS Architecture (K·I·S·S): Knowledge · Isolated · Semantic · Static
 * Build produces only static files (K+S), Islands are the only JS (I).
 * API Routes (S — Serverless extension) deploy separately.
 *
 * v0.3.0: closeBundle no longer nests viteBuild() + createServer().
 * Instead, it writes .kiss/build-metadata.json and instructs the user
 * to run the CLI build pipeline:
 *
 *   Phase 1: vite build          → SSR bundle + .kiss/build-metadata.json
 *   Phase 2: deno task build:client → dist/client/islands/*.js + manifest
 *   Phase 3: deno task build:ssg    → dist/*.html + post-process
 *
 * This eliminates:
 *   - Watch mode breakage from nested viteBuild() inside Vite hooks
 *   - Cross-instance error stacks that are impossible to debug
 *
 * The old closeBundle logic lives in cli/build-client.ts and cli/build-ssg.ts.
 */

import type { Plugin, ResolvedConfig } from 'vite';
import type { FrameworkOptions } from './types.js';
import type { KissBuildContext } from './build-context.js';
import { join } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';

/**
 * Serialize resolve.alias for JSON storage.
 * Handles both Record<string, string> and Alias[] formats.
 * Alias[] entries with RegExp `find` are converted to a marker object.
 */
function serializeAlias(
  alias: Record<string, string> | import('vite').Alias[] | undefined | null,
): Record<string, string> | null {
  if (!alias) return null;
  // Already a simple object map
  if (!Array.isArray(alias)) return alias;
  // Convert Alias[] to Record<string, string>
  const result: Record<string, string> = {};
  for (const entry of alias) {
    if (typeof entry.find === 'string') {
      result[entry.find] = entry.replacement;
    }
    // Skip RegExp find patterns — they can't be JSON-serialized
  }
  return Object.keys(result).length > 0 ? result : null;
}

/** Vite plugin: writes build metadata for CLI build pipeline */
export function buildPlugin(options: FrameworkOptions = {}, ctx?: KissBuildContext): Plugin {
  const outDir = options.build?.outDir || 'dist';

  let config: ResolvedConfig;
  let base: string = '/';

  return {
    name: 'kiss:build',

    configResolved(resolvedConfig) {
      config = resolvedConfig;
      base = resolvedConfig.base || '/';
      if (!base.endsWith('/')) base += '/';
    },

    // deno-lint-ignore require-await
    async closeBundle() {
      // Only run in build mode (not dev)
      if (config.command !== 'build') return;

      const root = config.root;
      const kissTmpDir = join(root, '.kiss');
      mkdirSync(kissTmpDir, { recursive: true });

      // Write build metadata — this is the bridge to Phase 2/3 CLI scripts
      const metadata = {
        islandTagNames: ctx?.islandTagNames || [],
        islandFiles: ctx?.islandFiles || [],
        packageIslands: ctx?.packageIslands || [],
        root,
        outDir,
        base,
        // Pass user's resolve alias and ssr.noExternal so CLI scripts
        // can replicate the same module resolution
        // Priority: ctx.userResolveAlias (from config hook) → config.resolve.alias (from configResolved)
        resolveAlias: serializeAlias(ctx?.userResolveAlias || config.resolve?.alias),
        ssrNoExternal: (options.ssr?.noExternal || []).map((item) => {
          if (item instanceof RegExp) {
            return { __type: 'RegExp', source: item.source, flags: item.flags };
          }
          return item;
        }),
        islandsDir: options.islandsDir || 'app/islands',
        routesDir: options.routesDir || 'app/routes',
        componentsDir: options.componentsDir || 'app/components',
        middleware: options.middleware || null,
        headExtras: options.headExtras || '',
        html: options.html || {},
        // hydrationStrategy controls WHEN defer-hydration is removed (not HOW).
        // It IS functional — see build-ssg.ts for usage.
        hydrationStrategy: options.island?.hydrationStrategy || 'lazy',
      };
      const metadataPath = join(kissTmpDir, 'build-metadata.json');
      writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');

      const totalIslands = (ctx?.islandTagNames?.length || 0) + (ctx?.packageIslands?.length || 0);

      console.log('[KISS] Phase 1 complete — SSR bundle + metadata written');
      if (totalIslands > 0) {
        console.log(`[KISS] ${totalIslands} island(s) detected — run next phases:`);
        console.log('[KISS]   deno task build:client   (Phase 2: compile island JS)');
        console.log('[KISS]   deno task build:ssg      (Phase 3: render static HTML)');
      } else {
        console.log('[KISS] No islands — static pages only, zero client JS');
        console.log('[KISS] Run: deno task build:ssg   (Phase 3: render static HTML)');
      }
    },
  };
}
