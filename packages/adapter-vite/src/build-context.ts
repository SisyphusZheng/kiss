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
  OpenElementBlogOptions,
  OpenElementHeaderNavLink,
  OpenElementI18nContextOptions,
  OpenElementNavSection,
  RouteEntry,
} from '@openelement/protocol/framework';
import type { OpenElementPackageManifest } from '@openelement/protocol/manifest';
import type { IslandDecl, SsrAdmissionPlan } from '@openelement/protocol/ssg';
import { createLogger } from '@openelement/core/logger';

const log = createLogger('core');

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

  /** Populate Phase 3 invariants from resolved Vite config and framework options. */
  populatePhase3(
    options: FrameworkOptions & { allowHeadExtrasScripts?: boolean },
    config: ResolvedConfig,
    ssrNoExternal: (string | { __type: 'RegExp'; source: string; flags: string })[],
  ): void {
    let base = config.base || '/';
    if (!base.endsWith('/')) base += '/';

    this.phase3.root = config.root;
    this.phase3.outDir = options.build?.outDir || 'dist';
    this.phase3.base = base;
    this.phase3.ssrNoExternal = ssrNoExternal;
    this.phase3.routesDir = options.routesDir || 'app/routes';
    this.phase3.islandsDir = options.islandsDir || 'app/islands';
    this.phase3.componentsDir = options.componentsDir || 'app/components';
    this.phase3.middleware = options.middleware || null;
    this.phase3.html = options.html || null;
    this.phase3.upgradeStrategy = options.island?.upgradeStrategy || 'idle';
    this.phase3.viewTransition = options.viewTransition ?? true;
    this.phase3.speculation = options.speculation ?? null;
    this.phase3.headExtras = options.headExtras || '';
    this.phase3.allowHeadExtrasScripts = options.allowHeadExtrasScripts || false;
    this.phase3.appShell = options.appShell;
    this.phase3.layouts = options.layouts;
  }

  /** Return a read-only view of Phase 3 metadata. */
  getPhase3Meta(): Readonly<Phase3Meta> {
    return this.phase3;
  }

  /** Check whether a phase has been completed. */
  isPhaseComplete(phase: 1 | 2 | 3): boolean {
    return this._phaseTokens[phase] !== null;
  }

  /** Run Phase 3 after Phase 1, enforcing ordering and logging. */
  async runPhase3(runner: (ctx: this) => Promise<void>): Promise<void> {
    const phase1Token = this._phaseTokens[1];
    if (!phase1Token) {
      throw new Error('Phase 3 called before Phase 1 completed');
    }
    this.completePhase3(phase1Token);

    log.info('[3/3] Static site generation...');
    try {
      await runner(this);
      log.info('[3/3] Static site generation - complete');
    } catch (error) {
      log.error(`[3/3] Static site generation - FAILED: ${error}`);
      throw error;
    }
  }

  /** Run Phase 2 after Phase 3, enforcing ordering and logging. */
  async runPhase2(runner: (ctx: this) => Promise<void>): Promise<void> {
    const phase3Token = this._phaseTokens[3];
    if (!phase3Token) {
      throw new Error('Phase 2 called before Phase 3 completed');
    }
    this.completePhase2(phase3Token);

    log.info('[2/3] Client island build...');
    try {
      await runner(this);
      log.info('[2/3] Client island build - complete');
    } catch (error) {
      log.error(`[2/3] Client island build - FAILED: ${error}`);
      throw error;
    }
  }

  /** Phase 1: Route scanning & build metadata */
  readonly phase1: Phase1Meta = new Phase1Meta();

  /** Phase 2: Client island build state */
  readonly phase2: Phase2Meta = new Phase2Meta();

  /** Phase 3: SSG rendering state */
  readonly phase3: Phase3Meta = new Phase3Meta();

  /** Plugin data from content/i18n sub-plugins */
  readonly plugins: {
    blogOptions: OpenElementBlogOptions | null;
    navSections: OpenElementNavSection[];
    headerNav: OpenElementHeaderNavLink[];
    sitemapOptions: Record<string, unknown> | null;
    i18nOptions: OpenElementI18nContextOptions | null;
    [key: string]: unknown;
  } = {
    blogOptions: null,
    navSections: [],
    headerNav: [],
    sitemapOptions: null,
    i18nOptions: null,
  };

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
    Object.assign(this.plugins, {
      blogOptions: null,
      navSections: [],
      headerNav: [],
      sitemapOptions: null,
      i18nOptions: null,
    });
  }
}
