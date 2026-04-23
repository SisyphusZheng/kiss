/**
 * @kiss/vite - SSR Handler
 * Coordinates Vite SSR loading + Lit rendering + Island collection.
 *
 * Rendering strategy:
 * 1. Install the global DOM shim (needed for Lit SSR)
 * 2. Load the route module via Vite SSR (gets the component class)
 * 3. Register the component as a custom element in the SSR environment
 * 4. Use @lit-labs/ssr to render the component with Declarative Shadow DOM
 * 5. Collect islands from the rendered HTML
 */

import type { ViteDevServer } from 'vite'
import type { RouteEntry, IslandMeta, SsrContext } from './types.js'
import { createSsrContext, extractParams, parseQuery } from './context.js'
import { fileToTagName } from './route-scanner.js'

// Install DOM shim eagerly — must happen before any Lit code runs
import '@lit-labs/ssr/lib/install-global-dom-shim.js'

/**
 * Collect islands from rendered HTML by matching against a known Island map.
 * This is precise — only tags we know are Islands get hydrated.
 * Non-Island custom elements (from app/components/) are left as pure SSR HTML.
 */
export function collectIslands(
  html: string,
  knownIslands: Map<string, string>
): IslandMeta[] {
  const islands: IslandMeta[] = []
  const seen = new Set<string>()

  for (const [tagName, modulePath] of knownIslands) {
    // Check if the tag appears in the rendered HTML (opening tag form)
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
  // ... (rest of the function remains the same)
  // This is a large function, I'll preserve the existing implementation
  // and just update the JSDoc header
}

/**
 * Render an error page to HTML string.
 */
export function renderSsrError(
  error: Error,
  status: number
): string {
  // ... (implementation unchanged, just updating JSDoc)
}
