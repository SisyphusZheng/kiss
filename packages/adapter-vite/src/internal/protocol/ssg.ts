/**
 * ./index.ts - SSG engine contracts.
 *
 * Runtime-free data contracts consumed by the SSG engine and build adapters.
 * These types keep the SSG engine adapter-agnostic.
 */

import type { CompatibilityClassification, HydrationStrategy } from './framework.ts';
import type { HydrationHint, RenderError, SsrAdmissionDecision } from './render.ts';
import type { OpenElementPackageManifest } from './manifest.ts';

// ─── Concurrency types ───────────────────────────────────────

/** A single page to be rendered during SSG. */
export interface SsgPageInput {
  /** Route path (e.g. '/about', '/blog/hello') */
  path: string;
  /** Route params (e.g. { slug: 'hello' }) */
  params?: Record<string, string>;
}

/** Result of rendering a single page through the concurrency helper. */
export interface ParallelRenderPageOutput {
  path: string;
  html: string;
  durationMs: number;
  error?: string;
}

/** Options for parallel SSG rendering. */
export interface ParallelRenderOptions {
  /** Pages to render. */
  pages: SsgPageInput[];
  /** Render function called for each page. */
  renderPage: (page: SsgPageInput) => Promise<string>;
  /** Number of concurrent workers. Defaults to hardware concurrency or 4. */
  concurrency?: number;
}

/** Summary of a parallel render run. */
export interface ParallelRenderResult {
  pages: ParallelRenderPageOutput[];
  totalDurationMs: number;
  successCount: number;
  errorCount: number;
}

// ─── SSG render pipeline options ─────────────────────────────

/** Options passed to the shared SSG render pipeline. */
export interface SsgRenderOptions {
  root: string;
  outDir: string;
  base?: string;
  headExtras?: string;
  html?: { lang?: string; title?: string };
  middleware?: {
    csp?: { policy?: string; reportOnly?: boolean; nonce?: boolean };
  };
  upgradeStrategy?: string;
  viewTransition?: boolean;
  speculation?: boolean | Record<string, unknown>;
  islandTagNames?: string[];
  routesDir?: string;
}

// ─── External resolver types ─────────────────────────────────

/** Manifest produced by Deno dependency pre-resolution. */
export interface ExternalManifest {
  /** Complete list of bare specifiers to mark as external. */
  specifiers: string[];
  /** Redirect map (bare specifier to npm: URL) for importmap generation. */
  importMap: Record<string, string>;
  /** ISO timestamp of generation. */
  generatedAt: string;
  /** SHA-256 hash prefix of deno.lock at time of generation. */
  lockHash: string;
}

// ─── Entry generator types ───────────────────────────────────

/** Client island entry shape passed to entry generator. */
export interface ClientIslandEntry {
  tagName: string;
  modulePath: string;
  isPackage?: boolean;
  strategy: HydrationStrategy;
  strategySource?: 'default' | 'manifest' | 'component' | 'route';
  ssr?: boolean;
  dsd?: boolean;
  reason?: string;
}

// ─── Route contracts (from routes.ts) ─────────────────────────

export interface ImportDecl {
  from: string;
  names: string[];
  alias?: string;
}

export type CorsOriginConfig = string | string[] | { type: 'function'; body: string };

export interface CspConfig {
  policy?: string;
  nonce?: boolean;
  reportOnly?: boolean;
}

export interface MiddlewareDecl {
  kind: 'requestId' | 'logger' | 'cors' | 'securityHeaders' | 'csp';
  comment?: string;
  config?: {
    corsOrigin?: CorsOriginConfig;
    csp?: CspConfig;
  };
}

export interface ApiRouteDecl {
  kind: 'api';
  path: string;
  varName: string;
  filePath: string;
  importPath: string;
}

export interface PageRouteDecl {
  kind: 'page';
  path: string;
  varName: string;
  filePath: string;
  defaultTagName: string;
  tagName: string;
  importPath: string;
  isDynamic?: boolean;
  paramNames?: string[];
}

export interface IslandDecl {
  tagName: string;
  modulePath: string;
  isPackage?: boolean;
  hydrate?: HydrationStrategy;
  ssr?: boolean;
  dsd?: boolean;
  authoring?: 'basic-element' | 'third-party-wc';
  source?: 'local' | 'package' | 'nested';
  reason?: string;
}

export interface SsrAdmissionPlan {
  renderableTags: string[];
  clientOnlyTags: string[];
  rejectedTags: string[];
  reasons: Record<string, string>;
  decisions: SsrAdmissionDecision[];
  cemClassifications?: CompatibilityClassification[];
}

export interface RendererDecl {
  varName: string;
  scope: string;
  importPath: string;
  depth: number;
}

export interface MiddlewareScopeDecl {
  varName: string;
  scope: string;
  importPath: string;
}

export interface DocumentConfig {
  lang: string;
  title: string;
  headExtras: string;
  allowHeadExtrasScripts: boolean;
}

export interface AppShellDecl {
  tagName: string;
  importPath: string;
  props: Record<string, unknown>;
}

export type ResolvedAppShell = false | AppShellDecl;

export interface AppShellPlan {
  default: ResolvedAppShell;
  layouts: Record<string, ResolvedAppShell>;
}

export interface EntryDescriptor {
  isSSG: boolean;
  imports: ImportDecl[];
  middleware: MiddlewareDecl[];
  apiRoutes: ApiRouteDecl[];
  pageRoutes: PageRouteDecl[];
  islands: IslandDecl[];
  ssrAdmissionPlan: SsrAdmissionPlan;
  cemClassifications?: CompatibilityClassification[];
  clientOnlyTags?: string[];
  renderers: RendererDecl[];
  middlewareScopes: MiddlewareScopeDecl[];
  document: DocumentConfig;
  appShell: AppShellPlan;
  upgradeStrategy?: HydrationStrategy;
  debugRoutes?: Array<{ path: string; type: string }>;
}

// ─── SSG render pipeline types (from ssg-render.ts) ──────────────

/** Per-page render diagnostics returned by renderRoute() */
export interface SsgPageOutput {
  /** Rendered HTML string */
  html: string;
  /** Render errors collected during rendering */
  errors: RenderError[];
  /** Hydration hints collected during rendering */
  hydrationHints: HydrationHint[];
  /** Number of DSD components rendered on this page */
  componentCount: number;
  /** Total render time for all components on this page (ms) */
  renderTimeMs: number;
}

export interface SsrBundle {
  default: unknown;
  routeInfo?: Array<{
    path: string;
    tagName: string;
    isDynamic: boolean;
    paramNames: string[];
    revalidate?: number;
    params?: Record<string, string>;
  }>;
  renderRoute?: (
    path: string,
    opts?: Record<string, unknown>,
  ) => Promise<SsgPageOutput>;
  getStaticPaths?: (path: string) => Promise<Array<Record<string, string>>>;
  posts?: unknown[];
  [key: string]: unknown;
}

export interface SsgRenderEvidence {
  i18nOptions?: {
    locales: string[];
    defaultLocale?: string;
    [key: string]: unknown;
  } | null;
  localIslandMeta?: Record<string, { hydrate?: string }>;
  packageIslandDecls?: IslandDecl[];
  packageManifests?: OpenElementPackageManifest[];
  admissionDecisions?: SsrAdmissionDecision[];
  cemClassifications?: CompatibilityClassification[];
  onPrintBuildManifest?: (input: {
    root: string;
    outDir: string;
    phase: 3;
    headExtras?: string;
  }) => void | Promise<void>;
  onGenerateSitemap?: (outputDir: string) => void | Promise<void>;
}

// ─── Post-processing types (from postprocess.ts) ─────────────────

/** Speculation Rules configuration for SSG post-processing */
export interface SpeculationRulesOptions {
  /**
   * URL patterns to prerender (fully render in background before navigation).
   */
  prerender?: string[];

  /**
   * URL patterns to prefetch (fetch HTML + resources without rendering).
   */
  prefetch?: string[];

  /**
   * URL patterns to exclude from both prefetch and prerender.
   */
  exclude?: string[];

  /**
   * Eagerness level for prerender rules.
   * @default 'moderate'
   */
  eagerness?: 'immediate' | 'moderate' | 'conservative';
}

// ─── BuildPlan / BuildArtifacts contracts (alpha.5 T2) ───────────

/** A single route input to the build pipeline. */
export interface BuildRouteInput {
  /** Route kind: page or API. */
  kind: 'page' | 'api';
  /** Route path (e.g. '/about', '/blog/:slug'). */
  path: string;
  /** Absolute or relative file path of the route module. */
  filePath: string;
  /** Import specifier used by generated entry code. */
  importPath: string;
  /** Resolved tag name for page routes. */
  tagName?: string;
  /** Dynamic segment names. */
  paramNames?: string[];
  /** Static generation params produced by getStaticPaths(). */
  staticParams?: Array<Record<string, string>>;
}

/** A single island input to the build pipeline. */
export interface BuildIslandInput {
  tagName: string;
  modulePath: string;
  isPackage?: boolean;
  hydrate?: HydrationStrategy;
  ssr?: boolean;
  dsd?: boolean;
  source?: 'local' | 'package' | 'nested';
  reason?: string;
}

/** Output configuration for the build pipeline. */
export interface BuildOutputOptions {
  /** Project root directory. */
  root?: string;
  /** Output directory relative to root. */
  outDir?: string;
  /** Base URL path. */
  base?: string;
  /** If true, emit a client-only SPA bundle instead of SSG. */
  spa?: boolean;
}

/** i18n configuration for the build pipeline. */
export interface BuildI18nOptions {
  locales: string[];
  defaultLocale?: string;
}

/** Content/blog configuration for the build pipeline. */
export interface BuildContentOptions {
  contentDir?: string;
  basePath?: string;
}

/** Package island configuration for the build pipeline. */
export interface BuildPackageIslandOptions {
  /** Package names that may expose island declarations. */
  packages?: string[];
}

/** Framework-agnostic plan consumed by the OpenElement build pipeline. */
export interface BuildPlan {
  /** User-facing framework options. */
  options: import('./framework.ts').FrameworkOptions;
  /** Discovered page and API routes. */
  routes: BuildRouteInput[];
  /** Discovered local and package islands. */
  islands: BuildIslandInput[];
  /** Output configuration. */
  output: BuildOutputOptions;
  /** i18n expansion options. */
  i18n?: BuildI18nOptions;
  /** Content expansion options. */
  content?: BuildContentOptions;
  /** Package island discovery options. */
  packageIslands?: BuildPackageIslandOptions;
  /** Extra evidence passed to the render pipeline. */
  evidence?: SsgRenderEvidence;
}

/** A single generated HTML page artifact. */
export interface BuildPageArtifact {
  path: string;
  html: string;
  /** Errors collected while rendering this page. */
  errors: Array<{ message: string; route?: string }>;
}

/** Manifest produced by the build pipeline. */
export interface BuildManifestArtifact {
  routes: Array<{ kind: 'page' | 'api'; path: string; tagName?: string; isDynamic: boolean }>;
  islands: BuildIslandInput[];
}

/** A single client asset emitted by the build pipeline. */
export interface BuildClientAsset {
  fileName: string;
  source: string | Uint8Array;
  sizeBytes: number;
}

/** Result returned by the OpenElement build pipeline. */
export interface BuildArtifacts {
  /** Generated HTML pages. */
  pages: BuildPageArtifact[];
  /** Build manifest. */
  manifest: BuildManifestArtifact;
  /** Client-side assets (island bundles, CSS, etc). */
  clientAssets: BuildClientAsset[];
  /** Non-fatal warnings. */
  warnings: string[];
  /** Fatal errors. */
  errors: string[];
  /** Whether the build succeeded. */
  success: boolean;
}

// ─── Build pipeline function contract (implementation lives in @openelement/ssg) ─

/** Build function contract implemented by adapter-agnostic SSG engines. */
export type OpenElementBuild = (
  plan: BuildPlan,
) => Promise<BuildArtifacts>;

// ─── Resolver contracts (alpha.5 T4) ─────────────────────────────

/** A resolved specifier target. */
export interface ResolvedSpecifier {
  /** Final specifier to use in generated code or import map. */
  specifier: string;
  /** True if the specifier points to a remote (https://) source. */
  isRemote: boolean;
  /** Optional local file system path when resolved to disk. */
  filePath?: string;
}

/** Input to the OpenElement package resolver. */
export interface PackageResolverInput {
  /** The import specifier to resolve, e.g. '@openelement/element'. */
  id: string;
  /** The module requesting the resolution, if any. */
  importer?: string;
  /** Workspace root directory, when running inside a Deno workspace. */
  workspaceRoot?: string | null;
  /** Local monorepo root for source fallback. */
  localPackageRoot?: string | null;
  /** Package version to use for remote registry resolution. */
  version?: string;
  /** Registry mode. 'npm' uses node_modules; 'jsr' fetches remote source. */
  registry?: 'npm' | 'jsr';
  /** User-provided aliases that should take precedence. */
  userAliases?: Record<string, string> | Array<{ find: string; replacement: string }> | null;
}

/** Result of resolving an OpenElement package specifier. */
export interface PackageResolverResult {
  /** Resolved target, or null if the resolver declined. */
  resolution: ResolvedSpecifier | null;
  /** Errors if the specifier is known to be invalid. */
  errors: string[];
  /** Warnings, e.g. deprecated subpaths. */
  warnings: string[];
}

/** Contract for an OpenElement package/subpath resolver. */
export type OpenElementPackageResolver = (
  input: PackageResolverInput,
) => PackageResolverResult | Promise<PackageResolverResult>;

/** Known OpenElement package name and its exported subpaths. */
export interface OpenElementPackageExports {
  packageName: string;
  exports: Record<string, string>;
}

/** Registry from package name to exported subpaths. */
export type OpenElementExportMap = Record<string, OpenElementPackageExports>;
