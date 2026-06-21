/**
 * @openelement/core - Entry Descriptor
 *
 * Structured data model describing the generated Hono entry module.
 * This is a pure data object - no code generation logic lives here.
 *
 * Architecture:
 *   routes + options -> buildEntryDescriptor() -> EntryDescriptor
 *   EntryDescriptor  -> renderEntry()           -> string (virtual module code)
 *
 * Separating "what to generate" from "how to render it" makes the
 * entry pipeline testable, serializable, and diffable.
 *
 * This file records where each island source becomes an SSR import:
 *
 * 1. Local island file:
 *    - Scanned by `scanIslands()` in route-scanner.ts
 *    - Metadata read by `scanIslandMeta()` (static, no import)
 *    - Imported in `renderEntry()` lines 406-419 (only if in ssrAdmissionPlan.renderableTags)
 *
 * 2. Package manifest island:
 *    - Discovered by `scanPackageManifests()` in route-scanner.ts
 *    - Manifest declarations extracted in `buildEntryDescriptor()` lines 402-415
 *    - NOT imported in SSR entry (package islands registered client-side only)
 *
 * 3. Nested custom element (from the VNode tree):
 *    - Rendered by `renderDsdTree()` in core/src/jsx-render-string.ts
 *    - Calls `renderDsd()` inline for registered custom element hosts
 *    - Package islands remain client-side unless admitted into the SSR entry
 *
 * Audit completed: 2026-05-17
 * Auditor: AI agent (openElement v0.17.4 SOP compliance check)
 */

import type {
  AppShellConfig,
  CompatibilityClassification,
  FrameworkOptions,
  HydrationStrategy,
  OpenElementPackageManifest,
  RouteEntry,
  SsrAdmissionDecision,
} from '@openelement/core';
import type {
  ApiRouteDecl as ProtocolApiRouteDecl,
  AppShellDecl as ProtocolAppShellDecl,
  AppShellPlan as ProtocolAppShellPlan,
  CorsOriginConfig as ProtocolCorsOriginConfig,
  CspConfig as ProtocolCspConfig,
  DocumentConfig as ProtocolDocumentConfig,
  EntryDescriptor as ProtocolEntryDescriptor,
  ImportDecl as ProtocolImportDecl,
  IslandDecl as ProtocolIslandDecl,
  MiddlewareDecl as ProtocolMiddlewareDecl,
  MiddlewareScopeDecl as ProtocolMiddlewareScopeDecl,
  PageRouteDecl as ProtocolPageRouteDecl,
  RendererDecl as ProtocolRendererDecl,
  ResolvedAppShell as ProtocolResolvedAppShell,
  RouteDecl as ProtocolRouteDecl,
  SsrAdmissionPlan as ProtocolSsrAdmissionPlan,
} from '@openelement/protocol/routes';
import { fileToTagName } from './route-scanner.ts';

/** Import declaration for the generated entry module */
export interface ImportDecl extends ProtocolImportDecl {
  /** Module specifier (e.g. 'hono', 'hono/cors') */
  from: string;
  /** Named imports (e.g. ['Hono'], ['cors']) */
  names: string[];
  /** Optional alias for the first name (e.g. import { logger as honoLogger }) */
  alias?: string;
}

/** CORS origin configuration - string, array of strings, or serialized function body */
export type CorsOriginConfig = ProtocolCorsOriginConfig;

/** CSP configuration for Content-Security-Policy header */
export interface CspConfig extends ProtocolCspConfig {
  /** CSP policy string (e.g. "default-src 'self'; script-src 'self'") */
  policy?: string;
  /** Auto-generate nonce for <script> tags (default: false) */
  nonce?: boolean;
  /** Report-only mode (default: false) */
  reportOnly?: boolean;
}

/** Middleware registration declaration for the Hono entry */
export interface MiddlewareDecl extends ProtocolMiddlewareDecl {
  kind: 'requestId' | 'logger' | 'cors' | 'securityHeaders' | 'csp';
  /** Comments to emit before the middleware registration */
  comment?: string;
  /** Extra config (e.g. CORS origin, CSP policy) */
  config?: {
    corsOrigin?: CorsOriginConfig;
    csp?: CspConfig;
  };
}

/** API route declaration (e.g. /api/hello) */
export interface ApiRouteDecl extends ProtocolApiRouteDecl {
  kind: 'api';
  /** URL path pattern (e.g. '/api/hello') */
  path: string;
  /** Variable name for the imported module (e.g. '$apiHello') */
  varName: string;
  /** Relative file path from routesDir */
  filePath: string;
  /** Full import path for Vite SSR (e.g. '/app/routes/api/hello.ts') */
  importPath: string;
}

/** Page route declaration (e.g. /about) with SSR rendering */
export interface PageRouteDecl extends ProtocolPageRouteDecl {
  kind: 'page';
  /** URL path pattern */
  path: string;
  /** Variable name for the imported module */
  varName: string;
  /** Relative file path from routesDir */
  filePath: string;
  /** Default custom element tag name derived from file name */
  defaultTagName: string;
  /** Custom element tag name used for SSR registration and rendering */
  tagName: string;
  /** Full import path for Vite SSR (e.g. '/app/routes/about.ts') */
  importPath: string;
  /** Whether this is a dynamic route containing :param segments */
  isDynamic?: boolean;
  /** Parameter names extracted from the path (e.g. ['slug'] for /blog/:slug) */
  paramNames?: string[];
}

/** Union type for all route declarations */
export type RouteDecl = ProtocolRouteDecl;

/** Island component declaration for runtime upgrade detection */
export interface IslandDecl extends ProtocolIslandDecl {
  /** Custom element tag name */
  tagName: string;
  /** Module path for dynamic import (e.g. '/app/islands/counter.ts') */
  modulePath: string;
  /** Package islands are upgraded by the client entry and are not SSR-registered here. */
  isPackage?: boolean;
  /** Hydration strategy from manifest (load/idle/visible/only) */
  hydrate?: HydrationStrategy;
  /** Whether this island supports SSR rendering (from manifest) */
  ssr?: boolean;
  /** Whether this island uses Declarative Shadow DOM (from manifest) */
  dsd?: boolean;
  /** Admission source used by SSR planning. */
  source?: 'local' | 'package' | 'nested';
  /** Human-readable admission reason for reports. */
  reason?: string;
}

// imported from @openelement/core

/** Build-time plan that decides which tags may enter the SSR bundle. */
export interface SsrAdmissionPlan
  extends Omit<ProtocolSsrAdmissionPlan, 'decisions' | 'cemClassifications'> {
  renderableTags: string[];
  clientOnlyTags: string[];
  rejectedTags: string[];
  reasons: Record<string, string>;
  decisions: SsrAdmissionDecision[];
  /** CEM-derived compatibility classifications (from compatibility classifier) */
  cemClassifications?: CompatibilityClassification[];
}

/** Renderer declaration - wraps page SSR output (like Next.js layout.tsx) */
export interface RendererDecl extends ProtocolRendererDecl {
  /** Variable name for the imported module */
  varName: string;
  /** Directory scope (e.g. '/guide') - applies to this dir and subdirs */
  scope: string;
  /** Full import path for Vite SSR */
  importPath: string;
  /** Nesting depth (root=0, deeper dirs have higher depth) */
  depth: number;
}

/** Middleware scope declaration - Hono middleware mounted to directory prefix */
export interface MiddlewareScopeDecl extends ProtocolMiddlewareScopeDecl {
  /** Variable name for the imported module */
  varName: string;
  /** Directory scope (e.g. '/api') */
  scope: string;
  /** Full import path for Vite SSR */
  importPath: string;
}

/** HTML document wrapping configuration */
export interface DocumentConfig extends ProtocolDocumentConfig {
  /** <html> lang attribute (default: 'en') */
  lang: string;
  /** <title> content (default: 'openElement') */
  title: string;
  /**
   * Extra <head> content (e.g. CDN links, analytics).
   *
   * @security Injected as raw HTML without sanitization. Only use with
   * developer-controlled content. Never pass user-supplied strings.
   */
  headExtras: string;
  /** Whether headExtras script tags came from structured, URL-validated injection APIs. */
  allowHeadExtrasScripts: boolean;
}

export interface AppShellDecl extends ProtocolAppShellDecl {
  tagName: string;
  importPath: string;
  props: Record<string, unknown>;
}

export type ResolvedAppShell = ProtocolResolvedAppShell;

export interface AppShellPlan extends ProtocolAppShellPlan {
  default: ResolvedAppShell;
  layouts: Record<string, ResolvedAppShell>;
}

/** Complete structured descriptor of the Hono entry module to be generated */
export interface EntryDescriptor extends
  Omit<
    ProtocolEntryDescriptor,
    'ssrAdmissionPlan' | 'cemClassifications' | 'appShell'
  > {
  /** Whether this is an SSG build (injects DOM shim) */
  isSSG: boolean;

  /** External module imports */
  imports: ImportDecl[];

  /** Middleware registrations (in order) */
  middleware: MiddlewareDecl[];

  /** API route registrations */
  apiRoutes: ApiRouteDecl[];

  /** Page route registrations */
  pageRoutes: PageRouteDecl[];

  /** Known islands for runtime upgrade detection */
  islands: IslandDecl[];

  /** SSR admission plan computed before entry code is generated. */
  ssrAdmissionPlan: SsrAdmissionPlan;

  /** CEM-derived compatibility classifications (from compatibility classifier) */
  cemClassifications?: CompatibilityClassification[];

  /** Additional client-only tag names from external registries (ADR-0035 A1) */
  clientOnlyTags?: string[];

  /** Renderer declarations (from _renderer.ts files) - v0.3.0 */
  renderers: RendererDecl[];

  /** Middleware scope declarations (from _middleware.ts files) - v0.3.0 */
  middlewareScopes: MiddlewareScopeDecl[];

  /** Document wrapping config */
  document: DocumentConfig;

  /** Application shell/layout plan for route wrapping. */
  appShell: AppShellPlan;

  /** Default island hydration strategy (default: 'idle') */
  upgradeStrategy?: HydrationStrategy;

  /** Route info for debug endpoint (dev only) */
  debugRoutes?: Array<{ path: string; type: string }>;
}

/**
 * Build a structured EntryDescriptor from scanned routes and framework options.
 *
 * This is a pure function - same inputs always produce the same descriptor.
 * No side effects, no string concatenation, no code generation.
 */
function normalizeAppShellImport(importPath: string): string {
  if (importPath.startsWith('./')) return `/${importPath.slice(2)}`;
  if (importPath.startsWith('../')) return importPath;
  return importPath;
}

function normalizeAppShell(config: AppShellConfig | undefined): ResolvedAppShell {
  if (config === false) return false;
  if (config === undefined || config === 'default') {
    return {
      tagName: 'open-layout',
      importPath: '@openelement/ui/open-layout',
      props: {},
    };
  }
  return {
    tagName: config.tagName,
    importPath: normalizeAppShellImport(config.import),
    props: config.props ?? {},
  };
}

function buildAppShellPlan(options: {
  appShell?: FrameworkOptions['appShell'];
  layouts?: FrameworkOptions['layouts'];
}): AppShellPlan {
  const defaultShell = normalizeAppShell(options.layouts?.default ?? options.appShell);
  const layouts: Record<string, ResolvedAppShell> = {};
  for (const [name, config] of Object.entries(options.layouts ?? {})) {
    if (name === 'default' || config === undefined) continue;
    layouts[name] = normalizeAppShell(config);
  }
  return { default: defaultShell, layouts };
}

export function buildEntryDescriptor(
  routes: RouteEntry[],
  options: {
    routesDir?: string;
    islandsDir?: string;
    middleware?: FrameworkOptions['middleware'];
    ssg?: boolean;
    islandTagNames?: string[];
    /** Relative file paths for local islands (preserves subdirectory structure) */
    islandFiles?: string[];
    /** Local island metadata indexed by tag name. */
    islandMeta?: Record<string, Partial<IslandDecl>>;
    /** Package manifests discovered from npm/JSR packages */
    packageManifests?: OpenElementPackageManifest[];
    /** CEM-derived compatibility classifications (from compatibility classifier) */
    cemClassifications?: CompatibilityClassification[];
    /** @security Injected as raw HTML without sanitization */
    headExtras?: string;
    allowHeadExtrasScripts?: boolean;
    html?: { lang?: string; title?: string };
    upgradeStrategy?: HydrationStrategy;
    /** Additional client-only tag names from external registries (ADR-0035 A1) */
    clientOnlyTags?: string[];
    appShell?: FrameworkOptions['appShell'];
    layouts?: FrameworkOptions['layouts'];
  } = {},
): EntryDescriptor {
  const routesDir = options.routesDir || 'app/routes';
  const islandsDir = options.islandsDir || 'app/islands';
  const isSSG = options.ssg === true;

  // --- Imports ---
  const imports: ImportDecl[] = [];

  // Always needed
  imports.push({ from: 'hono', names: ['Hono'] });
  // v0.30.0: DSD renderer accepts the VNode/null component contract.
  // Adapter-specific values are converted before they reach core.
  // ADR 0021: Always import from @openelement/core main entry.
  // @openelement/core is a pure runtime with zero Vite/Hono dependencies.
  imports.push({
    from: '@openelement/core',
    names: ['renderDsd', 'renderDsdTree', 'escapeHtml'],
  });

  // Conditional middleware imports
  const mw = options.middleware;
  if (mw?.requestId !== false) {
    imports.push({ from: 'hono/request-id', names: ['requestId'] });
  }
  if (mw?.logger !== false) {
    imports.push({ from: 'hono/logger', names: ['logger'], alias: 'honoLogger' });
  }
  if (mw?.cors !== false) {
    imports.push({ from: 'hono/cors', names: ['cors'] });
  }
  if (mw?.securityHeaders !== false) {
    imports.push({ from: 'hono/secure-headers', names: ['secureHeaders'] });
  }

  // --- Middleware ---
  const middleware: MiddlewareDecl[] = [];

  if (mw?.requestId !== false) {
    middleware.push({
      kind: 'requestId',
      comment: '1. Request ID - base for logging and error tracking',
    });
  }
  if (mw?.logger !== false) {
    middleware.push({
      kind: 'logger',
      comment: '2. Logger - structured request logging',
    });
  }
  if (mw?.cors !== false) {
    // Resolve CORS origin config
    let corsOrigin: CorsOriginConfig | undefined;
    if (mw?.corsOrigin !== undefined) {
      if (typeof mw.corsOrigin === 'string') {
        corsOrigin = mw.corsOrigin;
      } else if (Array.isArray(mw.corsOrigin)) {
        corsOrigin = mw.corsOrigin;
      } else {
        // Function: serialize to string body
        corsOrigin = { type: 'function', body: mw.corsOrigin.toString() };
      }
    }
    middleware.push({
      kind: 'cors',
      comment: '3. CORS - Web Standards (no process.env)',
      config: { corsOrigin },
    });
  }
  if (mw?.securityHeaders !== false) {
    middleware.push({
      kind: 'securityHeaders',
      comment: '4. Security headers',
    });
  }
  if (mw?.csp) {
    middleware.push({
      kind: 'csp',
      comment: '5. Content Security Policy',
      config: { csp: mw.csp },
    });
  }

  // --- Routes ---
  const apiRoutes: ApiRouteDecl[] = routes
    .filter((r) => r.type === 'api' && !r.special)
    .map((r) => ({
      kind: 'api' as const,
      path: r.path,
      varName: `$${r.varName}`,
      filePath: r.filePath,
      importPath: `/${routesDir}/${r.filePath}`,
    }));

  const pageRoutes: PageRouteDecl[] = routes
    .filter((r) => r.type === 'page' && !r.special)
    .map((r) => {
      const isDynamic = r.path.includes(':');
      const paramNames = isDynamic ? [...r.path.matchAll(/:([^/]+)/g)].map((m) => m[1]) : [];
      return {
        kind: 'page' as const,
        path: r.path,
        varName: `$${r.varName}`,
        filePath: r.filePath,
        defaultTagName: fileToTagName(r.filePath),
        tagName: r.tagName || fileToTagName(r.filePath),
        importPath: `/${routesDir}/${r.filePath}`,
        isDynamic,
        paramNames,
      };
    });

  // --- Special files: _renderer.ts / _middleware.ts (v0.3.0) ---
  const specialRoutes = routes.filter((r) => r.type === 'special');

  const renderers: RendererDecl[] = specialRoutes
    .filter((r) => r.special === 'renderer')
    .map((r) => {
      const scope = r.path.replace(/\/?_renderer$/, '') || '/';
      const depth = scope === '/' ? 0 : scope.split('/').filter(Boolean).length;
      return {
        varName: `$${r.varName}`,
        scope,
        importPath: `/${routesDir}/${r.filePath}`,
        depth,
      };
    })
    .sort((a, b) => b.depth - a.depth); // Outer first (root=0, then deeper)

  const middlewareScopes: MiddlewareScopeDecl[] = specialRoutes
    .filter((r) => r.special === 'middleware')
    .map((r) => ({
      varName: `$${r.varName}`,
      scope: r.path.replace(/\/?_middleware$/, '') || '/',
      importPath: `/${routesDir}/${r.filePath}`,
    }));

  // --- Islands ---
  const islandTagNames = options.islandTagNames || [];
  const islandFiles = options.islandFiles || [];
  const islandMeta = options.islandMeta || {};
  const packageManifests = options.packageManifests || [];

  // Local islands - use real file paths when available to support
  // nested directories (e.g. posts/index.ts -> tag "posts-index").
  // Fallback to tagName-based path when no real file path is available.
  const localIslands: IslandDecl[] = islandTagNames.map((tagName, i) => ({
    tagName,
    modulePath: islandFiles[i]
      ? `/${islandsDir}/${islandFiles[i]}`
      : `/${islandsDir}/${tagName}.ts`,
    source: 'local',
    ssr: islandMeta[tagName]?.hydrate === 'only' ? false : islandMeta[tagName]?.ssr,
    dsd: islandMeta[tagName]?.hydrate === 'only' ? false : islandMeta[tagName]?.dsd,
    hydrate: islandMeta[tagName]?.hydrate || options.upgradeStrategy || 'idle',
    reason: islandMeta[tagName]?.reason,
  }));

  // Package islands (extracted from OpenElementPackageManifest declarations)
  const packageIslandDecls: IslandDecl[] = packageManifests.flatMap((pkg) =>
    pkg.declarations
      .filter((d) => d.openElement?.module)
      .map((d) => {
        const modulePath = d.openElement?.module;
        if (!modulePath) {
          throw new Error(
            `Package manifest declaration "${d.tagName}" is missing openElement.module`,
          );
        }
        return {
          tagName: d.tagName,
          modulePath,
          isPackage: true,
          source: 'package',
          hydrate:
            (d.openElement?.hydrate || options.upgradeStrategy || 'idle') as IslandDecl['hydrate'],
          ssr: d.openElement?.hydrate === 'only' ? false : d.openElement?.ssr,
          dsd: d.openElement?.hydrate === 'only' ? false : d.openElement?.dsd,
        };
      })
  );

  // Merge all islands
  const islands: IslandDecl[] = [...localIslands, ...packageIslandDecls];
  const cemClassifications = options.cemClassifications || [];
  const ssrAdmissionPlan = buildSsrAdmissionPlan(
    islands,
    cemClassifications,
    options.clientOnlyTags || [],
  );

  // --- Document ---
  const document: DocumentConfig = {
    lang: options.html?.lang || 'en',
    title: options.html?.title || 'openElement',
    headExtras: options.headExtras || '',
    allowHeadExtrasScripts: options.allowHeadExtrasScripts || false,
  };
  const appShell = buildAppShellPlan({
    appShell: options.appShell,
    layouts: options.layouts,
  });

  // --- Debug routes (dev only) ---
  const debugRoutes = isSSG ? undefined : routes
    .filter((r) => !r.special)
    .map((r) => ({ path: r.path, type: r.type }));

  return {
    isSSG,
    imports,
    middleware,
    apiRoutes,
    pageRoutes,
    islands,
    ssrAdmissionPlan,
    cemClassifications,
    clientOnlyTags: options.clientOnlyTags,
    renderers,
    middlewareScopes,
    document,
    appShell,
    upgradeStrategy: options.upgradeStrategy || 'idle',
    debugRoutes,
  };
}

export function buildSsrAdmissionPlan(
  islands: IslandDecl[],
  cemClassifications: CompatibilityClassification[] = [],
  clientOnlyTags: string[] = [],
): SsrAdmissionPlan {
  const renderableTags: string[] = [];
  const mergedClientOnlyTags: string[] = [];
  const rejectedTags: string[] = [];
  const reasons: Record<string, string> = {};
  const decisions: SsrAdmissionDecision[] = [];
  const seen = new Set<string>();
  // Track which tags have been added to renderableTags/clientOnlyTags
  // so we can remove them if a duplicate is found later.
  const admittedTags = new Set<string>();

  // Build a lookup map from tagName to CEM classification
  const cemMap = new Map<string, CompatibilityClassification>();
  for (const classification of cemClassifications) {
    cemMap.set(classification.tagName, classification);
  }

  for (const island of islands) {
    const source = island.source || (island.isPackage ? 'package' : 'local');

    if (seen.has(island.tagName)) {
      const reason = 'duplicate custom element tag';
      rejectedTags.push(island.tagName);
      reasons[island.tagName] = reason;

      // Remove from renderableTags/clientOnlyTags if previously admitted
      if (admittedTags.has(island.tagName)) {
        const rIdx = renderableTags.indexOf(island.tagName);
        if (rIdx !== -1) renderableTags.splice(rIdx, 1);
        const cIdx = mergedClientOnlyTags.indexOf(island.tagName);
        if (cIdx !== -1) mergedClientOnlyTags.splice(cIdx, 1);
        admittedTags.delete(island.tagName);
      }

      decisions.push({
        tagName: island.tagName,
        modulePath: island.modulePath,
        source,
        renderPath: 'rejected',
        reason,
      });
      continue;
    }
    seen.add(island.tagName);

    let renderPath: SsrAdmissionDecision['renderPath'];
    let reason: string;

    // Check for CEM classification first (v0.18.0: integrate compatibility classifier)
    const cemClassification = cemMap.get(island.tagName);

    if (cemClassification) {
      // ponytail: lookup table replaces 4-case switch
      const TIER_RENDER_PATH: Record<string, string> = {
        'ssr-capable': 'ssr+client',
        'client-only': 'client-only',
        'experimental-dom': 'client-only',
        rejected: 'rejected',
      };

      const knownTier = cemClassification.tier in TIER_RENDER_PATH;
      renderPath = (TIER_RENDER_PATH[cemClassification.tier] ?? 'client-only') as typeof renderPath;
      reason = knownTier
        ? `CEM ${cemClassification.tier}: ${cemClassification.reason}`
        : `Unknown CEM tier (${cemClassification.tier}) - conservative default to client-only`;
    } else if (island.hydrate === 'only') {
      renderPath = 'client-only';
      reason = island.reason || 'client:only island is excluded from SSR';
    } else if (island.ssr === false) {
      renderPath = 'client-only';
      reason = island.reason || 'openElement.ssr is false';
    } else if (source === 'package') {
      // v0.17.4: Package islands with explicit ssr:true now go through SSR.
      // v0.18.0: If no CEM classification exists, apply conservative default.
      // CEM without Less extension defaults to client-only (ADR-0028).
      if (island.ssr === true) {
        renderPath = 'ssr+client';
        reason = 'package island with openElement.ssr=true';
      } else {
        renderPath = 'client-only';
        reason = 'package island has no validated SSR capability (conservative default)';
      }
    } else {
      renderPath = 'ssr+client';
      reason = island.ssr === true ? 'openElement.ssr is true' : 'local island default SSR path';
    }

    if (renderPath === 'ssr+client') {
      renderableTags.push(island.tagName);
      admittedTags.add(island.tagName);
    }
    if (renderPath === 'client-only') {
      mergedClientOnlyTags.push(island.tagName);
      admittedTags.add(island.tagName);
    }
    if (renderPath === 'rejected') {
      rejectedTags.push(island.tagName);
      admittedTags.delete(island.tagName);
    }

    reasons[island.tagName] = reason;
    decisions.push({
      tagName: island.tagName,
      modulePath: island.modulePath,
      source,
      renderPath,
      reason,
    });
  }

  // v0.19.1 Phase 6: Additional registry client-only tags (ADR-0035 A1)
  // Tags from external registry data (e.g. Shoelace, Media Chrome) that are
  // not islands or CEM-classified.
  // Without this, renderDsdTree() would try to instantiate
  // and render them during SSG, causing 72 DSD errors.
  for (const tag of clientOnlyTags) {
    if (!seen.has(tag) && !admittedTags.has(tag)) {
      mergedClientOnlyTags.push(tag);
      admittedTags.add(tag);
      seen.add(tag);
      reasons[tag] = 'Registry client-only component (ADR-0035)';
      decisions.push({
        tagName: tag,
        modulePath: '',
        source: 'nested',
        renderPath: 'client-only',
        reason: 'Registry client-only component (ADR-0035)',
      });
    }
  }

  return {
    renderableTags,
    clientOnlyTags: mergedClientOnlyTags,
    rejectedTags,
    reasons,
    decisions,
    cemClassifications,
  };
}
