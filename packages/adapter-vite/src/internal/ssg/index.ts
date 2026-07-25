/**
 * ./index.ts - Adapter-agnostic SSG engine.
 *
 * Provides parallel SSG rendering, entry code generation, route scanning,
 * island manifest generation, and HTML post-processing.
 *
 * This engine depends on protocol, core, router, and content — never on
 * Vite or adapter-vite. Build adapters (e.g. adapter-vite) delegate SSG
 * orchestration to this package.
 *
 * Architecture:
 *   - Sequential rendering (baseline): render pages one at a time
 *   - Parallel rendering (pool-based): render pages with concurrency limit
 *
 * @module ./index.ts
 */

export type {
  ApiRouteDecl,
  AppShellDecl,
  AppShellPlan,
  BuildArtifacts,
  BuildClientAsset,
  BuildContentOptions,
  BuildI18nOptions,
  BuildIslandInput,
  BuildManifestArtifact,
  BuildOutputOptions,
  BuildPackageIslandOptions,
  BuildPageArtifact,
  BuildPlan,
  BuildRouteInput,
  ClientIslandEntry,
  CorsOriginConfig,
  CspConfig,
  DocumentConfig,
  EntryDescriptor,
  ImportDecl,
  IslandDecl,
  MiddlewareDecl,
  MiddlewareScopeDecl,
  OpenElementBuild,
  OpenElementExportMap,
  OpenElementPackageExports,
  OpenElementPackageResolver,
  PackageResolverInput,
  PackageResolverResult,
  PageRouteDecl,
  ParallelRenderOptions,
  ParallelRenderPageOutput,
  ParallelRenderResult,
  RendererDecl,
  ResolvedAppShell,
  ResolvedSpecifier,
  SpeculationRulesOptions,
  SsgBehaviorOptions,
  SsgPageInput,
  SsgPageOutput,
  SsgRenderEvidence,
  SsgRenderOptions,
  SsgRenderSummary,
  SsrAdmissionPlan,
  SsrBundle,
} from '../protocol/ssg.ts';
export { resolveDynamicRoutePath, ssgRender } from './ssg-render.ts';

export {
  buildIslandChunkMap,
  buildSpeculationRulesJson,
  injectClientScript,
  injectCspMeta,
  injectSpeculationRules,
  injectViewTransitionMeta,
  insertAfterHead,
} from './postprocess.ts';

export { cleanSsrArtifacts, postProcessClientIslandBuild } from './build-postprocess.ts';
export type { BuildContextView } from './build-postprocess.ts';

export { generateSsrPolyfillBanner } from './ssr-polyfills.ts';

export {
  detectAndClassifyCemPackages,
  fileToTagName,
  parseRouteFilePath,
  resolveIslandHydrate,
  resolveIslandSsrDsd,
  scanCemManifests,
  scanIslandMeta,
  scanIslands,
  scanPackageManifests,
  scanRoutes,
} from './route-scanner.ts';

export { classifyCemManifest, parseCem } from './cem-compat.ts';

export { generateRouteTypes } from './route-type-generator.ts';

export { buildEntryDescriptor, buildSsrAdmissionPlan } from './entry-renderer.ts';

export { generateHonoEntryCode, renderEntry } from './entry-renderer.ts';
export type { HonoEntryOptions } from './entry-renderer.ts';

export {
  extractCustomElementTags,
  generateIslandManifests,
  writeIslandManifests,
} from './island-manifest.ts';

export { stableHash } from './ssg-helpers.ts';
export type {
  IslandLayerMap,
  IslandManifestEntry,
  IslandStrategyMap,
  PageIslandManifest,
} from './island-manifest.ts';

export { generateClientEntry, validateClientIslandEntry } from './entry-generators.ts';

export { fsPathToModuleSpecifier } from './module-specifier.ts';
