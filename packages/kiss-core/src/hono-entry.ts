/**
 * @kiss/core - Hono entry generator
 *
 * Generates a virtual module string that exports a Hono app
 * with all routes registered (API + page/SSR).
 *
 * This generated module is consumed by @hono/vite-dev-server
 * (dev mode) and @hono/vite-ssg (build/SSG mode).
 */

import type { RouteEntry } from './types.js'
import { fileToTagName } from './route-scanner.js'

/**
 * Generate the Hono entry module code from scanned routes.
 *
 * The generated code:
 * 1. Imports Hono
 * 2. Imports route modules (via Vite SSR)
 * 3. Creates a Hono app
 * 4. Registers API routes (forward to sub-app)
 * 5. Registers page routes (Lit SSR → HTML)
 * 6. Exports the app as default
 */
export function generateHonoEntryCode(
  routes: RouteEntry[],
  options: { routesDir?: string; componentsDir?: string } = {},
): string {
  const routesDir = options.routesDir || 'app/routes'

  // Separate routes
  const apiRoutes = routes.filter(r => r.type === 'api' && !r.special)
  const pageRoutes = routes.filter(r => r.type === 'page' && !r.special)

  const lines: string[] = []

  // --- Imports ---
  lines.push(`import { Hono } from 'hono'`)
  lines.push(`import { render as litRender } from '@lit-labs/ssr'`)
  lines.push(`import { html } from 'lit'`)
  lines.push(`import { unsafeHTML } from 'lit/directives/unsafe-html.js'`)
  lines.push(
    `import { collectResult } from '@lit-labs/ssr/lib/render-result.js'`,
  )
  lines.push(``)

  // Import route modules — use Vite SSR compatible paths
  for (const route of [...apiRoutes, ...pageRoutes]) {
    const importPath = `/${routesDir}/${route.filePath}`
    lines.push(`import * as $${route.varName} from '${importPath}'`)
  }
  lines.push(``)

  // --- App creation ---
  lines.push(`const app = new Hono()`)
  lines.push(``)

  // --- Debug endpoint ---
  lines.push(`// Debug: GET /__kiss`)
  lines.push(`app.get('/__kiss', (c) => {`)
  lines.push(`  return c.json({`)
  lines.push(`    routes: ${JSON.stringify(routes.filter(r => !r.special).map(r => ({ path: r.path, type: r.type }))},`)
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
    const tagName = route.tagName || fileToTagName(route.filePath)
    lines.push(`// Page: ${route.path} (${route.filePath})`)
    lines.push(`app.get('${route.path}', async (c) => {`)
    lines.push(`  try {`)
    lines.push(`    const ComponentClass = ${varName}.default`)
    lines.push(
      `    const tag = ${varName}.tagName || '${tagName}'`,
    )
    lines.push(`    const ssrResult = litRender(html` + '`' + `${unsafeHTML(` + '`' + `<${tag}></${tag}>` + '`' + `)}` + '`' + `)`)
    lines.push(`    const htmlString = await collectResult(ssrResult)`)
    lines.push(`    return c.html(htmlString)`)
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

/**
 * Build a minimal Hono entry for SSG.
 * This version avoids Lit SSR (which needs DOM shim)
 * and instead relies on @hono/vite-ssg calling each route.
 *
 * For SSG, we let each page route return pre-rendered HTML.
 * The actual Lit SSR is done at build time separately.
 */
export function generateSSGEntryCode(
  routes: RouteEntry[],
  _options: { routesDir?: string } = {},
): string {
  const pageRoutes = routes.filter(r => r.type === 'page' && !r.special)

  const lines: string[] = []
  lines.push(`import { Hono } from 'hono'`)
  lines.push(``)

  // For SSG: import route modules and call their SSR function
  // Each route module should export a `getStaticProps()` or similar
  // For now, we just make the app return a simple response
  // @hono/vite-ssg will call each route and save the response

  lines.push(`const app = new Hono()`)
  lines.push(``)

  for (const route of pageRoutes) {
    lines.push(`app.get('${route.path}', (c) => {`)
    lines.push(
      `  return c.html('<!-- SSG placeholder for ${route.path} -->')`,
    )
    lines.push(`})`)
  }

  lines.push(``)
  lines.push(`export default app`)
  return lines.join('\n')
}
