/**
 * @openelement/core — Public API contract types.
 *
 * These types define the framework's user-facing shape and are consumed
 * by external packages (app, adapter-vite, ssg, compat-check, etc.).
 * Implementation detail types used only within core live in their
 * consuming modules (render-dsd.ts, dsd-hydration-events.ts, etc.).
 *
 * Consolidated from the former @openelement/core module
 * (ADR-0094 / Phase 2).
 *
 * @see ADR-0094: Core Type Consolidation — Eliminate types.ts
 */

import type { VNode } from './vnode.js';

// --- API context --------------------------------------------------

/** API route context passed to simple handlers */
export interface OpenElementApiContext {
  request: Request;
  params: Record<string, string>;
  env: Record<string, string | undefined>;
  platform?: unknown;
}

// --- Component layer & hydration ----------------------------------

export type ComponentLayer = 'dsd-static' | 'dsd-interactive' | 'pure-island' | 'light-dom';
export type HydrationStrategy = 'load' | 'idle' | 'visible' | 'only';
export type StrategySource = 'default' | 'manifest' | 'component' | 'route';

// --- Manifest descriptors (CEM-compatible) ------------------------

export interface OpenElementAttribute {
  name: string;
  type?: string;
  default?: string;
  description?: string;
  reflects?: boolean;
  fieldName?: string;
}

export interface OpenElementMember {
  name: string;
  kind: 'field' | 'method' | 'property';
  type?: string;
  default?: string;
  description?: string;
  privacy?: 'public' | 'protected' | 'private';
  static?: boolean;
  readonly?: boolean;
}

export interface OpenElementEvent {
  name: string;
  type?: string;
  description?: string;
}

export interface OpenElementSlot {
  name: string;
  description?: string;
}

export interface OpenElementCssProperty {
  name: string;
  default?: string;
  description?: string;
  type?: string;
}

export interface OpenElementCssPart {
  name: string;
  description?: string;
}

export interface OpenElementExtensions {
  ssr?: boolean;
  dsd?: boolean;
  layer?: ComponentLayer;
  hydrate?: HydrationStrategy;
  module?: string;
  export?: string;
}

export interface OpenElementPackageExtensions {
  openElementVersion?: string;
  adapter?: string;
  hasStylesheet?: boolean;
  cssPrefix?: string;
}

export interface OpenElementExport {
  name: string;
  path?: string;
  description?: string;
}

export interface OpenElementDeclaration {
  tagName: string;
  className?: string;
  superclassName?: string;
  attributes?: OpenElementAttribute[];
  members?: OpenElementMember[];
  events?: OpenElementEvent[];
  slots?: OpenElementSlot[];
  cssProperties?: OpenElementCssProperty[];
  cssParts?: OpenElementCssPart[];
  openElement?: OpenElementExtensions;
  description?: string;
}

export interface OpenElementModule {
  path: string;
  exports?: OpenElementExport[];
  declarations?: string[];
}

/** CEM-compatible package manifest */
export interface OpenElementPackageManifest {
  schemaVersion: string;
  packageName: string;
  version: string;
  description?: string;
  author?: string;
  license?: string;
  homepage?: string;
  repository?: string;
  declarations: OpenElementDeclaration[];
  modules?: OpenElementModule[];
  openElement?: OpenElementPackageExtensions;
}

// --- Blog / Content / i18n build types ----------------------------

/** Blog options stored in the build context by @openelement/content. */
export interface OpenElementBlogOptions {
  contentDir?: string;
  basePath?: string;
}

/** Navigation section from @openelement/content. */
export interface OpenElementNavSection {
  section: string;
  items: Array<{ path: string; label: string; order?: number }>;
}

/** Header navigation link. */
export interface OpenElementHeaderNavLink {
  href: string;
  label: string;
}

/** i18n options stored in the build context by @openelement/i18n. */
export interface OpenElementI18nContextOptions {
  locales: string[];
  defaultLocale: string;
  [key: string]: unknown;
}

/** Plugin metadata interface: data bridge between sub-plugins and build context. */
export interface OpenElementPluginMeta {
  blogOptions: OpenElementBlogOptions | null;
  navSections: OpenElementNavSection[];
  headerNav: OpenElementHeaderNavLink[];
  sitemapOptions: Record<string, unknown> | null;
  i18nOptions: OpenElementI18nContextOptions | null;
  [key: string]: unknown;
}

/** Minimal build context interface that sub-plugins can use. */
export interface OpenElementBuildContextLike {
  plugins: OpenElementPluginMeta;
}

// --- App Shell types ----------------------------------------------

export interface AppShellDefinition {
  tagName: string;
  import: string;
  props?: Record<string, unknown>;
}

export type AppShellConfig = false | 'default' | AppShellDefinition;

export type LayoutsConfig = Record<string, AppShellConfig | undefined>;

// --- Routing types ------------------------------------------------

export type SpecialFileType = 'renderer' | 'middleware';

export interface RouteEntry {
  path: string;
  filePath: string;
  type: 'page' | 'api' | 'island' | 'special';
  varName: string;
  tagName?: string;
  special?: SpecialFileType;
  revalidate?: number;
  params?: string[];
}

// --- Framework Options --------------------------------------------

export interface FrameworkOptions {
  routesDir?: string;
  islandsDir?: string;
  componentsDir?: string;
  packageIslands?: string[];
  appShell?: AppShellConfig;
  layouts?: LayoutsConfig;
  /** @dangerous injected as-is, only use with controlled content */
  headExtras?: string;
  html?: {
    lang?: string;
    title?: string;
  };
  inject?: {
    stylesheets?: Array<
      | string
      | {
        href: string;
        integrity?: string;
        crossorigin?: 'anonymous' | 'use-credentials';
        attrs?: Record<string, string | number | boolean>;
      }
    >;
    scripts?: Array<
      | string
      | {
        src: string;
        type?: string;
        async?: boolean;
        defer?: boolean;
        integrity?: string;
        crossorigin?: 'anonymous' | 'use-credentials';
        attrs?: Record<string, string | number | boolean>;
      }
    >;
    /** @dangerous fragments injected as-is */
    headFragments?: string[];
  };
  ssr?: {
    noExternal?: (string | RegExp)[];
    domSimulation?: 'off' | 'explicit';
    domSimulationTimeoutMs?: number;
  };
  island?: {
    upgradeStrategy?: HydrationStrategy;
  };
  build?: {
    outDir?: string;
  };
  viewTransition?: boolean;
  speculation?: boolean | {
    prerender?: string[];
    prefetch?: string[];
    exclude?: string[];
    eagerness?: 'immediate' | 'moderate' | 'conservative';
  };
  middleware?: {
    cors?: boolean;
    corsOrigin?: string | string[] | ((origin: string) => string | undefined);
    requestId?: boolean;
    logger?: boolean;
    rateLimit?: boolean;
    securityHeaders?: boolean;
    csp?: {
      policy?: string;
      nonce?: boolean;
      reportOnly?: boolean;
    };
  };
}

// --- ISR / Compatibility types ------------------------------------

/** ISR route record written to isr-manifest.json at build time. */
export interface IsrManifestEntry {
  path: string;
  revalidate: number;
  cacheKey: string;
  params: Record<string, string>;
}

export type CompatibilityTier = 'ssr-capable' | 'client-only' | 'rejected' | 'experimental-dom';

export interface CompatibilityClassification {
  tagName: string;
  tier: CompatibilityTier;
  reason: string;
  source: 'local' | 'package' | 'nested';
  modulePath?: string;
  ssr?: boolean;
  dsd?: boolean;
  hydrate?: string;
}

// --- Validation ---------------------------------------------------

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  code: string;
  message: string;
  path?: string;
}

export interface ValidationWarning {
  code: string;
  message: string;
  path?: string;
}

// --- Registry -----------------------------------------------------

export interface RegistryIndexEntry {
  tagName: string;
  packageName: string;
  version: string;
  module?: string;
  ssr?: boolean;
  dsd?: boolean;
  hydrate?: string;
}

export interface RegistryIndex {
  totalPackages: number;
  totalDeclarations: number;
  entries: RegistryIndexEntry[];
}

// --- Routing & Middleware (not in protocol, core-specific) ---------

export interface OpenElementRenderer {
  wrap(
    node: VNode,
    ctx: { req: { path: string }; [key: string]: unknown },
  ): VNode | Promise<VNode>;
}

export interface OpenElementMiddlewareContext {
  req: {
    raw?: Request;
    path?: string;
    param(): Record<string, string>;
    param(name: string): string | undefined;
    [key: string]: unknown;
  };
  env?: unknown;
  executionCtx?: unknown;
  get?(key: string): unknown;
  set?(key: string, value: unknown): void;
  header?(name: string, value: string): void;
  html?(html: string, status?: number): Response;
  json?(value: unknown, status?: number): Response;
  text?(value: string, status?: number): Response;
  redirect?(location: string, status?: number): Response;
  [key: string]: unknown;
}

export type OpenElementMiddleware = (
  c: OpenElementMiddlewareContext,
  next: () => Promise<void>,
) => Promise<void> | void;

export type { SsrContext } from './context.js';

// --- Hydration events ---------------------------------------------

export interface HydrateEventDescriptor {
  selector: string;
  event: string;
  method: string;
}

// --- Reactive -----------------------------------------------------

export type Unsubscribe = () => void;

export interface ReactiveHost {
  subscribeTo(source: { subscribe(fn: (value: unknown) => void): Unsubscribe }): Unsubscribe;
  requestReactiveUpdate(): void;
}
