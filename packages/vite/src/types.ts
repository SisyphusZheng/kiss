/**
 * @hvl/vite - Public types
 */

import type { Plugin } from 'vite'

/** Framework configuration options */
export interface FrameworkOptions {
  /** Directory for file-based routes (default: 'app/routes') */
  routesDir?: string
  /** Directory for island components (default: 'app/islands') */
  islandsDir?: string
  /** Directory for shared Lit components (default: 'app/components') */
  componentsDir?: string

  /** SSR configuration */
  ssr?: {
    /** Packages that should not be externalized in SSR (default: lit packages) */
    noExternal?: string[]
    /** Enable SSG pre-rendering (default: false) */
    preRender?: boolean
    /** Specific routes to pre-render (empty = all static routes) */
    preRenderRoutes?: string[]
  }

  /** Island configuration */
  island?: {
    /** Auto-detect islands in islandsDir (default: true) */
    autoDetect?: boolean
    /** Hydration strategy (default: 'lazy') */
    hydrationStrategy?: 'eager' | 'lazy' | 'idle' | 'visible'
  }

  /** Dev server configuration */
  dev?: {
    /** Dev server port (default: 3000) */
    port?: number
    /** Enable HMR (default: true) */
    hmr?: boolean
    /** Show error overlay (default: true) */
    overlay?: boolean
    /** Enable Open in Editor (default: true) */
    openInEditor?: boolean
    /** Editor to open (default: 'vscode') */
    editor?: 'vscode' | 'cursor' | 'webstorm'
  }

  /** Build configuration */
  build?: {
    /** Output directory (default: 'dist') */
    outDir?: string
    /** SSG output directory (default: 'dist/static') */
    ssgOutDir?: string
  }

  /** Middleware configuration */
  middleware?: {
    /** Enable CORS (default: true) */
    cors?: boolean
    /** Enable request ID (default: true) */
    requestId?: boolean
    /** Enable structured logger (default: true) */
    logger?: boolean
    /** Enable rate limiting (default: false in dev) */
    rateLimit?: boolean
    /** Enable security headers (default: true) */
    securityHeaders?: boolean
  }
}

/** Resolved route entry from file-based routing */
export interface RouteEntry {
  /** URL path pattern (e.g., '/', '/about', '/posts/:id') */
  path: string
  /** Relative file path from routesDir */
  filePath: string
  /** Route type */
  type: 'page' | 'api'
  /** Variable name for module import */
  varName: string
}

/** Island metadata collected during SSR */
export interface IslandMeta {
  /** Custom element tag name (e.g., 'my-counter') */
  tagName: string
  /** Module path for dynamic import */
  modulePath: string
  /** Estimated client JS size */
  estimatedSize?: string
}

/** SSR render context passed through the rendering pipeline */
export interface SsrContext {
  /** Matched route */
  route: RouteEntry
  /** Request URL */
  url: URL
  /** Request params (e.g., { id: '123' }) */
  params: Record<string, string>
  /** Request query parameters */
  query: Record<string, string>
  /** Islands collected during render */
  islands: IslandMeta[]
  /** HTTP status code */
  status: number
}

/** The main framework() function signature */
export type FrameworkPlugin = (options?: FrameworkOptions) => Plugin[]
