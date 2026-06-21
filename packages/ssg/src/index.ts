/**
 * @openelement/ssg - Adapter-agnostic SSG engine.
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
 * @module @openelement/ssg
 */

export type {
  ClientIslandEntry,
  ExternalManifest,
  ParallelRenderOptions,
  ParallelRenderPageOutput,
  ParallelRenderResult,
  SsgIslandDeclForReport,
  SsgPageInput,
  SsgRenderOptions,
} from './ssg-contracts.ts';
export { resolveDynamicRoutePath, ssgRender } from './ssg-render.ts';
export type { SsgPageOutput, SsgRenderEvidence, SsrBundle } from './ssg-render.ts';
export {
  buildIslandChunkMap,
  buildSpeculationRulesJson,
  injectClientScript,
  injectCspMeta,
  injectDsdPolyfill,
  injectSpeculationRules,
  injectViewTransitionMeta,
  insertAfterHead,
} from './postprocess.ts';
export type { SpeculationRulesOptions } from './postprocess.ts';

export { generateSsrPolyfillBanner } from './ssr-polyfills.ts';
export {
  buildFallbackManifest,
  completeExternalSpecifiers,
  extractExternalSpecifiers,
  resolveExternalManifest,
  resolvePackageExports,
  walkExports,
} from './external-resolver.ts';

export {
  detectAndClassifyCemPackages,
  fileToTagName,
  scanCemManifests,
  scanIslandMeta,
  scanIslands,
  scanPackageManifests,
  scanRoutes,
} from './route-scanner.ts';

export { generateRouteTypes } from './route-type-generator.ts';

export { buildEntryDescriptor, buildSsrAdmissionPlan } from './entry-renderer.ts';
export type {
  ApiRouteDecl,
  AppShellDecl,
  AppShellPlan,
  CorsOriginConfig,
  CspConfig,
  DocumentConfig,
  EntryDescriptor,
  ImportDecl,
  IslandDecl,
  MiddlewareDecl,
  MiddlewareScopeDecl,
  PageRouteDecl,
  RendererDecl,
  ResolvedAppShell,
  RouteDecl,
  SsrAdmissionPlan,
} from './routes.ts';

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
