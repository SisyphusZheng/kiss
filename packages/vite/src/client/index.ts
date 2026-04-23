/**
 * @hvl/vite/client - Client-side type declarations
 */

/// <reference types="vite/client" />

declare module 'virtual:hvl-routes' {
  export const routes: Array<{
    path: string
    filePath: string
    type: 'page' | 'api'
    module: any
  }>
  export const pageRoutes: typeof routes
  export const apiRoutes: typeof routes
}

declare module 'virtual:hvl-islands' {
  export const islands: Array<{
    tagName: string
    modulePath: string
    module: any
  }>
  export const islandTagNames: string[]
}

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_PUBLIC_ORIGIN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
