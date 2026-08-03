/**
 * framework.ts - Framework, build, app-shell, routing, and plugin
 * metadata contracts.
 */

// --- API context --------------------------------------------------

/** API route context passed to simple handlers */
export interface OpenElementApiContext {
  request: Request;
  params: Record<string, string>;
  env: Record<string, string | undefined>;
  platform?: unknown;
}

// --- Safe/Unsafe HTML Contract ------------------------------------

/** Branded type: a string that has been HTML-escaped (safe for text content) */
export type SafeHtml = string & { readonly __safeHtml: unique symbol };

/** Branded type: a string that is intentionally raw/untrusted HTML */
export type UnsafeHtml = string & { readonly __unsafeHtml: unique symbol };

// --- Component layer & hydration ----------------------------------

export type ComponentLayer = 'dsd-static' | 'dsd-interactive' | 'pure-island' | 'light-dom';

/** Runtime list of supported hydration strategies; the single source of truth
 * for the `HydrationStrategy` union. Consumed by island/registry validation and
 * re-exported from the element root for app and build adapters. */
export const HYDRATION_STRATEGIES = ['load', 'idle', 'visible', 'only'] as const;
export type HydrationStrategy = typeof HYDRATION_STRATEGIES[number];
export type StrategySource = 'default' | 'manifest' | 'component' | 'route';

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

/** Minimal build context interface that sub-plugins can use. */
export interface OpenElementBuildContextLike {
  plugins: {
    blogOptions: OpenElementBlogOptions | null;
    navSections: OpenElementNavSection[];
    headerNav: OpenElementHeaderNavLink[];
    sitemapOptions: Record<string, unknown> | null;
    i18nOptions: OpenElementI18nContextOptions | null;
    [key: string]: unknown;
  };
  /** Register plugin data by name. Protocol level uses loose typing;
   * concrete implementations should tighten the generic constraint. */
  registerPlugin(name: string, instance: unknown): void;
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

/** Locale-aware resolved path contract. */
export interface LocalePath {
  locale: string;
  path: string;
  localizedPath: string;
  isDefaultLocalePath: boolean;
}

export interface RouteEntry {
  path: string;
  filePath: string;
  type: 'page' | 'api' | 'island' | 'special';
  varName: string;
  tagName?: string;
  /** Source text captured during scanning when includeSource is enabled. */
  source?: string;
  /**
   * True when the page route source carries data-open-enhance (0.42.0-alpha.5,
   * #569): the client entry must ship the form-enhancement layer even when the
   * app has zero islands.
   */
  hasEnhancedForms?: boolean;
  special?: SpecialFileType;
  revalidate?: number;
  params?: string[];
}

// --- Framework Options --------------------------------------------

/**
 * Fetch middleware contract (ADR-0123 item 2, #858): WinterCG shape,
 * dialect-free — no Hono/h3 context object. Composed at the handler boundary
 * in onion order (`use[0]` is outermost: it sees the request first and the
 * response last), so it runs with identical semantics in the dev server, the
 * `start` CLI, the e2e fixture server, and the Nitro production entry.
 *
 * A middleware may short-circuit by returning a Response without calling
 * `next()`, or post-process the Response that `next()` returns.
 *
 * Serialization constraint: middleware sources are inlined into the generated
 * server entry (same mechanism as a function-valued `middleware.corsOrigin`),
 * so each middleware must be self-contained — it cannot close over variables
 * from the vite.config.ts module scope.
 */
export type Middleware = (request: Request, next: () => Promise<Response>) => Promise<Response>;

export interface FrameworkOptions {
  routesDir?: string;
  islandsDir?: string;
  componentsDir?: string;
  packageIslands?: string[];
  appShell?: AppShellConfig;
  layouts?: LayoutsConfig;
  /** Build mode. 'ssg' (default) generates static HTML. 'spa' produces a client-only bundle. */
  mode?: 'ssg' | 'spa';
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
  };
  island?: {
    upgradeStrategy?: HydrationStrategy;
  };
  build?: {
    outDir?: string;
    manifestBudget?: {
      islandKB?: number;
      totalJsKB?: number;
      pageKB?: number;
    };
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
    securityHeaders?: boolean;
    csp?: {
      policy?: string;
      nonce?: boolean;
      reportOnly?: boolean;
    };
    /**
     * Fetch middleware chain (ADR-0123 item 2, #858), composed around the
     * framework handler in onion order (`use[0]` outermost), outside all
     * built-in middleware above. See {@link Middleware} for the contract and
     * the self-containment constraint.
     */
    use?: Middleware[];
  };
}

// --- ISR / Compatibility types ------------------------------------

/**
 * @experimental ISR route record written to isr-manifest.json at build time.
 * Emitted for forward-compatibility only — ISR is not served in 0.42, so this
 * manifest is currently inert (targeting 0.44).
 */
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

// --- Routing & Middleware -----------------------------------------

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

// --- Hydration events ---------------------------------------------

export interface HydrateEventDescriptor {
  selector: string;
  event: string;
  method: string;
}
