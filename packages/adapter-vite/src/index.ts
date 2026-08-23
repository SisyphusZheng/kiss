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
 * Runtime code (renderDsd, defineIsland, escapeHtml, etc.) lives in @openelement/element.
 * This package only contains Vite-specific build orchestration.
 *
 * For the unified openElement() entry, use @openelement/adapter-vite.
 *
 * v0.22 (SOP-004): Decomposed into focused modules:
 *   head-injection.ts      - HTML fragment validation & serialization
 *   plugin.ts              - Internal plugin factory (used by openPipeline)
 *   generated-data-resolver.ts - Generated app data namespace resolver
 *
 * This file is now a re-export hub with the openPipeline()/buildApp() entry
 * points (~100 lines).
 */

// Primary public API
import { build as viteBuild, type InlineConfig, type Plugin } from 'vite';
import type { FrameworkOptions } from './internal/protocol/framework.ts';
import { createOpenPlugin } from './plugin.ts';
import {
  DEFAULT_COMPONENTS_DIR,
  DEFAULT_ISLANDS_DIR,
  DEFAULT_ROUTES_DIR,
} from './internal/paths.ts';

export interface OpenPipelineConfig {
  /** Build/dev mode. 'ssg' (default) enables SSR dev server + static generation. 'spa' produces a client-only app (no SSR). */
  mode?: 'ssg' | 'spa';
  routes?: { dir?: string };
  output?: { outDir?: string };
  island?: { dir?: string; upgradeStrategy?: string };
  viewTransition?: boolean;
  headExtras?: string;
}

export function openPipeline(config: OpenPipelineConfig = {}): Plugin[] {
  const options: FrameworkOptions = {
    mode: config.mode,
    routesDir: config.routes?.dir || DEFAULT_ROUTES_DIR,
    islandsDir: config.island?.dir || DEFAULT_ISLANDS_DIR,
    componentsDir: DEFAULT_COMPONENTS_DIR,
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
  injectSpeculationRules,
  injectViewTransitionMeta,
  writeIslandManifests,
} from './internal/ssg/index.ts';

// Protocol type re-exports
export type { SpeculationRulesOptions, SsgBehaviorOptions } from './internal/protocol/ssg.ts';

// Head injection (public helpers)
export { buildHeadExtras } from './head-injection.ts';
export type { HeadExtrasResult } from './head-injection.ts';

// MDX integration
export { mdxPlugin } from './plugin-mdx.ts';
export type { OpenMdxPluginOptions } from './plugin-mdx.ts';

// Content/build utilities owned by the adapter implementation.
export { generateSitemap } from './internal/content/sitemap/generator.ts';
export { createCollectionPlugin } from './internal/content/collection/plugin.ts';
export {
  loadCollectionData,
  writeCollectionDataModule,
} from './internal/content/collection/data.ts';
export type {
  CollectionEntry,
  CollectionFieldDefinition,
  CollectionFieldType,
  CollectionOptions,
  CollectionSchema,
  CollectionSchemaContext,
  CollectionSchemaResult,
} from './internal/content/collection/types.ts';

// Default export
export { openPipeline as default };
