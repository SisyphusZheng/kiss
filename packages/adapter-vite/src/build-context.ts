/**
 * @openelement/adapter-vite - openElement Build Context
 *
 * Shared mutable state for all openElement Vite plugins.
 * Replaces the closure-captured variables (honoEntryCode, scannedIslandTagNames, etc.)
 * with a single object that's explicitly passed around.
 *
 * Also replaces the .openElement/ temp directory as IPC between build phases:
 * - Phase 1 (open:build) writes metadata -> ctx fields
 * - Phase 2 (build-client) reads metadata -> ctx fields
 * - Phase 3 (build-ssg) reads metadata -> ctx fields
 * - Sub-plugins (openContent, openI18n) write their data -> ctx fields
 *
 * ctx is passed via explicit parameter - no globalThis or module-level discovery.
 * use openElement() from @openelement/app/vite for the recommended unified entry.
 *
 * Fields are grouped by Phase to improve type safety and maintainability.
 */

import type { Alias, ResolvedConfig } from 'vite';
import type {
  CompatibilityClassification,
  FrameworkOptions,
  HydrationStrategy,
  OpenElementPluginMeta,
  RouteEntry,
} from '@openelement/protocol/framework';
import type { OpenElementPackageManifest } from '@openelement/protocol/manifest';
import type { IslandDecl, SsrAdmissionPlan } from '@openelement/protocol/ssg';

// These branded types ensure Phase 2 can only run after Phase 1,
// and Phase 3 can only run after Phase 2. The compiler catches
// out-of-order phase calls at build time.
export type Phase1Token = { readonly __phase1: unique symbol };
export type Phase2Token = { readonly __phase2: unique symbol };
export type Phase3Token = { readonly __phase3: unique symbol };

export class Phase1Meta {
  /** The generated Hono entry module code (virtual module content) */
  honoEntryCode: string = '';

  /** Cached routes from buildStart() for virtual entry regeneration */
  cachedRoutes: RouteEntry[] = [];

  /** Island tag names discovered during route scanning (local islands) */
  islandTagNames: string[] = [];

  /** Relative file paths for local islands */
  islandFiles: string[] = [];

  /** Local island metadata indexed by tag name. */
  islandMeta: Record<string, Partial<IslandDecl>> = {};

  /** Package manifests discovered from npm/JSR packages */
  packageManifests: OpenElementPackageManifest[] = [];

  /** Package island declarations extracted from manifests */
  packageIslandDecls: IslandDecl[] = [];

  /** SSR admission plan produced before SSR entry generation. */
  ssrAdmissionPlan: SsrAdmissionPlan | null = null;

  /** v0.18.0: CEM-derived compatibility classifications from the classifier. */
  cemClassifications: CompatibilityClassification[] = [];

  /** Whether the SSR+client build has completed */
  buildCompleted: boolean = false;

  /** Vite resolved config (set in configResolved hook) */
  resolvedConfig: ResolvedConfig | null = null;

  /** User-provided resolve.alias in its original format */
  userResolveAlias: Record<string, string> | Alias[] | null = null;
}

export class Phase2Meta {
  /** Generated client island entry code */
  clientEntryCode: string = '';
}

export class Phase3Meta {
  /** Generated SSG entry code (for viteBuild SSR input) */
  ssgEntryCode: string = '';

  /** Project root directory */
  root: string = '';

  /** Output directory (default: 'dist') */
  outDir: string = 'dist';

  /** Base URL path (default: '/') */
  base: string = '/';

  /** Middleware config from createOpenPlugin() options */
  middleware: FrameworkOptions['middleware'] | null = null;

  /** HTML document options from createOpenPlugin() options */
  html: { lang?: string; title?: string } | null = null;

  /** Island hydration strategy (default: 'idle') */
  upgradeStrategy: HydrationStrategy = 'idle';

  /** View Transitions enabled (default: true) */
  viewTransition: boolean = true;

  /** Speculation Rules config from createOpenPlugin() options */
  speculation: FrameworkOptions['speculation'] | null = null;

  /** Extra HTML to inject into <head> */
  headExtras: string = '';

  /** Whether headExtras scripts were produced by structured injection APIs. */
  allowHeadExtrasScripts: boolean = false;

  /** Application shell rendered around routes. */
  appShell: FrameworkOptions['appShell'] = undefined;

  /** Named route layouts selected by route meta. */
  layouts: FrameworkOptions['layouts'] = undefined;

  /** SSR noExternal patterns (serialized) */
  ssrNoExternal: (string | { __type: 'RegExp'; source: string; flags: string })[] = [];

  /** SSR deps to keep as external (resolved by Deno import() at runtime per ADR-0043) */
  ssrExternal: string[] = [];

  /** Routes directory */
  routesDir: string = 'app/routes';

  /** Islands directory */
  islandsDir: string = 'app/islands';

  /** Components directory */
  componentsDir: string = 'app/components';

  /** ADR-0047: Pre-resolved external dependency manifest (auto-generated from deno info). */
  externalManifest?: import('@openelement/protocol/ssg').ExternalManifest;

  /** Skip Deno pre-resolution, use regex fallback. */
  skipPreResolution?: boolean;
}

export class PluginMeta implements OpenElementPluginMeta {
  /** Index signature to satisfy OpenElementPluginMeta interface */
  [key: string]: unknown;

  /** Blog options from @openelement/content plugin */
  blogOptions: { contentDir?: string; basePath?: string } | null = null;

  /** Navigation sections from @openelement/content plugin */
  navSections: Array<
    { section: string; items: Array<{ path: string; label: string; order?: number }> }
  > = [];

  /** Header navigation links from @openelement/content plugin */
  headerNav: Array<{ href: string; label: string }> = [];

  /** Sitemap options from @openelement/content plugin */
  sitemapOptions: Record<string, unknown> | null = null;

  /** i18n options from @openelement/i18n plugin */
  i18nOptions: {
    locales: string[];
    defaultLocale: string;
    [key: string]: unknown;
  } | null = null;
}

export class OpenElementBuildContext {
  /** Phase completion tokens - used for compile-time ordering enforcement */
  readonly _phaseTokens: {
    1: Phase1Token | null;
    2: Phase2Token | null;
    3: Phase3Token | null;
  } = { 1: null, 2: null, 3: null };

  /** Mark Phase 1 as complete and return the token for subsequent phases */
  completePhase1(): Phase1Token {
    const token: Phase1Token = { __phase1: Symbol() as never };
    this._phaseTokens[1] = token;
    return token;
  }

  /** Mark Phase 2 as complete (after Phase 1 or Phase 3) */
  completePhase2(token: Phase1Token | Phase3Token): Phase2Token {
    if (this._phaseTokens[1] !== token && this._phaseTokens[3] !== token) {
      throw new Error('Phase 2 called before Phase 1 completed');
    }
    const t2: Phase2Token = { __phase2: Symbol() as never };
    this._phaseTokens[2] = t2;
    return t2;
  }

  /** Mark Phase 3 as complete (only requires Phase 1, not Phase 2) */
  completePhase3(token: Phase1Token): Phase3Token {
    if (this._phaseTokens[1] !== token) {
      throw new Error('Phase 3 called before Phase 1 completed');
    }
    const t3: Phase3Token = { __phase3: Symbol() as never };
    this._phaseTokens[3] = t3;
    return t3;
  }
  /** Phase 1: Route scanning & build metadata */
  readonly phase1: Phase1Meta = new Phase1Meta();

  /** Phase 2: Client island build state */
  readonly phase2: Phase2Meta = new Phase2Meta();

  /** Phase 3: SSG rendering state */
  readonly phase3: Phase3Meta = new Phase3Meta();

  /** Plugin data from content/i18n sub-plugins */
  readonly plugins: PluginMeta = new PluginMeta();

  /** Resolved framework options with defaults applied (read-only after construction) */
  readonly options: FrameworkOptions;

  constructor(options: FrameworkOptions) {
    this.options = options;
  }

  /** Reset all mutable state (for watch mode / testing) */
  reset(): void {
    this._phaseTokens[1] = null;
    this._phaseTokens[2] = null;
    this._phaseTokens[3] = null;

    const userResolveAlias = this.phase1.userResolveAlias;
    // NOTE: userResolveAlias is NOT reset - it's user configuration, not
    // build state. It's set in config()/configResolved() and must persist
    // through buildStart() for Phase 2 and 3 to use.
    Object.assign(this.phase1, new Phase1Meta(), { userResolveAlias });
    Object.assign(this.phase2, new Phase2Meta());
    Object.assign(this.phase3, new Phase3Meta());
    Object.assign(this.plugins, new PluginMeta());
  }
}
