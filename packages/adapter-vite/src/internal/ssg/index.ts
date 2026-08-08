/**
 * index.ts - Adapter-agnostic SSG engine (adapter-vite internal).
 *
 * Provides SSG rendering, entry code generation, route scanning,
 * island manifest generation, and HTML post-processing.
 *
 * This engine depends only on protocol types and @openelement/element —
 * never on Vite. The Vite-specific build orchestration (plugin.ts,
 * cli/build-ssg.ts) delegates SSG work to these modules.
 *
 * @module ./index.ts
 */

export type {
  ApiRouteDecl,
  AppShellDecl,
  AppShellPlan,
  BuildArtifacts,
  BuildClientAsset,
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
  PageRouteDecl,
  RendererDecl,
  ResolvedAppShell,
  SpeculationRulesOptions,
  SsgBehaviorOptions,
  SsgPageOutput,
  SsgRenderEvidence,
  SsgRenderOptions,
  SsgRenderSummary,
  SsrAdmissionPlan,
  SsrBundle,
} from '../protocol/ssg.ts';
export { ssgRender } from './ssg-render.ts';

export {
  buildIslandChunkMap,
  buildSpeculationRulesJson,
  injectClientScript,
  injectCspMeta,
  injectSpeculationRules,
  injectViewTransitionMeta,
} from './postprocess.ts';

export { cleanSsrArtifacts, postProcessClientIslandBuild } from './build-postprocess.ts';
export type { BuildContextView } from './build-postprocess.ts';

export { generateCustomElementsPolyfill, generateSsrPolyfillBanner } from './ssr-polyfills.ts';

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

export { buildEntryDescriptor, buildSsrAdmissionPlan } from './entry-descriptor.ts';

export { renderEntry } from './entry-orchestrator.ts';

export {
  extractCustomElementTags,
  generateIslandManifests,
  writeIslandManifests,
} from './island-manifest.ts';

export type {
  IslandLayerMap,
  IslandManifestEntry,
  IslandStrategyMap,
  PageIslandManifest,
} from './island-manifest.ts';

export { generateClientEntry } from './entry-codegen.ts';
export { validateClientIslandEntry } from './entry-generators.ts';

export { fsPathToModuleSpecifier } from './module-specifier.ts';
