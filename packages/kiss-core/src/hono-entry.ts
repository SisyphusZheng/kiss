/**
 * @kiss/core - Hono entry generator
 *
 * Generates a virtual module string that exports a Hono app
 * with all routes registered (API + page/SSR) and middleware configured.
 *
 * This generated module is consumed by @hono/vite-dev-server
 * (dev mode) and @hono/vite-ssg (build/SSG mode).
 */

import type { RouteEntry, FrameworkOptions } from './types.js'
import { fileToTagName } from './route-scanner.js'

/** Resolved middleware config with defaults applied */
interface MiddlewareConfig {
  requestId: boolean
  logger: boolean
  cors: boolean
  securityHeaders: boolean
}

/**
 * Generate the Hono entry module code from scanned routes.
 *
 * The generated code:
 * 1. (SSG mode) Imports DOM shim before any Lit code
 * 2. Imports Hono + middleware
 * 3. Imports route modules (via Vite SSR)
 * 4. Creates a Hono app
 * 5. Registers middleware (requestId, logger, cors, secureHeaders)
 * 6. Registers API routes (forward to sub-app)
 * 7. Registers page routes (Lit SSR → HTML)
 * 8. Exports the app as default
 */
export function generateHonoEntryCode(
  routes: RouteEntry[],
  options: { routesDir?: string; componentsDir?: string; middleware?: FrameworkOptions['middleware']; ssg?: boolean } = {},
): string {
  const routesDir = options.routesDir || 'app/routes'
  const isSSG = options.ssg === true

  // Resolve middleware config with defaults (all enabled by default)
  const mw: MiddlewareConfig = {
    requestId: options.middleware?.requestId !== false,
    logger: options.middleware?.logger !== false,
    cors: options.middleware?.cors !== false,
    securityHeaders: options.middleware?.securityHeaders !== false,
  }

  // Separate routes
  const apiRoutes = routes.filter(r => r.type === 'api' && !r.special)
  const pageRoutes = routes.filter(r => r.type === 'page' && !r.special)

  const lines: string[] = []

  // --- SSG: DOM shim must be the very first import ---
  if (isSSG) {
    lines.push(`import '@lit-labs/ssr/lib/install-global-dom-shim.js'`)
    lines.push(``)
  }

  // --- Imports ---
  lines.push(`import { Hono } from 'hono'`)
  if (mw.requestId) lines.push(`import { requestId } from 'hono/request-id'`)
  if (mw.logger) lines.push(`import { logger as honoLogger } from 'hono/logger'`)
  if (mw.cors) lines.push(`import { cors } from 'hono/cors'`)
  if (mw.securityHeaders) lines.push(`import { secureHeaders } from 'hono/secure-headers'`)
  lines.push(`import { render as litRender } from '@lit-labs/ssr'`)
  lines.push(`import { html } from 'lit'`)
  lines.push(`import { unsafeHTML } from 'lit/directives/unsafe-html.js'`)
  lines.push(
    `import { collectResult } from '@lit-labs/ssr/lib/render-result.js'`,
  )
  // Strip Lit SSR comment markers for clean HTML output
  lines.push(`function stripLitComments(html) { return html.replace(/<!--\\/?(?:lit-part|lit-node)[^>]*-->/g, '') }`)
  // Wrap rendered HTML in a full document
  lines.push(`function wrapDocument(body) {`)
  lines.push(`  return '<!DOCTYPE html>\\n<html lang="en">\\n<head>\\n  <meta charset="UTF-8">\\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\\n  <title>KISS App</title>\\n</head>\\n<body>\\n' + body + '\\n</body>\\n</html>'`)
  lines.push(`}`)
  lines.push(``)

  // Import route modules — use Vite SSR compatible paths
  for (const route of [...apiRoutes, ...pageRoutes]) {
    const importPath = `/${routesDir}/${route.filePath}`
    lines.push(`import * as $${route.varName} from '${importPath}'`)
  }
  lines.push(``)

  // --- Helper: SSR render function ---
  // The generated code needs Lit html`` template with nested backticks and ${} interpolation.
  // We can't use template strings to build these lines (esbuild would parse them),
  // so we use string concatenation with char codes.
  // Generated code:
  //   async function __ssr(tag) {
  //     const tpl = html`${unsafeHTML(`<${tag}></${tag}>`)}`
  //     const result = litRender(tpl)
  //     return await collectResult(result)
  //   }
  // IMPORTANT: unsafeHTML must be in expression position (NOT in element position <${...}>),
  // otherwise Lit throws "Unexpected final partIndex" error.
  const BT = '\x60'       // backtick: `
  const DI = '\x24{'      // template interpolation open: ${
  const DC = '}'          // template interpolation close: }
  lines.push('// SSR helper: render a custom element tag to HTML string')
  lines.push('async function __ssr(tag) {')
  lines.push(
    '  const tpl = html' + BT + DI + 'unsafeHTML(' + BT + '<' + DI + 'tag' + DC + '></' + DI + 'tag' + DC + '>' + BT + ')' + DC + BT,
  )
  lines.push('  const result = litRender(tpl)')
  lines.push('  return await collectResult(result)')
  lines.push('}')
  lines.push('')

  // --- App creation + Middleware ---
  lines.push(`const app = new Hono()`)
  lines.push(``)

  // Register middleware in order: requestId → logger → cors → security
  if (mw.requestId) {
    lines.push(`// 1. Request ID — base for logging and error tracking`)
    lines.push(`app.use('*', requestId())`)
    lines.push(``)
  }
  if (mw.logger) {
    lines.push(`// 2. Logger — structured request logging`)
    lines.push(`app.use('*', honoLogger())`)
    lines.push(``)
  }
  if (mw.cors) {
    lines.push(`// 3. CORS`)
    lines.push(`app.use('*', cors({ origin: (origin) => {`)
    lines.push(`  if (origin && /^http:\\/\\/localhost:\\d+$/.test(origin)) return origin`)
    lines.push(`  return process.env.ORIGIN || origin`)
    lines.push(`}, allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], allowHeaders: ['Content-Type', 'Authorization'], credentials: true, maxAge: 86400 }))`)
    lines.push(``)
  }
  if (mw.securityHeaders) {
    lines.push(`// 4. Security headers`)
    lines.push(`app.use('*', secureHeaders())`)
    lines.push(``)
  }

  // --- Debug endpoint ---
  const debugRoutes = JSON.stringify(
    routes.filter(r => !r.special).map(r => ({ path: r.path, type: r.type })),
  )
  lines.push(`// Debug: GET /__kiss`)
  lines.push(`app.get('/__kiss', (c) => {`)
  lines.push(`  return c.json({`)
  lines.push(`    routes: ${debugRoutes},`)
  lines.push(`  })`)
  lines.push(`})`)
  lines.push(``)

  // --- API routes ---
  for (const route of apiRoutes) {
    const varName = `$${route.varName}`
    // API routes: the module's default export is a Hono sub-app
    // We need to strip the prefix and forward
    const basePath = route.path // e.g. "/api/hello"
    lines.push(`// API: ${route.path} (${route.filePath})`)
    lines.push(`app.all('${basePath}', async (c) => {`)
    lines.push(`  const subApp = ${varName}.default`)
    lines.push(`  if (subApp && typeof subApp.fetch === 'function') {`)
    lines.push(`    const subPath = c.req.path.slice(${basePath.length}) || '/'`)
    lines.push(`    const url = new URL(c.req.url)`)
    lines.push(`    url.pathname = subPath`)
    lines.push(`    return subApp.fetch(new Request(url.toString(), c.req.raw))`)
    lines.push(`  }`)
    lines.push(`  return c.json({ error: 'Invalid API route module' }, 500)`)
    lines.push(`})`)
    lines.push(``)
  }

  // --- Page routes (SSR) ---
  for (const route of pageRoutes) {
    const varName = `$${route.varName}`
    const defaultTagName = fileToTagName(route.filePath)
    lines.push(`// Page: ${route.path} (${route.filePath})`)
    lines.push(`app.get('${route.path}', async (c) => {`)
    lines.push(`  try {`)
    lines.push(
      `    const tag = ${varName}.tagName || '${defaultTagName}'`,
    )
    lines.push(`    const raw = await __ssr(tag)`)
    lines.push(`    const clean = stripLitComments(raw)`)
    lines.push(`    return c.html(wrapDocument(clean))`)
    lines.push(`  } catch (err) {`)
    lines.push(
      `    return c.html('<h1>500</h1><p>' + String(err) + '</p>', 500)`,
    )
    lines.push(`  }`)
    lines.push(`})`)
    lines.push(``)
  }

  // --- Export ---
  lines.push(`export default app`)

  return lines.join('\n')
}
