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
 * For the unified openElement() entry, use @openelement/adapter-vite.
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
import { build as viteBuild, type InlineConfig, type Plugin } from 'vite';
import type { FrameworkOptions } from './internal/protocol/framework.ts';
import { createOpenPlugin } from './plugin.ts';

export interface OpenPipelineConfig {
  /** Build/dev mode. 'ssg' (default) enables SSR dev server + static generation. 'spa' produces a client-only app (no SSR). */
  mode?: 'ssg' | 'spa';
  routes?: { dir?: string };
  i18n?: { locales: string[]; defaultLocale?: string };
  output?: { outDir?: string };
  island?: { dir?: string; upgradeStrategy?: string };
  viewTransition?: boolean;
  headExtras?: string;
}

export function openPipeline(config: OpenPipelineConfig = {}): Plugin[] {
  const options: FrameworkOptions = {
    mode: config.mode,
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

/**
 * Build an OpenElement application through the supported adapter boundary.
 *
 * Consumers configure the adapter in `vite.config.ts`; this function owns the
 * invocation so CLI callers do not need to know the adapter's internal build
 * phases or Vite plugin ordering.
 */
export async function buildApp(config: InlineConfig = {}): Promise<unknown> {
  return await viteBuild({ configLoader: 'native', ...config });
}

export { openElement, type OpenElementOptions } from './app-vite.ts';

export type { FrameworkOptions };

// Build context
export { OpenElementBuildContext } from './build-context.ts';

// Build manifest
export type { ArtifactInfo, BuildManifest } from './build-manifest.ts';
export { printBuildManifest, scanClientBuild, scanSSGOutput } from './build-manifest.ts';

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
  writeIslandManifests,
} from './internal/ssg/index.ts';

// Protocol type re-exports
export type { SpeculationRulesOptions } from './internal/protocol/ssg.ts';

// External resolver types used by the adapter-vite build pipeline
export type { ExternalManifest } from './internal/protocol/ssg.ts';

// Subpath resolver (public constants)
export { CORE_SUBPATHS, VIRTUAL_CORE_PREFIX } from './subpath-resolver.ts';

// Head injection (public helpers)
export { assertNoScriptTags, buildHeadExtras, validateSafeUrl } from './head-injection.ts';
export type { HeadExtrasResult } from './head-injection.ts';

// MDX integration
export { mdxPlugin, openMdx } from './plugin-mdx.ts';
export type { OpenMdxPluginOptions } from './plugin-mdx.ts';

// Nitro deploy adapter compatibility export.
// Canonical alpha.6 import: @openelement/adapter-vite/nitro-mount.
// Kept on the root surface during alpha so existing proof consumers do not break.
export { createOpenElementNitroHandler } from './nitro-mount.ts';
export type {
  NitroLikeRequestEvent,
  NitroLikeResponse,
  OpenElementNitroMountOptions,
} from './nitro-mount.ts';

// Default export
export { openPipeline as default };
