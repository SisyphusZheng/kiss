/**
 * @openelement/adapter-vite - Build plugin
 * openElement Architecture (K·I·S·S): Knowledge · Isolated · Semantic · Static
 * Build produces only static files (K+S), Islands are the only JS (I).
 * API Routes (S - Serverless extension) deploy separately.
 *
 * ADR 0011: closeBundle writes metadata to ctx, then triggers Phase 2/3.
 * No globalThis bridge - ctx stays in createOpenPlugin() closure scope throughout.
 */

import type { Plugin, ResolvedConfig } from 'vite';
import type { FrameworkOptions } from '@openelement/protocol/framework';
import type { OpenElementBuildContext } from './build-context.js';
import { join } from 'node:path';
import process from 'node:process';
import { createLogger } from '@openelement/core/logger';
import { cleanSsrArtifacts, postProcessClientIslandBuild } from '@openelement/ssg';

const log = createLogger('core');

/** Vite plugin: writes build metadata to ctx, then runs Phase 2 + Phase 3 */
export function buildPlugin(
  options: FrameworkOptions & { allowHeadExtrasScripts?: boolean } = {},
  ctx?: OpenElementBuildContext,
): Plugin {
  let config: ResolvedConfig;

  return {
    name: 'open:build',

    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },

    async closeBundle() {
      // Only run in build mode (not dev)
      if (config.command !== 'build') return;

      if (!ctx) {
        log.warn('open:build skipped Phase 2/3 because no OpenElementBuildContext was provided.');
        return;
      }

      // Serialize SSR noExternal patterns (RegExp -> marker objects)
      const ssrNoExternal = ((options.ssr?.noExternal ||
        (config.ssr as { noExternal?: (string | RegExp)[] } | undefined)?.noExternal) || [])
        .map((item) => {
          if (item instanceof RegExp) {
            return { __type: 'RegExp', source: item.source, flags: item.flags };
          }
          return item;
        });

      // --- Write to OpenElementBuildContext ----------
      ctx.populatePhase3(
        options,
        config,
        ssrNoExternal as (string | { __type: 'RegExp'; source: string; flags: string })[],
      );

      const totalIslands = (ctx.phase1.islandTagNames?.length || 0) +
        (ctx.phase1.packageIslandDecls?.length || 0);

      log.info('Phase 1/3 complete - SSR bundle + metadata written to ctx');

      // ADR 0023: Phase 3 (SSG) runs before Phase 2 (client bundle).
      // SSG only needs Phase 1 - it renders HTML from the SSR bundle.
      // Phase 2 runs last because client chunks have content hashes that
      // don't affect HTML content, and injection is a post-processing step.
      ctx.markComplete(1);

      ctx.markComplete(3);
      log.info('[3/3] Static site generation...');
      try {
        const { buildSSG } = await import('./cli/build-ssg.js');
        await buildSSG({}, ctx);
        log.info('[3/3] Static site generation - complete');
      } catch (error) {
        log.error(`[3/3] Static site generation - FAILED: ${error}`);
        throw error;
      }

      // Phase 2: Client island bundle (only if islands exist)
      if (totalIslands > 0) {
        ctx.markComplete(2);
        log.info('[2/3] Client island build...');
        try {
          const { buildClient } = await import('./cli/build-client.js');
          await buildClient(ctx);
          log.info('[2/3] Client island build - complete');
        } catch (error) {
          log.error(`[2/3] Client island build - FAILED: ${error}`);
          throw error;
        }
      }

      // -- Inject client script (only runs if Phase 2 completed) --
      // Phase 2's manifest.json tells us the client chunk URLs to inject
      // into the already-rendered HTML pages.
      if (ctx.isComplete(2)) {
        try {
          const outDir = ctx.phase3.outDir || 'dist';
          const root = ctx.phase3.root || process.cwd();
          const clientManifestPath = join(root, outDir, 'client', '.vite', 'manifest.json');
          const { existsSync, readFileSync } = await import('node:fs');
          if (existsSync(clientManifestPath)) {
            const manifestRaw = readFileSync(clientManifestPath, 'utf-8');
            const manifest = JSON.parse(manifestRaw);
            for (const [src, entry] of Object.entries(manifest) as [string, { file?: string }][]) {
              if (
                (src.includes('open-client-entry') || src.includes('virtual:open-client')) &&
                entry.file
              ) {
                const base = ctx.phase3.base || '/';
                const scriptSrc = `${base}client/${entry.file}`;
                await postProcessClientIslandBuild(ctx, scriptSrc);
                log.info(`Client script injected: ${scriptSrc}`);
                break;
              }
            }
          }
        } catch (error) {
          log.warn(`Failed to inject client script: ${error}`);
        }
      } else {
        log.info('No Phase 2 - client script injection skipped');
      }

      // -- Clean Phase 1 SSR artifacts from public dist (v0.14.10) --
      try {
        await cleanSsrArtifacts(ctx);
      } catch (error) {
        log.warn(`Failed to clean SSR artifacts: ${error}`);
      }

      log.info('Build complete.');
    },
  };
}
