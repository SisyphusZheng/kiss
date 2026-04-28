/**
 * @kissjs/core - Public types
 *
 * KISS Architecture (K·I·S·S) types:
 * - SSG is always on (no ssr.preRender option)
 * - No CSR/SPA mode (rejected by discipline)
 * - UI is generic head injection (not WebAwesome-specific)
 * - Islands are the only client JS allowed
 */

import type { Plugin } from 'vite';

/** Package Island metadata exported from npm/JSR packages */
export interface PackageIslandMeta {
  /** Custom element tag name (e.g., 'kiss-theme-toggle') */
  tagName: string;
  /** Module path for import (e.g., '@kissjs/ui/kiss-theme-toggle') */
  modulePath: string;
  /** Hydration strategy (default: 'lazy') */
  strategy?: 'eager' | 'lazy' | 'idle' | 'visible';
}

/** Framework configuration options */
export interface FrameworkOptions {
  /** Directory for file-based routes (default: 'app/routes') */
  routesDir?: string;
  /** Directory for island components (default: 'app/islands') */
  islandsDir?: string;
  /** Directory for shared Lit components (default: 'app/components') */
  componentsDir?: string;

  /**
   * Package islands to auto-import from npm/JSR packages.
   * Each package should export an `islands` array in its main entry.
   * Example: ['@kissjs/ui'] will import islands from '@kissjs/ui/islands'
   */
  packageIslands?: string[];

  /** Extra HTML to inject into <head> (e.g. CDN links, analytics) */
  headExtras?: string;

  /** Document <html> attributes */
  html?: {
    /** Language attribute (default: 'en') */
    lang?: string;
    /** Document title (default: 'KISS App') */
    title?: string;
  };

  /**
   * External resource injection for UI libraries.
   * Generic mechanism — not tied to any specific UI framework.
   * Can be used for WebAwesome, Shoelace, custom CSS, etc.
   */
  inject?: {
    /** CSS stylesheet URLs to inject into <head> */
    stylesheets?: string[];
    /** Module script URLs to inject into <head> */
    scripts?: string[];
    /** Arbitrary HTML fragments to inject into <head> */
    headFragments?: string[];
  };

  /**
   * Legacy UI option (deprecated, use inject instead).
   * Automatically generates headExtras from WebAwesome CDN.
   * @deprecated Use inject.stylesheets + inject.scripts for framework-agnostic head injection
   */
  ui?: {
    /** Enable WebAwesome CDN injection (default: false) */
    cdn?: boolean;
    /** WebAwesome version (default: '3.5.0') */
    version?: string;
  };

  /** SSR build configuration (build-time only, no runtime) */
  ssr?: {
    /** Packages that should not be externalized in SSR build (default: lit packages) */
    noExternal?: (string | RegExp)[];
  };

  /** Island configuration */
  island?: {
    /** Auto-detect islands in islandsDir (default: true) */
    autoDetect?: boolean;
    /** Hydration strategy for all Islands (default: 'lazy') */
    hydrationStrategy?: 'eager' | 'lazy' | 'idle' | 'visible';
  };

  /** Build configuration */
  build?: {
    /** Output directory (default: 'dist') */
    outDir?: string;
  };

  /** Middleware configuration (build-time Hono + dev server only) */
  middleware?: {
    /** Enable CORS (default: true) */
    cors?: boolean;
    /** Allowed CORS origins. Web Standards — no process.env. */
    corsOrigin?: string | string[] | ((origin: string) => string | undefined);
    /** Enable request ID (default: true) */
    requestId?: boolean;
    /** Enable structured logger (default: true) */
    logger?: boolean;
    /** Enable rate limiting (default: false in dev) */
    rateLimit?: boolean;
    /** Enable security headers (default: true) */
    securityHeaders?: boolean;
  };
}

/** Special file types in the routes directory */
export type SpecialFileType = 'renderer' | 'middleware';

/**
 * KissRenderer — interface for _renderer.ts files.
 *
 * Renderers wrap page SSR output, like Next.js layout.tsx or SvelteKit +layout.svelte.
 * They apply to their directory and all subdirectories.
 * Multiple renderers are composed outer → inner (root first, deeper dirs later).
 *
 * Usage:
 * ```ts
 * // app/routes/_renderer.ts
 * import type { KissRenderer } from '@kissjs/core';
 *
 * const renderer: KissRenderer = {
 *   wrap(html, ctx) {
 *     return `<div class="layout"><nav>...</nav><main>${html}</main></div>`;
 *   }
 * };
 * export default renderer;
 * ```
 */
export interface KissRenderer {
  /**
   * Wrap page HTML with layout chrome.
   * @param html - The page's SSR-rendered HTML
   * @param ctx - Request context (provides c.req.path etc.)
   * @returns Wrapped HTML string (or Promise for async operations)
   */
  wrap(html: string, ctx: { req: { path: string }; [key: string]: unknown }): string | Promise<string>;
}

/**
 * KissMiddleware — interface for _middleware.ts files.
 *
 * Middleware is mounted as Hono middleware on the directory prefix.
 * Like Next.js middleware.ts or SvelteKit hooks.server.ts.
 *
 * Usage:
 * ```ts
 * // app/routes/api/_middleware.ts
 * import type { KissMiddleware } from '@kissjs/core';
 * import type { MiddlewareHandler } from 'hono';
 *
 * const middleware: MiddlewareHandler = async (c, next) => {
 *   console.log('API request:', c.req.path);
 *   await next();
 * };
 * export default middleware;
 * ```
 */
export type KissMiddleware = import('hono').MiddlewareHandler;

/** Resolved route entry from file-based routing */
export interface RouteEntry {
  /** URL path pattern (e.g., '/', '/about', '/posts/:id') */
  path: string;
  /** Relative file path from routesDir */
  filePath: string;
  /** Route type */
  type: 'page' | 'api' | 'island' | 'special';
  /** Variable name for module import */
  varName: string;
  /** Special file type (renderer or middleware), if applicable */
  special?: SpecialFileType;
}

/** Metadata extracted from a route module */
export interface RouteMeta {
  title?: string;
  description?: string;
  [key: string]: unknown;
  /** Island chunk URLs for preload hints */
  islandChunks?: string[];
}

export type { SsrContext } from './context.js';

/** The main kiss() function signature */
export type FrameworkPlugin = (options?: FrameworkOptions) => Plugin[];
