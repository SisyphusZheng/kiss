/**
 * @kissjs/core - Entry Descriptor
 *
 * Structured data model describing the generated Hono entry module.
 * This is a pure data object — no code generation logic lives here.
 *
 * Architecture:
 *   routes + options → buildEntryDescriptor() → EntryDescriptor
 *   EntryDescriptor  → renderEntry()           → string (virtual module code)
 *
 * Separating "what to generate" from "how to render it" makes the
 * entry pipeline testable, serializable, and diffable.
 */

import type { FrameworkOptions, PackageIslandMeta, RouteEntry } from './types.js';
import { fileToTagName } from './route-scanner.js';

// ─── Import declarations ───────────────────────────────────────

/** Import declaration for the generated entry module */
export interface ImportDecl {
  /** Module specifier (e.g. 'hono', 'hono/cors') */
  from: string;
  /** Named imports (e.g. ['Hono'], ['cors']) */
  names: string[];
  /** Optional alias for the first name (e.g. import { logger as honoLogger }) */
  alias?: string;
}

// ─── Middleware declarations ────────────────────────────────────

/** CORS origin configuration — string, array of strings, or serialized function body */
export type CorsOriginConfig =
  | string
  | string[]
  | { type: 'function'; body: string };

/** CSP configuration for Content-Security-Policy header */
export interface CspConfig {
  /** CSP policy string (e.g. "default-src 'self'; script-src 'self'") */
  policy: string;
  /** Auto-generate nonce for <script> tags (default: false) */
  nonce?: boolean;
  /** Report-only mode (default: false) */
  reportOnly?: boolean;
}

/** Middleware registration declaration for the Hono entry */
export interface MiddlewareDecl {
  kind: 'requestId' | 'logger' | 'cors' | 'securityHeaders' | 'csp';
  /** Comments to emit before the middleware registration */
  comment?: string;
  /** Extra config (e.g. CORS origin, CSP policy) */
  config?: {
    corsOrigin?: CorsOriginConfig;
    csp?: CspConfig;
  };
}

// ─── Route declarations ────────────────────────────────────────

/** API route declaration (e.g. /api/hello) */
export interface ApiRouteDecl {
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
export interface PageRouteDecl {
  kind: 'page';
  /** URL path pattern */
  path: string;
  /** Variable name for the imported module */
  varName: string;
  /** Relative file path from routesDir */
  filePath: string;
  /** Default custom element tag name derived from file name */
  defaultTagName: string;
  /** Full import path for Vite SSR (e.g. '/app/routes/about.ts') */
  importPath: string;
}

/** Union type for all route declarations */
export type RouteDecl = ApiRouteDecl | PageRouteDecl;

// ─── Island declarations ───────────────────────────────────────

/** Island component declaration for runtime hydration detection */
export interface IslandDecl {
  /** Custom element tag name */
  tagName: string;
  /** Module path for dynamic import (e.g. '/app/islands/counter.ts') */
  modulePath: string;
}

// ─── Special file declarations (v0.3.0) ─────────────────────────

/** Renderer declaration — wraps page SSR output (like Next.js layout.tsx) */
export interface RendererDecl {
  /** Variable name for the imported module */
  varName: string;
  /** Directory scope (e.g. '/guide') — applies to this dir and subdirs */
  scope: string;
  /** Full import path for Vite SSR */
  importPath: string;
  /** Nesting depth (root=0, deeper dirs have higher depth) */
  depth: number;
}

/** Middleware scope declaration — Hono middleware mounted to directory prefix */
export interface MiddlewareScopeDecl {
  /** Variable name for the imported module */
  varName: string;
  /** Directory scope (e.g. '/api') */
  scope: string;
  /** Full import path for Vite SSR */
  importPath: string;
}

// ─── Document config ───────────────────────────────────────────

/** HTML document wrapping configuration */
export interface DocumentConfig {
  /** <html> lang attribute (default: 'en') */
  lang: string;
  /** <title> content (default: 'KISS App') */
  title: string;
  /** Extra <head> content (e.g. CDN links) */
  headExtras: string;
}

// ─── Top-level descriptor ──────────────────────────────────────

/** Complete structured descriptor of the Hono entry module to be generated */
export interface EntryDescriptor {
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

  /** Known islands for runtime detection */
  islands: IslandDecl[];

  /** Renderer declarations (from _renderer.ts files) — v0.3.0 */
  renderers: RendererDecl[];

  /** Middleware scope declarations (from _middleware.ts files) — v0.3.0 */
  middlewareScopes: MiddlewareScopeDecl[];

  /** Document wrapping config */
  document: DocumentConfig;

  /** Hydration strategy for Islands (default: 'lazy') */
  hydrationStrategy?: 'eager' | 'lazy' | 'idle' | 'visible';

  /** Route info for debug endpoint (dev only) */
  debugRoutes?: Array<{ path: string; type: string }>;
}

// ─── Builder: routes + options → EntryDescriptor ───────────────

/**
 * Build a structured EntryDescriptor from scanned routes and framework options.
 *
 * This is a pure function — same inputs always produce the same descriptor.
 * No side effects, no string concatenation, no code generation.
 */
export function buildEntryDescriptor(
  routes: RouteEntry[],
  options: {
    routesDir?: string;
    islandsDir?: string;
    middleware?: FrameworkOptions['middleware'];
    ssg?: boolean;
    islandTagNames?: string[];
    packageIslands?: PackageIslandMeta[];
    headExtras?: string;
    html?: { lang?: string; title?: string };
    hydrationStrategy?: 'eager' | 'lazy' | 'idle' | 'visible';
  } = {},
): EntryDescriptor {
  const routesDir = options.routesDir || 'app/routes';
  const islandsDir = options.islandsDir || 'app/islands';
  const isSSG = options.ssg === true;

  // --- Imports ---
  const imports: ImportDecl[] = [];

  // Always needed
  imports.push({ from: 'hono', names: ['Hono'] });
  imports.push({ from: '@lit-labs/ssr', names: ['render'], alias: 'litRender' });
  imports.push({ from: 'lit', names: ['html'] });
  imports.push({ from: 'lit/directives/unsafe-html.js', names: ['unsafeHTML'] });
  imports.push({ from: '@lit-labs/ssr/lib/render-result.js', names: ['collectResult'] });

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
      comment: '1. Request ID — base for logging and error tracking',
    });
  }
  if (mw?.logger !== false) {
    middleware.push({
      kind: 'logger',
      comment: '2. Logger — structured request logging',
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
      comment: '3. CORS — Web Standards (no process.env)',
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
    .map((r) => ({
      kind: 'page' as const,
      path: r.path,
      varName: `$${r.varName}`,
      filePath: r.filePath,
      defaultTagName: fileToTagName(r.filePath),
      importPath: `/${routesDir}/${r.filePath}`,
    }));

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
  const packageIslands = options.packageIslands || [];

  // Local islands
  const localIslands: IslandDecl[] = islandTagNames.map((tagName) => ({
    tagName,
    modulePath: `/${islandsDir}/${tagName}.ts`,
  }));

  // Package islands (from npm/JSR packages)
  const packageIslandDecls: IslandDecl[] = packageIslands.map((island) => ({
    tagName: island.tagName,
    modulePath: island.modulePath,
  }));

  // Merge all islands
  const islands: IslandDecl[] = [...localIslands, ...packageIslandDecls];

  // --- Document ---
  const document: DocumentConfig = {
    lang: options.html?.lang || 'en',
    title: options.html?.title || 'KISS App',
    headExtras: options.headExtras || '',
  };

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
    renderers,
    middlewareScopes,
    document,
    hydrationStrategy: options.hydrationStrategy || 'lazy',
    debugRoutes,
  };
}
