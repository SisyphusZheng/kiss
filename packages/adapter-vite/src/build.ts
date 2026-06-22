/**
 * @openelement/adapter-vite - Build plugin
 * openElement Architecture (K·I·S·S): Knowledge · Isolated · Semantic · Static
 * Build produces only static files (K+S), Islands are the only JS (I).
 * API Routes (S - Serverless extension) deploy separately.
 *
 * ADR 0011: closeBundle writes metadata to ctx, then triggers Phase 2/3.
 * ADR 0022: Phase 2/3 extracted into explicit BuildStep classes for
 *           error isolation and future extensibility.
 * No globalThis bridge - ctx stays in createOpenPlugin() closure scope throughout.
 */

import type { Plugin, ResolvedConfig } from 'vite';
import type { ComponentLayer, HydrationStrategy } from '@openelement/protocol/framework';
import type { FrameworkOptions } from '@openelement/protocol/framework';
import type {
  OpenElementBuildContext,
  Phase1Token,
  Phase2Token,
  Phase3Token,
} from './build-context.js';
import { join } from 'node:path';
import process from 'node:process';
import { createLogger } from '@openelement/core/logger';

const log = createLogger('core');

/** A single build step with name, phase number, error isolation, and compile-time ordering. */
export interface BuildStep {
  readonly name: string;
  readonly phase: 1 | 2 | 3;
  run(ctx: OpenElementBuildContext, token: Phase1Token | Phase2Token | Phase3Token): Promise<void>;
}

/** Phase 2: Client island bundle - runs AFTER SSG (ADR 0023) */
class ClientBuildStep implements BuildStep {
  readonly name = 'Client island build';
  readonly phase = 2 as const;

  async run(ctx: OpenElementBuildContext, token: Phase1Token | Phase3Token): Promise<void> {
    ctx.completePhase2(token);
    const { buildClient } = await import('./cli/build-client.js');
    await buildClient(ctx);
  }
}

/** Phase 3: Static site generation - runs BEFORE Phase 2 (ADR 0023) */
class SSGBuildStep implements BuildStep {
  readonly name = 'Static site generation';
  readonly phase = 3 as const;

  async run(ctx: OpenElementBuildContext, token: Phase1Token): Promise<void> {
    ctx.completePhase3(token);
    const { buildSSG } = await import('./cli/build-ssg.js');
    await buildSSG({}, ctx);
  }
}

/** Vite plugin: writes build metadata to ctx, then runs Phase 2 + Phase 3 */
export function buildPlugin(
  options: FrameworkOptions & { allowHeadExtrasScripts?: boolean } = {},
  ctx?: OpenElementBuildContext,
): Plugin {
  const outDir = options.build?.outDir || 'dist';

  let config: ResolvedConfig;
  let base: string = '/';

  return {
    name: 'open:build',

    configResolved(resolvedConfig) {
      config = resolvedConfig;
      base = resolvedConfig.base || '/';
      if (!base.endsWith('/')) base += '/';
    },

    async closeBundle() {
      // Only run in build mode (not dev)
      if (config.command !== 'build') return;

      const root = config.root;

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
      if (ctx) {
        ctx.phase3.root = root;
        ctx.phase3.outDir = outDir;
        ctx.phase3.base = base;
        ctx.phase3.ssrNoExternal =
          ssrNoExternal as (string | { __type: 'RegExp'; source: string; flags: string })[];
        ctx.phase3.routesDir = options.routesDir || 'app/routes';
        ctx.phase3.islandsDir = options.islandsDir || 'app/islands';
        ctx.phase3.componentsDir = options.componentsDir || 'app/components';
        ctx.phase3.middleware = options.middleware || null;
        ctx.phase3.html = options.html || null;
        ctx.phase3.upgradeStrategy = options.island?.upgradeStrategy || 'idle';
        ctx.phase3.viewTransition = options.viewTransition ?? true;
        ctx.phase3.speculation = options.speculation ?? null;
        ctx.phase3.headExtras = options.headExtras || '';
        ctx.phase3.allowHeadExtrasScripts = options.allowHeadExtrasScripts || false;
        ctx.phase3.appShell = options.appShell;
        ctx.phase3.layouts = options.layouts;
      }

      const totalIslands = (ctx.phase1.islandTagNames?.length || 0) +
        (ctx.phase1.packageIslandDecls?.length || 0);

      log.info('Phase 1/3 complete - SSR bundle + metadata written to ctx');

      // ADR 0023: Phase 3 (SSG) runs before Phase 2 (client bundle).
      // SSG only needs Phase 1 - it renders HTML from the SSR bundle.
      // Phase 2 runs last because client chunks have content hashes that
      // don't affect HTML content, and injection is a post-processing step.
      const phase1Token = ctx.completePhase1();
      const steps: BuildStep[] = [];

      // Phase 3: SSG render (always runs - generates HTML pages)
      steps.push(new SSGBuildStep());

      // Phase 2: Client island bundle (only if islands exist)
      if (totalIslands > 0) steps.push(new ClientBuildStep());

      let currentToken: Phase1Token | Phase2Token | Phase3Token = phase1Token;
      for (const step of steps) {
        try {
          log.info(`[${step.phase}/3] ${step.name}...`);
          await step.run(ctx, currentToken);
          // Track the latest completion token
          if (step.phase === 3 && ctx._phaseTokens[3]) {
            currentToken = ctx._phaseTokens[3] as Phase3Token;
          }
          if (step.phase === 2 && ctx._phaseTokens[2]) {
            currentToken = ctx._phaseTokens[2] as Phase2Token;
          }
          log.info(`[${step.phase}/3] ${step.name} - complete`);
        } catch (error) {
          log.error(`[${step.phase}/3] ${step.name} - FAILED:`, error);
          throw error;
        }
      }

      // -- Inject client script (only runs if Phase 2 completed) --
      // Phase 2's manifest.json tells us the client chunk URLs to inject
      // into the already-rendered HTML pages.
      if (ctx._phaseTokens[2]) {
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
                const { buildIslandChunkMap, injectClientScript } = await import(
                  '@openelement/ssg'
                );
                const {
                  generateIslandManifests,
                  writeIslandManifests,
                } = await import('@openelement/ssg');
                const outputDir = join(root, outDir);
                injectClientScript(outputDir, scriptSrc);
                const chunkMap = buildIslandChunkMap(
                  root,
                  outDir,
                  [
                    ...(ctx.phase1.islandTagNames || []),
                    ...(ctx.phase1.packageIslandDecls || []).map((island) => island.tagName),
                  ],
                  base,
                );
                const strategyMap = Object.fromEntries([
                  ...Object.entries(ctx.phase1.islandMeta || {}).map(([tag, meta]) => [
                    tag,
                    meta.hydrate || ctx.phase3.upgradeStrategy || 'idle',
                  ]),
                  ...(ctx.phase1.packageIslandDecls || []).map((island) => [
                    island.tagName,
                    island.hydrate || ctx.phase3.upgradeStrategy || 'idle',
                  ]),
                ]) as Record<string, HydrationStrategy>;
                const layerMap = Object.fromEntries([
                  ...Object.entries(ctx.phase1.islandMeta || {}).map(([tag, meta]) => [
                    tag,
                    meta.hydrate === 'only' || meta.ssr === false
                      ? 'pure-island'
                      : 'dsd-interactive',
                  ]),
                  ...(ctx.phase1.packageIslandDecls || []).map((island) => [
                    island.tagName,
                    island.hydrate === 'only' || island.ssr === false
                      ? 'pure-island'
                      : 'dsd-interactive',
                  ]),
                ]) as Record<string, ComponentLayer>;
                const pageManifests = generateIslandManifests(
                  outputDir,
                  chunkMap,
                  strategyMap,
                  layerMap,
                );
                writeIslandManifests(outputDir, pageManifests);
                log.info(`Client script injected: ${scriptSrc}`);
                break;
              }
            }
          }
        } catch (error) {
          log.warn('Failed to inject client script:', error);
        }
      } else {
        log.info('No Phase 2 - client script injection skipped');
      }

      // -- Clean Phase 1 SSR artifacts from public dist (v0.14.10) --
      // The SSR virtual entry bundle and its source map are build-time only;
      // they must not be deployed to public static hosting.
      try {
        const { readdir, unlink } = await import('node:fs/promises');
        const assetsDir = join(root, outDir, 'assets');
        const entries = await readdir(assetsDir).catch(() => [] as string[]);
        const toDelete = entries.filter(
          (f) =>
            f.startsWith('_virtual_open-hono-entry') ||
            (f.startsWith('src-') && f.endsWith('.js') && !f.includes('client')),
        );
        for (const f of toDelete) {
          const p = join(assetsDir, f);
          await unlink(p).catch(() => {});
          log.info(`Cleaned SSR artifact: ${f}`);
        }
        if (toDelete.length > 0) {
          log.info(`Removed ${toDelete.length} unreferenced SSR artifact(s) from dist/assets/`);
        }
      } catch {
        // Non-critical - assets dir may not exist in some configs
      }

      log.info('Build complete.');
    },
  };
}
