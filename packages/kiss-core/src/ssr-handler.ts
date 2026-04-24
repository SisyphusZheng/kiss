/**
 * @kissjs/core - SSR Handler
 * Coordinates Vite SSR loading + Lit rendering + Island collection.
 *
 * Uses @lit-labs/ssr v3 to render Lit components with Declarative Shadow DOM.
 * When a custom element is imported (registered) in the SSR context,
 * render() automatically renders its shadow DOM with <template shadowrootmode="open">.
 */

import type { ViteDevServer } from 'vite'
import type { RouteEntry, IslandMeta } from './types.js'

// DOM shim is NOT imported here — it's the caller's responsibility.
// SSG: injected by generateHonoEntryCode() when ssg: true
// Dev: browser already has DOM APIs, @hono/vite-dev-server handles SSR
import { render as litRender } from '@lit-labs/ssr'
import { collectResult } from '@lit-labs/ssr/lib/render-result.js'
import { html } from 'lit'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'

/**
 * Collect islands from rendered HTML by matching against a known Island map.
 */
export function collectIslands(
  html: string,
  knownIslands: Map<string, string>
): IslandMeta[] {
  const islands: IslandMeta[] = []
  const seen = new Set<string>()

  for (const [tagName, modulePath] of knownIslands) {
    const pattern = new RegExp(`<${tagName}[\\s>/]`, 'i')
    if (pattern.test(html) && !seen.has(tagName)) {
      seen.add(tagName)
      islands.push({ tagName, modulePath })
    }
  }

  return islands
}

/**
 * Render a page route to HTML string via Vite SSR + Lit.
 * Returns the rendered HTML and a list of collected islands.
 */
export async function renderPageToString(
  vite: ViteDevServer,
  route: RouteEntry,
  _request: Request,
  options: { routesDir?: string; islandsDir?: string; componentsDir?: string } = {}
): Promise<{ html: string; islands: IslandMeta[] }> {
  const { routesDir = 'app/routes' } = options

  // Load the route module via Vite SSR
  // This registers the custom element in the SSR global scope
  const module = await vite.ssrLoadModule(`/${routesDir}/${route.filePath}`)

  // Get the default export (should be a Lit component class)
  const ComponentClass = module.default
  if (!ComponentClass) {
    throw new Error(`Route module ${route.filePath} has no default export`)
  }

  // Get the custom element tag name
  // Convention: route module exports `tagName` string, or we derive from file path
  const tagName = module.tagName || 'kiss-' + route.filePath
    .replace(/\.[^.]+$/, '')
    .replace(/[\\/]/g, '-')
    .toLowerCase()

  // Render the component using Lit SSR
  // Since the custom element is registered via the module import above,
  // render() will automatically render it with Declarative Shadow DOM.
  // Lit html`` doesn't support dynamic tag names in element position,
  // so we use unsafeHTML to inject the custom element tag.
  const ssrResult = litRender(html`${unsafeHTML(`<${tagName}></${tagName}>`)}`)
  const renderedHtml = await collectResult(ssrResult)

  // Collect islands from rendered HTML
  // Islands are collected by the island-extractor plugin at build time
  // For dev mode, we return empty islands array
  const _knownIslands = new Map<string, string>()
  const islands: IslandMeta[] = []

  return { html: renderedHtml, islands }
}

/**
 * Render an error page to HTML string.
 * In dev mode, shows detailed error information for debugging.
 * In production, shows a generic safe error page.
 */
export function renderSsrError(
  error: Error,
  statusOrRoute: number | RouteEntry,
  isDev: boolean = false
): string {
  const status = typeof statusOrRoute === 'number' ? statusOrRoute : 500
  const title = isDev ? 'SSR Render Error' : `Error ${status}`
  const message = error.message.replace(/</g, '&lt;').replace(/>/g, '&gt;')

  if (isDev) {
    const stack = error.stack
      ? error.stack.replace(/</g, '&lt;').replace(/>/g, '&gt;')
      : ''
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>body{font-family:system-ui;max-width:800px;margin:2rem auto;padding:0 1rem}pre{background:#f5f5f5;padding:1rem;overflow:auto;border-radius:4px}</style>
</head>
<body>
  <h1>${title}</h1>
  <p><strong>${message}</strong></p>
  ${stack ? `<pre>${stack}</pre>` : ''}
</body>
</html>`
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body>
  <h1>${title}</h1>
  <p>${message}</p>
</body>
</html>`
}

/**
 * Wrap rendered HTML in a full HTML document.
 * Adds DOCTYPE, head (title, meta, preload), and body.
 */
export function wrapInDocument(
  html: string,
  options: {
    title?: string
    lang?: string
    hydrateScript?: string
    meta?: { description?: string }
    devMode?: boolean
    routeModulePath?: string
  } = {}
): string {
  const { title = 'KISS App', lang = 'en', hydrateScript = '', meta, devMode = false, routeModulePath } = options
  const metaTags: string[] = []
  if (meta?.description) {
    metaTags.push(`  <meta name="description" content="${meta.description}">`)
  }
  const metaBlock = metaTags.length > 0 ? '\n' + metaTags.join('\n') + '\n' : ''

  // Dev mode: inject Vite client + component registration
  const devScripts = devMode
    ? `
  <script type="module" src="/@vite/client"></script>
  ${routeModulePath ? `<script type="module">
  // Register route component for client-side custom element definition
  import '${routeModulePath}';
</script>` : ''}`
    : ''

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>${metaBlock}
</head>
<body>
  ${html}
  ${hydrateScript}${devScripts}
</body>
</html>`
}
