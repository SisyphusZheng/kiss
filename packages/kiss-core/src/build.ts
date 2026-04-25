/**
 * @kissjs/core - Build plugin
 * PIA (Pre-rendered Islands Architecture): build produces only static files.
 *
 * What this plugin does:
 * - Client build: produces minimal JS — only island components + hydration
 * - Zero-JS pages output nothing to client (Level 0 progressive enhancement)
 * - SSG is handled by the separate kiss:ssg plugin
 * - NO SSR runtime bundle (PIA rejects runtime server)
 *
 * The build happens in `closeBundle` so Vite's own build runs first,
 * then we kick off the secondary client build.
 */

import type { Plugin, ResolvedConfig } from 'vite';
import type { FrameworkOptions } from './types.js';
import type { KissBuildContext } from './build-context.js';
import { build as viteBuild, type InlineConfig } from 'vite';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';

/** Vite plugin for client-only production build (Islands) */
export function buildPlugin(options: FrameworkOptions = {}, ctx?: KissBuildContext): Plugin {
  const islandsDir = options.islandsDir || 'app/islands';
  const outDir = options.build?.outDir || 'dist';

  let config: ResolvedConfig;

  return {
    name: 'kiss:build',

    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },

    async closeBundle() {
      // Prevent infinite recursion — viteBuild() spawns new plugin instances.
      // Use KissBuildContext flag exclusively (no module-level globals).
      if (ctx?.clientBuildTriggered) return;
      if (ctx) ctx.clientBuildTriggered = true;

      // Only run in build mode (not dev)
      if (config.command !== 'build') return;

      const root = config.root;

      // PIA: Only client build (Islands). No SSR runtime bundle.
      const clientEntry = resolve(root, 'app/client.ts');

      if (existsSync(clientEntry)) {
        console.log('[KISS] Building client bundle (islands)...');
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
                      const match = id.match(/\/([^/]+)\.(ts|js)$/);
                      if (match) {
                        return `island-${match[1]}`;
                      }
                    }
                  },
                },
              },
            },
          };

          await viteBuild(clientConfig);
          console.log('[KISS] Client bundle built →', resolve(root, outDir, 'client'));
        } catch (error) {
          console.error('[KISS] Client build failed:', error);
          throw error;
        }
      } else {
        console.log('[KISS] No client entry found, skipping client build');
        console.log('[KISS] PIA: Static pages only, zero client JS');
      }

      console.log('[KISS] Build complete!');
    },
  };
}
