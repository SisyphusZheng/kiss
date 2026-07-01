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
import type { OpenElementBuildContext } from './build-context.ts';
import { join } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import process from 'node:process';
import { createLogger } from '@openelement/core/logger';
import { escapeAttr, escapeHtml } from '@openelement/core';
import { cleanSsrArtifacts, postProcessClientIslandBuild } from '@openelement/ssg';
import { writeRouteManifest } from './route-manifest.ts';

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

      // SPA mode: skip Phase 3 SSG, generate SPA shell + route manifest
      if (ctx.options.mode === 'spa') {
        const root = ctx.phase3.root || process.cwd();
        const outDirName = ctx.phase3.outDir || 'dist';
        const absOutDir = join(root, outDirName);
        const htmlLang = escapeAttr(ctx.phase3.html?.lang ?? 'en');
        const htmlTitle = escapeHtml(ctx.phase3.html?.title ?? 'openElement App');

        const indexPath = join(absOutDir, 'index.html');

        // Generate a fallback SPA shell only when Vite did not emit an HTML
        // entry. Apps with their own index.html (for example desktop shells
        // with a custom client entry) keep the real Vite output.
        const html = `<!DOCTYPE html>
<html lang="${htmlLang}">
<head>
  <meta charset="UTF-8">
  <title>${htmlTitle}</title>
</head>
<body>
  <div id="root"></div>
  <script type="module">
    console.info('[openElement] SPA fallback shell loaded. Provide an app index.html for a bundled client entry.');
  </script>
</body>
</html>`;

        await mkdir(absOutDir, { recursive: true });
        try {
          await writeFile(indexPath, html, { encoding: 'utf-8', flag: 'wx' });
          log.info('SPA shell written to index.html');
        } catch (error) {
          if (
            error instanceof Error &&
            (error as Error & { code?: string }).code === 'EEXIST'
          ) {
            log.info('SPA shell preserved from Vite output');
          } else {
            throw error;
          }
        }

        // Generate route manifest for client-side routing
        const absRoutesDir = join(root, ctx.phase3.routesDir || 'app/routes');
        const routeCount = await writeRouteManifest({
          routesDir: absRoutesDir,
          outDir: absOutDir,
        });
        log.info(`Route manifest written (${routeCount} page route(s))`);

        // Phase 2: Client island bundle (only if islands exist)
        if (totalIslands > 0) {
          log.info('[2/3] Client island build...');
          try {
            const { buildClient } = await import('./cli/build-client.ts');
            await buildClient(ctx);
            ctx.markComplete(2);
            log.info('[2/3] Client island build - complete');
          } catch (error) {
            log.error(`[2/3] Client island build - FAILED: ${error}`);
            throw error;
          }
        }

        log.info('SPA build complete.');
        return;
      }

      log.info('[3/3] Static site generation...');
      try {
        const { buildSSG } = await import('./cli/build-ssg.ts');
        await buildSSG({}, ctx);
        ctx.markComplete(3);
        log.info('[3/3] Static site generation - complete');
      } catch (error) {
        log.error(`[3/3] Static site generation - FAILED: ${error}`);
        throw error;
      }

      // Phase 2: Client island bundle (only if islands exist)
      if (totalIslands > 0) {
        log.info('[2/3] Client island build...');
        try {
          const { buildClient } = await import('./cli/build-client.ts');
          await buildClient(ctx);
          ctx.markComplete(2);
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
