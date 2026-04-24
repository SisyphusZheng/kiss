/**
 * @kissjs/core - Entry Generators
 * Pure functions that generate auto-entry code strings.
 * No Vite dependency — safe to import in tests.
 */

/** Generate the SSR entry point file content (when no custom server.ts is provided) */
export function generateServerEntry(_routesDir: string): string {
  return `// KISS Server Entry (auto-generated)
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { requestId } from 'hono/request-id'

const app = new Hono()
app.use('*', requestId())
app.use('*', logger())

// Import and register all route modules
// This will be populated by the build process based on scanned routes

export default app
`
}

/** Generate the client entry point file content (when no custom client.ts is provided).
 * Imports all island components and registers them as custom elements. */
export function generateClientEntry(islandsDir: string, islandFiles: string[]): string {
  if (islandFiles.length === 0) {
    return '// KISS Client Entry — No islands detected, zero client JS needed\n'
  }

  const imports = islandFiles
    .map((f, i) => {
      return `import Island_${i} from './${islandsDir}/${f}';`
    })
    .join('\n')

  const registrations = islandFiles
    .map((f, i) => {
      const tagName = f.replace(/\.[^.]+$/, '')
      return `if (!customElements.get('${tagName}')) customElements.define('${tagName}', Island_${i});`
    })
    .join('\n  ')

  return `// KISS Client Entry (auto-generated)
${imports}

// Register all island custom elements
${registrations}
`
}
