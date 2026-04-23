/**
 * @kiss/vite - SSR Handler
 * Coordinates Vite SSR loading + Lit rendering + Island collection.
 */

import type { ViteDevServer } from 'vite'
import type { RouteEntry, IslandMeta } from './types.js'
import { fileToTagName } from './route-scanner.js'

// Install DOM shim eagerly — must happen before any Lit code runs
import '@lit-labs/ssr/lib/install-global-dom-shim.js'
import { render as litRender } from '@lit-labs/ssr'
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
  request: Request,
  options: { routesDir?: string; islandsDir?: string; componentsDir?: string } = {}
): Promise<{ html: string; islands: IslandMeta[] }> {
  const { routesDir = 'app/routes' } = options

  // Load the route module via Vite SSR
  const module = await vite.ssrLoadModule(`/${routesDir}/${route.filePath}`)

  // Get the default export (should be a Lit component class)
  const ComponentClass = module.default
  if (!ComponentClass) {
    throw new Error(`Route module ${route.filePath} has no default export`)
  }

  // Instantiate and render the component
  const tagName = fileToTagName(route.filePath)
  const instance = new ComponentClass()
  const rendered = litRender(instance)

  // Convert to string
  const htmlParts: string[] = []
  for (const part of rendered) {
    if (typeof part === 'string') {
      htmlParts.push(part)
    } else {
      htmlParts.push(String(part))
    }
  }

  const html = htmlParts.join('')

  // Collect islands from rendered HTML
  const knownIslands = new Map<string, string>()
  // Islands are collected by the island-extractor plugin at build time
  // For dev mode, we return empty islands array
  const islands: IslandMeta[] = []

  return { html, islands }
}

/**
 * Render an error page to HTML string.
 */
export function renderSsrError(
  error: Error,
  status: number
): string {
  const title = `Error ${status}`
  const message = error.message.replace(/</g, '&lt;').replace(/>/g, '&gt;')
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
    hydrateScript?: string
    meta?: { description?: string }
  } = {}
): string {
  const { title = 'KISS App', hydrateScript = '', meta } = options
  const metaTags: string[] = []
  if (meta?.description) {
    metaTags.push(`  <meta name="description" content="${meta.description}">`)
  }
  const metaBlock = metaTags.length > 0 ? '\n' + metaTags.join('\n') + '\n' : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>${metaBlock}
</head>
<body>
  ${html}
  ${hydrateScript}
</body>
</html>`
}
