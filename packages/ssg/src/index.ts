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
  ApiRouteDecl,
  AppShellDecl,
  AppShellPlan,
  ClientIslandEntry,
  CorsOriginConfig,
  CspConfig,
  DocumentConfig,
  EntryDescriptor,
  ExternalManifest,
  ImportDecl,
  IslandDecl,
  MiddlewareDecl,
  MiddlewareScopeDecl,
  PageRouteDecl,
  ParallelRenderOptions,
  ParallelRenderPageOutput,
  ParallelRenderResult,
  RendererDecl,
  ResolvedAppShell,
  RouteDecl,
  SpeculationRulesOptions,
  SsgIslandDeclForReport,
  SsgPageInput,
  SsgPageOutput,
  SsgRenderEvidence,
  SsgRenderOptions,
  SsrAdmissionPlan,
  SsrBundle,
} from '@openelement/protocol/ssg';
export { resolveDynamicRoutePath, ssgRender } from './ssg-render.ts';

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
