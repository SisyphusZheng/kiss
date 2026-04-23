/**
 * @hvl/vite - SSR Handler
 * Coordinates Vite SSR loading + Lit rendering + Island collection
 */

import type { ViteDevServer } from 'vite'
import type { RouteEntry, IslandMeta, SsrContext } from './types.js'
import { fileToTagName } from './route-scanner.js'

/**
 * Collect islands from rendered HTML.
 * Looks for custom element tags that correspond to island components.
 */
export function collectIslands(
  html: string,
  knownIslands: Map<string, string>
): IslandMeta[] {
  const islands: IslandMeta[] = []
  const seen = new Set<string>()

  for (const [tagName, modulePath] of knownIslands) {
    // Check if the tag appears in the rendered HTML
    const openTag = `<${tagName}`
    const selfClose = `<${tagName}`
    if (html.includes(openTag) || html.includes(selfClose)) {
      if (!seen.has(tagName)) {
        seen.add(tagName)
        islands.push({ tagName, modulePath })
      }
    }
  }

  return islands
}

/**
 * Render a Lit component to HTML with Declarative Shadow DOM.
 * Uses @lit-labs/ssr for server-side rendering.
 */
export async function renderLitComponent(
  componentModule: any,
  props: Record<string, any> = {}
): Promise<string> {
  // Dynamic import to handle SSR environment
  const { render } = await import('@lit-labs/ssr')
  const { html } = await import('lit')

  const Component = componentModule.default
  if (!Component) {
    throw new Error('[HVL] Route module has no default export')
  }

  // Create an instance to render
  // For SSR, we use the render function with the component's template
  const tagName = Component.hasOwnProperty('__tagName')
    ? (Component as any).__tagName
    : toKebabCase(Component.name)

  // Build attributes string from props
  const attrs = Object.entries(props)
    .map(([k, v]) => {
      if (typeof v === 'boolean') return v ? k : ''
      return `${k}="${String(v)}"`
    })
    .filter(Boolean)
    .join(' ')

  const attrStr = attrs ? ' ' + attrs : ''

  // Use Lit SSR to render the component
  // @lit-labs/ssr renders with Declarative Shadow DOM
  const templateResult = html`<${tagName}${attrStr}></${tagName}>`

  let rendered = ''
  for await (const chunk of render(templateResult)) {
    rendered += chunk
  }

  return rendered
}

/**
 * Simple SSR rendering using direct @lit-labs/ssr render.
 * This is the core rendering path.
 */
export async function renderPageToString(
  vite: ViteDevServer,
  route: RouteEntry,
  url: URL,
  routesDir: string
): Promise<{ html: string; islands: IslandMeta[] }> {
  // Load the route module via Vite SSR
  const module = await vite.ssrLoadModule(`/${routesDir}/${route.filePath}`)
  const PageComponent = module.default

  if (!PageComponent) {
    throw new Error(`[HVL] Route ${route.path} has no default export`)
  }

  // Render using @lit-labs/ssr
  const { render } = await import('@lit-labs/ssr')
  const { html } = await import('lit')

  // Determine tag name
  const tagName = module.__tagName || toKebabCase(PageComponent.name)

  // Build the page template
  const templateResult = html`<${tagName}></${tagName}>`

  // Render to string
  let renderedBody = ''
  for await (const chunk of render(templateResult)) {
    renderedBody += chunk
  }

  // Collect islands from the rendered output
  const islands = collectIslandsFromHTML(renderedBody)

  return { html: renderedBody, islands }
}

/**
 * Extract island custom element names from rendered HTML.
 */
function collectIslandsFromHTML(html: string): IslandMeta[] {
  const islands: IslandMeta[] = []
  const seen = new Set<string>()

  // Match custom element opening tags (must contain a hyphen)
  const regex = /<([a-z][a-z0-9]*-[a-z0-9-]+)/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(html)) !== null) {
    const tagName = match[1]
    if (!seen.has(tagName)) {
      seen.add(tagName)
      islands.push({
        tagName,
        modulePath: `/app/islands/${tagName}.ts`,
      })
    }
  }

  return islands
}

/**
 * Convert PascalCase to kebab-case.
 * e.g., 'MyCounter' → 'my-counter'
 */
function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
}

/**
 * Wrap rendered body in a full HTML document.
 */
export function wrapInDocument(
  body: string,
  options: {
    title?: string
    head?: string
    hydrateScript?: string
  } = {}
): string {
  const { title = 'HVL App', head = '', hydrateScript = '' } = options

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  ${head}
</head>
<body>
${body}
${hydrateScript}
</body>
</html>`
}

/**
 * Render an error page for SSR failures.
 */
export function renderSSRError(
  error: Error,
  route: RouteEntry,
  isDev: boolean
): string {
  const message = isDev
    ? `
<div style="font-family: system-ui; padding: 2rem; color: #c00;">
  <h2>⚠️ SSR Render Error</h2>
  <p><strong>Route:</strong> ${route.path}</p>
  <p><strong>File:</strong> ${route.filePath}</p>
  <p><strong>Error:</strong> ${escapeHtml(error.message)}</p>
  ${error.stack ? `<pre style="background: #f5f5f5; padding: 1rem; overflow: auto; font-size: 0.85rem;">${escapeHtml(error.stack)}</pre>` : ''}
</div>`
    : `<div style="padding: 2rem; text-align: center;">
  <h2>Something went wrong</h2>
  <p>We're working on fixing this. Please try again later.</p>
</div>`

  return wrapInDocument(message, {
    title: 'Error - HVL App',
  })
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
