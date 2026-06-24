/**
 * @openelement/ssg - Adapter-agnostic SSG build post-processing.
 *
 * Orchestrates client-script injection, island chunk/strategy/layer map
 * construction, and SSR artifact cleanup. This module has zero Vite
 * dependency and only reads/writes files.
 */

import { join } from 'node:path';
import { cwd } from 'node:process';
import { readdir, unlink } from 'node:fs/promises';
import type { ComponentLayer, HydrationStrategy } from '@openelement/protocol/framework';
import type { IslandDecl } from '@openelement/protocol/ssg';
import { createLogger } from '@openelement/core/logger';
import { buildIslandChunkMap, injectClientScript } from './postprocess.ts';
import { generateIslandManifests, writeIslandManifests } from './island-manifest.ts';

const log = createLogger('core');

/** Narrow view of OpenElementBuildContext used by the SSG post-processor. */
export interface BuildContextView {
  phase3: {
    root: string;
    outDir: string;
    base: string;
    upgradeStrategy: HydrationStrategy;
  };
  phase1: {
    islandTagNames: string[];
    packageIslandDecls: IslandDecl[];
    islandMeta: Record<string, Partial<IslandDecl>>;
  };
}

/**
 * Inject the island client script and generate per-page island manifests.
 * Must only run after Phase 2 (client island build) has completed.
 */
export async function postProcessClientIslandBuild(
  ctx: BuildContextView,
  scriptSrc: string,
): Promise<void> {
  const root = ctx.phase3.root || cwd();
  const outDir = ctx.phase3.outDir || 'dist';
  const base = ctx.phase3.base || '/';
  const outputDir = join(root, outDir);

  injectClientScript(outputDir, scriptSrc);

  const islandTagNames = [
    ...(ctx.phase1.islandTagNames || []),
    ...(ctx.phase1.packageIslandDecls || []).map((island) => island.tagName),
  ];

  const chunkMap = buildIslandChunkMap(root, outDir, islandTagNames, base);

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
      meta.hydrate === 'only' || meta.ssr === false ? 'pure-island' : 'dsd-interactive',
    ]),
    ...(ctx.phase1.packageIslandDecls || []).map((island) => [
      island.tagName,
      island.hydrate === 'only' || island.ssr === false ? 'pure-island' : 'dsd-interactive',
    ]),
  ]) as Record<string, ComponentLayer>;

  const pageManifests = generateIslandManifests(outputDir, chunkMap, strategyMap, layerMap);
  await writeIslandManifests(outputDir, pageManifests);
}

/**
 * Clean Phase 1 SSR artifacts from the public dist directory.
 * The SSR virtual entry bundle and its source map are build-time only
 * and must not be deployed to static hosting.
 */
export async function cleanSsrArtifacts(ctx: BuildContextView): Promise<void> {
  const root = ctx.phase3.root || cwd();
  const outDir = ctx.phase3.outDir || 'dist';

  try {
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
}
