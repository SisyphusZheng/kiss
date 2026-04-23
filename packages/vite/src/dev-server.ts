/**
 * @hvl/vite - Dev server plugin
 * Integrates Hono as Vite middleware in dev mode.
 * Handles page SSR rendering and API routing.
 */

import type { Plugin, ViteDevServer } from 'vite'
import type { FrameworkOptions, RouteEntry, IslandMeta } from './types.js'
import { createHonoApp } from './hono-app.js'
import { scanRoutes, scanIslands, generateRoutesModule, generateIslandsModule, fileToTagName } from './route-scanner.js'
import { renderPageToString, renderSSRError, wrapInDocument } from './ssr-handler.js'
import { generateHydrationScript } from './island-transform.js'
import { join } from 'node:path'

const VIRTUAL_ROUTES = 'virtual:hvl-routes'
const VIRTUAL_ISLANDS = 'virtual:hvl-islands'
const RESOLVED_ROUTES = '\0' + VIRTUAL_ROUTES
const RESOLVED_ISLANDS = '\0' + VIRTUAL_ISLANDS

export function devServerPlugin(options: FrameworkOptions = {}): Plugin {
  const routesDir = options.routesDir || 'app/routes'
  const islandsDir = options.islandsDir || 'app/islands'
  const hydrationStrategy = options.island?.hydrationStrategy || 'lazy'

  let server: ViteDevServer
  let cachedRoutes: RouteEntry[] = []
  let cachedIslandFiles: string[] = []

  return {
    name: 'hvl:dev-server',

    configureServer(viteServer) {
      server = viteServer

      // Create Hono app with middleware
      const app = createHonoApp(options)

      // Debug endpoint
      app.get('/__hvl', (c) => {
        return c.json({
          version: '0.1.0',
          routes: cachedRoutes.map(r => ({
            path: r.path,
            file: r.filePath,
            type: r.type,
          })),
          islands: cachedIslandFiles.map(f => ({
            tag: fileToTagName(f),
            file: f,
          })),
          ssr: { engine: '@lit-labs/ssr', dsd: true },
        })
      })

      // API routes: forward to route modules that export Hono instances
      app.all('/api/*', async (c) => {
        const url = new URL(c.req.url)
        const route = matchApiRoute(cachedRoutes, url.pathname)
        if (!route) {
          return c.json({ error: { code: 'NOT_FOUND', message: 'API route not found' } }, 404)
        }

        try {
          const module = await viteServer.ssrLoadModule(`/${routesDir}/${route.filePath}`)
          const apiApp = module.default
          if (apiApp && typeof apiApp.fetch === 'function') {
            // Forward the request to the Hono sub-app
            return apiApp.fetch(c.req.raw)
          }
          return c.json({ error: { code: 'INVALID_API', message: 'API route must export a Hono instance' } }, 500)
        } catch (error) {
          console.error('[HVL] API Error:', error)
          return c.json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, 500)
        }
      })

      // Page routes: SSR rendering
      app.get('*', async (c) => {
        const url = new URL(c.req.url)

        // Skip Vite internal requests
        if (url.pathname.startsWith('/@') || url.pathname.startsWith('/__vite')) {
          return c.notFound()
        }

        // Try to match a page route
        const route = matchPageRoute(cachedRoutes, url.pathname)
        if (!route) {
          // Let Vite handle static assets and 404
          return c.notFound()
        }

        try {
          const { html, islands } = await renderPageToString(
            viteServer,
            route,
            url,
            routesDir
          )

          // Generate hydration script if islands detected
          const hydrateScript = islands.length > 0
            ? generateHydrationScript(islands, hydrationStrategy)
            : ''

          // Wrap in full HTML document
          const fullHtml = wrapInDocument(html, {
            hydrateScript,
          })

          return c.html(fullHtml)
        } catch (error) {
          console.error('[HVL] SSR Error:', error)
          const isDev = viteServer.config.mode === 'development'
          const errorHtml = renderSSRError(error as Error, route, isDev)
          return c.html(errorHtml, 500)
        }
      })

      // Inject Hono as Vite middleware (after Vite's built-in middleware)
      return () => {
        viteServer.middlewares.use(async (req, res, next) => {
          try {
            // Convert Node.js IncomingMessage to Web Request
            const protocol = req.headers['x-forwarded-proto'] || 'http'
            const host = req.headers.host || 'localhost:3000'
            const url = `${protocol}://${host}${req.url}`

            const headers = new Headers()
            for (const [key, value] of Object.entries(req.headers)) {
              if (value) headers.set(key, Array.isArray(value) ? value[0] : value)
            }

            const init: RequestInit = {
              method: req.method || 'GET',
              headers,
            }

            // Handle request body for POST/PUT/PATCH
            if (req.method !== 'GET' && req.method !== 'HEAD') {
              const chunks: Buffer[] = []
              for await (const chunk of req) {
                chunks.push(chunk)
              }
              if (chunks.length > 0) {
                init.body = Buffer.concat(chunks)
              }
            }

            const request = new Request(url, init)
            const response = await app.fetch(request)

            if (response) {
              res.statusCode = response.status
              response.headers.forEach((value, key) => {
                res.setHeader(key, value)
              })
              const body = await response.arrayBuffer()
              res.end(Buffer.from(body))
            } else {
              next()
            }
          } catch (error) {
            console.error('[HVL] Middleware error:', error)
            next()
          }
        })
      }
    },

    // Virtual module: routes
    resolveId(id) {
      if (id === VIRTUAL_ROUTES) return RESOLVED_ROUTES
      if (id === VIRTUAL_ISLANDS) return RESOLVED_ISLANDS
    },

    async load(id) {
      if (id === RESOLVED_ROUTES) {
        // Re-scan routes on each load (in dev, for HMR)
        const root = server?.config.root || process.cwd()
        cachedRoutes = await scanRoutes(join(root, routesDir))
        return generateRoutesModule(cachedRoutes, routesDir)
      }

      if (id === RESOLVED_ISLANDS) {
        const root = server?.config.root || process.cwd()
        cachedIslandFiles = await scanIslands(join(root, islandsDir))
        return generateIslandsModule(islandsDir, cachedIslandFiles)
      }
    },
  }
}

/**
 * Match a page route from the route table.
 */
function matchPageRoute(routes: RouteEntry[], pathname: string): RouteEntry | null {
  // Try exact match first
  const exact = routes.find(r => r.type === 'page' && r.path === pathname)
  if (exact) return exact

  // Try dynamic match
  for (const route of routes) {
    if (route.type !== 'page') continue
    if (!route.path.includes(':')) continue

    const pattern = route.path.replace(/:[^/]+/g, '[^/]+')
    const regex = new RegExp(`^${pattern}$`)
    if (regex.test(pathname)) return route
  }

  return null
}

/**
 * Match an API route from the route table.
 */
function matchApiRoute(routes: RouteEntry[], pathname: string): RouteEntry | null {
  // Try exact match
  const exact = routes.find(r => r.type === 'api' && `/api${r.path}` === pathname)
  if (exact) return exact

  // The route path already includes /api prefix from file path
  const byPath = routes.find(r => r.type === 'api' && r.path === pathname)
  if (byPath) return byPath

  // Try prefix match for nested API routes
  for (const route of routes) {
    if (route.type !== 'api') continue
    if (pathname.startsWith(route.path)) return route
  }

  return null
}
