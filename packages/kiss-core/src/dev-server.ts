/**
 * @kiss/vite - Dev server plugin
 * Integrates Hono as Vite middleware in dev mode.
 * Handles page SSR rendering and API routing.
 */

import { Buffer } from 'node:buffer'
import type { Plugin, ViteDevServer } from 'vite'
import type { FrameworkOptions, RouteEntry, IslandMeta } from './types.js'
import { createHonoApp } from './hono-app.js'
import { scanRoutes, scanIslands, generateRoutesModule, generateIslandsModule, fileToTagName } from './route-scanner.js'
import { renderPageToString, renderSsrError, wrapInDocument } from './ssr-handler.js'
import { generateHydrationScript } from './island-transform.js'
import { getKnownIslandsMap } from './island-extractor.js'
import { extractRouteMeta } from './html-template.js'
import { join } from 'node:path'

const VIRTUAL_ROUTES = 'virtual:kiss-routes'
const VIRTUAL_ISLANDS = 'virtual:kiss-islands'
const RESOLVED_ROUTES = '\0' + VIRTUAL_ROUTES
const RESOLVED_ISLANDS = '\0' + VIRTUAL_ISLANDS

export function devServerPlugin(options: FrameworkOptions = {}): Plugin {
  const routesDir = options.routesDir || 'app/routes'
  const islandsDir = options.islandsDir || 'app/islands'
  const hydrationStrategy = options.island?.hydrationStrategy || 'lazy'

  let server: ViteDevServer
  let cachedRoutes: RouteEntry[] = []
  let cachedIslandFiles: string[] = []
  let knownIslandsMap: Map<string, string> = new Map()

  return {
    name: 'kiss:dev-server',

    async configureServer(viteServer) {
      server = viteServer

      // Scan routes and islands immediately at startup
      const root = viteServer.config.root
      cachedRoutes = await scanRoutes(join(root, routesDir))
      cachedIslandFiles = await scanIslands(join(root, islandsDir))
      knownIslandsMap = getKnownIslandsMap(cachedIslandFiles, islandsDir)

      console.log(`[KISS] Routes: ${cachedRoutes.filter(r => !r.special).map(r => r.path).join(', ') || '(none)'}`)
      console.log(`[KISS] Islands: ${cachedIslandFiles.map(f => `<${fileToTagName(f)}>`).join(', ') || '(none)'}`)

      // Create Hono app with middleware
      const app = createHonoApp(options)

      // Debug endpoint
      app.get('/__kiss', (c) => {
        return c.json({
          version: '0.0.1',
          routes: cachedRoutes
            .filter(r => !r.special)
            .map(r => ({
              path: r.path,
              file: r.filePath,
              type: r.type,
            })),
          specialFiles: cachedRoutes
            .filter(r => r.special)
            .map(r => ({
              type: r.special,
              file: r.filePath,
            })),
          islands: cachedIslandFiles.map(f => ({
            tag: fileToTagName(f),
            file: f,
          })),
          ssr: { engine: '@lit-labs/ssr', dsd: true },
        })
      })

      // API routes: forward to route modules that export Hono instances
      // Must be registered before the catch-all page route
      app.get('/api/*', async (c) => {
        return handleApiRoute(c, cachedRoutes, viteServer, routesDir)
      })
      app.post('/api/*', async (c) => {
        return handleApiRoute(c, cachedRoutes, viteServer, routesDir)
      })
      app.put('/api/*', async (c) => {
        return handleApiRoute(c, cachedRoutes, viteServer, routesDir)
      })
      app.delete('/api/*', async (c) => {
        return handleApiRoute(c, cachedRoutes, viteServer, routesDir)
      })
      app.patch('/api/*', async (c) => {
        return handleApiRoute(c, cachedRoutes, viteServer, routesDir)
      })

      // Page routes: SSR rendering
      app.get('*', async (c) => {
        const url = new URL(c.req.url)

        console.log(`[KISS DEBUG] Hono GET * matched: ${url.pathname}`)

        // Skip Vite internal requests
        if (url.pathname.startsWith('/@') || url.pathname.startsWith('/__vite')) {
          return new Response(null, { status: 404 })
        }

        // Skip requests for static assets (files with extensions)
        const lastSegment = url.pathname.split('/').pop() || ''
        if (lastSegment.includes('.') && !url.pathname.endsWith('/')) {
          // Likely a static file request — let Vite handle it
          return new Response(null, { status: 404 })
        }

        // Try to match a page route
        const route = matchPageRoute(cachedRoutes, url.pathname)
        if (!route) {
          // Not our route — let Vite handle it
          return new Response(null, { status: 404 })
        }

        try {
          const { html, islands } = await renderPageToString(
            viteServer,
            route,
            c.req.raw,
            { routesDir, islandsDir, componentsDir: options.componentsDir }
          )

          const module = await viteServer.ssrLoadModule(`/${routesDir}/${route.filePath}`)
          const routeMeta = extractRouteMeta(module)

          const hydrateScript = islands.length > 0
            ? generateHydrationScript(islands, hydrationStrategy)
            : ''

          const fullHtml = wrapInDocument(html, {
            title: routeMeta.title,
            hydrateScript,
            meta: routeMeta.description
              ? { description: routeMeta.description }
              : undefined,
            devMode: true,
            routeModulePath: `/${routesDir}/${route.filePath}`,
            componentsDir: options.componentsDir,
          })

          return c.html(fullHtml)
        } catch (error) {
          console.error('[KISS] SSR Error:', error)
          const isDev = viteServer.config.mode === 'development'
          const errorHtml = renderSsrError(error as Error, 500)
          return c.html(errorHtml, 500)
        }
      })

      // Register as Vite middleware — direct registration (pre-hook)
      // so our middleware runs BEFORE Vite's built-in middleware stack.
      // We only handle routes we know about; everything else passes through to Vite.
      viteServer.middlewares.use(async (req, res, next) => {
        try {
          const protocol = req.headers['x-forwarded-proto'] || 'http'
          const host = req.headers.host || 'localhost:3000'
          const url = `${protocol}://${host}${req.url}`

          console.log(`[KISS DEBUG] ${req.method} ${req.url} → ${url}`)

          const headers = new Headers()
          for (const [key, value] of Object.entries(req.headers)) {
            if (value) headers.set(key, Array.isArray(value) ? value[0] : value)
          }

          const init: RequestInit = {
            method: req.method || 'GET',
            headers,
          }

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

          // If Hono returned 404 with empty body, pass through to Vite
          if (response.status === 404) {
            const contentType = response.headers.get('content-type') || ''
            // Our 404s are JSON; empty 404 means "not our route"
            if (!contentType) {
              next()
              return
            }
          }

          // Write Hono's response
          res.statusCode = response.status
          response.headers.forEach((value, key) => {
            res.setHeader(key, value)
          })
          const body = await response.arrayBuffer()
          res.end(Buffer.from(body))
        } catch (error) {
          console.error('[KISS] Middleware error:', error)
          next()
        }
      })
    },

    // Virtual module: routes
    resolveId(id) {
      if (id === VIRTUAL_ROUTES) return RESOLVED_ROUTES
      if (id === VIRTUAL_ISLANDS) return RESOLVED_ISLANDS
    },

    async load(id) {
      if (id === RESOLVED_ROUTES) {
        const root = server?.config.root || process.cwd()
        cachedRoutes = await scanRoutes(join(root, routesDir))
        return generateRoutesModule(cachedRoutes, routesDir)
      }

      if (id === RESOLVED_ISLANDS) {
        const root = server?.config.root || process.cwd()
        cachedIslandFiles = await scanIslands(join(root, islandsDir))
        knownIslandsMap = getKnownIslandsMap(cachedIslandFiles, islandsDir)
        return generateIslandsModule(islandsDir, cachedIslandFiles)
      }
    },
  }
}

function matchPageRoute(routes: RouteEntry[], pathname: string): RouteEntry | null {
  const exact = routes.find(r => !r.special && r.type === 'page' && r.path === pathname)
  if (exact) return exact

  for (const route of routes) {
    if (route.special || route.type !== 'page') continue
    if (!route.path.includes(':')) continue
    const pattern = route.path.replace(/:[^/]+/g, '[^/]+')
    const regex = new RegExp(`^${pattern}$`)
    if (regex.test(pathname)) return route
  }

  return null
}

function matchApiRoute(routes: RouteEntry[], pathname: string): RouteEntry | null {
  // The route path from scanRoutes already includes /api prefix
  // e.g., api/hello.ts → path = '/api/hello'
  const exact = routes.find(r => !r.special && r.type === 'api' && r.path === pathname)
  if (exact) return exact

  // Try prefix match for nested API routes
  for (const route of routes) {
    if (route.special || route.type !== 'api') continue
    if (pathname.startsWith(route.path)) return route
  }

  return null
}

/**
 * Handle API route requests — load the route module and forward to its Hono sub-app.
 */
async function handleApiRoute(
  c: any,
  cachedRoutes: RouteEntry[],
  viteServer: ViteDevServer,
  routesDir: string
) {
  // Use Hono's req.path which is just the pathname
  const pathname = c.req.path
  console.log(`[KISS] API route handler: pathname=${pathname}`)
  const route = matchApiRoute(cachedRoutes, pathname)
  if (!route) {
    console.log(`[KISS] No API route matched for: ${pathname}`)
    console.log(`[KISS] Available API routes:`, cachedRoutes.filter(r => r.type === 'api').map(r => r.path))
    return c.json({ error: { code: 'NOT_FOUND', message: 'API route not found' } }, 404)
  }

  try {
    const module = await viteServer.ssrLoadModule(`/${routesDir}/${route.filePath}`)
    const apiApp = module.default
    if (apiApp && typeof apiApp.fetch === 'function') {
      // Rewrite the URL to strip the API prefix for the sub-app
      // The sub-app defines routes relative to its own root (e.g., '/' for GET /api/hello)
      // But the incoming request has the full path (e.g., '/api/hello')
      // We need to strip the route's path prefix so the sub-app sees '/'
      const subPath = pathname.slice(route.path.length) || '/'
      const newUrl = new URL(c.req.url)
      newUrl.pathname = subPath
      const newRequest = new Request(newUrl.toString(), c.req.raw)
      return apiApp.fetch(newRequest)
    }
    return c.json({ error: { code: 'INVALID_API', message: 'API route must export a Hono instance' } }, 500)
  } catch (error) {
    console.error('[KISS] API Error:', error)
    return c.json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, 500)
  }
}
