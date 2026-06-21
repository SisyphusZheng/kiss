/**
 * @openelement/adapter-vite - Vite build orchestration adapter.
 *
 * Provides the `openPipeline()` Vite plugin that handles:
 * - Route scanning and virtual Hono entry generation
 * - Dev server integration via @hono/vite-dev-server
 * - Island marking transform
 * - SSG build pipeline (Phase 1/2/3)
 * - Core subpath resolution (ADR 0016)
 *
 * Runtime code (renderDsd, defineIsland, escapeHtml, etc.) lives in @openelement/core.
 * This package only contains Vite-specific build orchestration.
 *
 * For the unified openElement() entry, use @openelement/app/vite instead.
 *
 * v0.22 (SOP-004): Decomposed into focused modules:
 *   head-injection.ts      - HTML fragment validation & serialization
 *   plugin.ts              - Internal plugin factory (used by openPipeline)
 *   subpath-resolver.ts    - JSR remote resolution (ADR 0016)
 *   generated-data-resolver.ts - Generated app data namespace resolver
 *
 * This file is now a pure re-export hub (~60 lines).
 */

// Primary public API
import type { Plugin } from 'vite';
import type { FrameworkOptions } from '@openelement/core';
import { createOpenPlugin } from './plugin.js';

export interface OpenPipelineConfig {
  routes?: { dir?: string };
  i18n?: { locales: string[]; defaultLocale?: string };
  output?: { outDir?: string; cleanUrls?: boolean };
  island?: { dir?: string; upgradeStrategy?: string };
  viewTransition?: boolean;
  headExtras?: string;
}

export function openPipeline(config: OpenPipelineConfig = {}): Plugin[] {
  const options: FrameworkOptions = {
    routesDir: config.routes?.dir || 'app/routes',
    islandsDir: config.island?.dir || 'app/islands',
    componentsDir: 'app/components',
    viewTransition: config.viewTransition ?? true,
    headExtras: config.headExtras,
    island: config.island as FrameworkOptions['island'],
    build: config.output as FrameworkOptions['build'],
  };
  return createOpenPlugin(options);
}

export type { FrameworkOptions };

// Build context
export { OpenElementBuildContext } from './build-context.js';

// Build manifest
export type { ArtifactInfo, BuildManifest } from './build-manifest.js';
export { printBuildManifest, scanClientBuild, scanSSGOutput } from './build-manifest.js';

// SSG post-processing & island manifests (adapter-vite internal build helpers)
export {
  buildIslandChunkMap,
  buildSpeculationRulesJson,
  extractCustomElementTags,
  generateIslandManifests,
  injectClientScript,
  injectCspMeta,
  injectDsdPolyfill,
  injectSpeculationRules,
  injectViewTransitionMeta,
  insertAfterHead,
  type IslandLayerMap,
  type IslandManifestEntry,
  type IslandStrategyMap,
  type PageIslandManifest,
  type SpeculationRulesOptions,
  writeIslandManifests,
} from '@openelement/ssg';

// External resolver types used by the adapter-vite build pipeline
export type { ExternalManifest } from '@openelement/ssg';

// Subpath resolver (public constants)
export { CORE_SUBPATHS, VIRTUAL_CORE_PREFIX } from './subpath-resolver.js';

// Head injection (public helpers)
export { assertNoScriptTags, buildHeadExtras, validateSafeUrl } from './head-injection.js';
export type { HeadExtrasResult } from './head-injection.js';

// MDX integration
export { mdxPlugin, openMdx } from './plugin-mdx.js';
export type { OpenMdxPluginOptions } from './plugin-mdx.js';

// Nitro runtime proof boundary
export { createOpenElementNitroHandler } from './nitro-mount.js';
export type {
  NitroLikeRequestEvent,
  NitroLikeResponse,
  OpenElementNitroMountOptions,
} from './nitro-mount.js';

// Default export
export { openPipeline as default };
