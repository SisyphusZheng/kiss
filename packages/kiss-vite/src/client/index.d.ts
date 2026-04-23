/**
 * @kiss/vite/client - Client-side type declarations
 */

// @ts-nocheck

/// <reference types="vite/client" />

declare module 'virtual:kiss-routes' {
  export const routes: Array<{
    path: string
    filePath: string
    type: 'page' | 'api'
    module: any
  }>
  export const pageRoutes: typeof routes
  export const apiRoutes: typeof routes
  export const renderers: Array<{
    scope: string
    module: any
  }>
  export const middlewares: Array<{
    scope: string
    module: any
  }>
}

declare module 'virtual:kiss-islands' {
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
