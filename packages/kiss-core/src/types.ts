/**
 * @kiss/vite - Public types
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

/** Special file types in the routes directory */
export type SpecialFileType = 'renderer' | 'middleware'

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
  /** Special file type (renderer or middleware), if applicable */
  special?: SpecialFileType
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

/** Metadata extracted from a route module */
export interface RouteMeta {
  title?: string
  description?: string
  [key: string]: unknown
  /** Island chunk URLs for preload hints */
  islandChunks?: string[]
}

export type { SsrContext } from './context.js'

/** The main framework() function signature */
export type FrameworkPlugin = (options?: FrameworkOptions) => Plugin[]
