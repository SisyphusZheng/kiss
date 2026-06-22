/**
 * @openelement/protocol - SSG engine contracts.
 *
 * Runtime-free data contracts consumed by the SSG engine and build adapters.
 * These types keep the SSG engine adapter-agnostic.
 */

import type {
  CompatibilityClassification,
  HydrationStrategy,
  SsrAdmissionDecision,
} from './framework.js';
import type { HydrationHint, RenderError } from './render.js';
import type { OpenElementPackageManifest } from './manifest.js';

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

/** Island declaration shape used in SSG render evidence reports. */
export interface SsgIslandDeclForReport {
  tagName: string;
  hydrate?: HydrationStrategy | string;
  dsd?: boolean;
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

export type RouteKind = 'page' | 'api' | 'asset' | 'redirect';
export type RouteRenderingMode = 'auto' | 'static' | 'dynamic';
export type RouteStreamingMode = 'auto' | 'force' | false;
export type RouteRevalidate = false | number | `${number}s` | `${number}m` | `${number}h`;

export interface RouteRenderIntent {
  mode?: RouteRenderingMode;
  streaming?: RouteStreamingMode;
  revalidate?: RouteRevalidate;
}

export interface RouteProtocolEntry {
  id: string;
  path: string;
  kind: RouteKind;
  filePath?: string;
  renderIntent?: RouteRenderIntent;
}

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

export type RouteDecl = ApiRouteDecl | PageRouteDecl;

export interface IslandDecl {
  tagName: string;
  modulePath: string;
  isPackage?: boolean;
  hydrate?: HydrationStrategy;
  ssr?: boolean;
  dsd?: boolean;
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
  packageIslandDecls?: SsgIslandDeclForReport[];
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
