/**
 * @kissjs/core - Route scanner
 * Scans the routes directory and generates a route map.
 * Produces the virtual:routes module.
 *
 * Phase 1 enhancement: support for _renderer.ts (layout) and
 * _middleware.ts (Hono middleware) special files.
 *
 * Convention (minimal augmentation):
 * - _renderer.ts: exports a LitElement class used as the page layout wrapper
 * - _middleware.ts: exports a Hono middleware function applied before the route
 * - Files starting with _ are not route handlers but are loaded by the framework
 */

import type { RouteEntry, SpecialFileType } from './types.js'
import { readdir, stat } from 'node:fs/promises'
import { join, sep, posix } from 'node:path'

/**
 * Convert a file path to a URL path pattern.
 * e.g., 'index.ts' → '/', 'about.ts' → '/about', 'posts/[id].ts' → '/posts/:id'
 */
function filePathToRoutePath(filePath: string): string {
  // Normalize separators
  let p = filePath.split(sep).join(posix.sep)

  // Remove extension
  p = p.replace(/\.[^.]+$/, '')

  // Convert [param] to :param
  p = p.replace(/\[([^\]]+)\]/g, ':$1')

  // Handle index
  if (p === 'index') return '/'
  if (p.endsWith('/index')) p = p.slice(0, -6) // Remove trailing /index

  // Ensure leading slash
  if (!p.startsWith('/')) p = '/' + p

  return p
}

/**
 * Determine route type from file path.
 * Files under 'api/' subdirectory are API routes.
 */
function getRouteType(filePath: string): 'page' | 'api' {
  const normalized = filePath.split(sep).join(posix.sep)
  return normalized.startsWith('api/') || normalized.includes('/api/') ? 'api' : 'page'
}

/**
 * Generate a valid JS variable name from a route path.
 * e.g., '/' → 'RouteIndex', '/about' → 'RouteAbout', '/posts/:id' → 'RoutePostsId'
 */
function pathToVarName(path: string): string {
  let name = path
    .replace(/^\//, '')
    .replace(/\/$/, '')
    .replace(/:([^/]+)/g, '$1')
    .replace(/[^a-zA-Z0-9]/g, '_')
  if (!name || name === '_') name = 'Index'
  return 'Route_' + name.charAt(0).toUpperCase() + name.slice(1)
}

/**
 * Identify special file types by name.
 * _renderer.ts → renderer, _middleware.ts → middleware
 */
function getSpecialFileType(fileName: string): SpecialFileType | null {
  const baseName = fileName.replace(/\.[^.]+$/, '')
  switch (baseName) {
    case '_renderer':
      return 'renderer'
    case '_middleware':
      return 'middleware'
    default:
      return null
  }
}

/**
 * Check if a file should be ignored for routing.
 * Dot-files are always ignored.
 */
function isIgnoredFile(fileName: string): boolean {
  return fileName.startsWith('.')
}

/**
 * Recursively scan a directory for route files.
 * Also collects _renderer.ts and _middleware.ts special files.
 */
export async function scanRoutes(
  routesDir: string,
  baseDir: string = ''
): Promise<RouteEntry[]> {
  const entries: RouteEntry[] = []
  let files: string[]

  try {
    files = await readdir(routesDir)
  } catch {
    // Directory doesn't exist yet — return empty
    return entries
  }

  for (const file of files) {
    if (isIgnoredFile(file)) continue

    const fullPath = join(routesDir, file)
    const relativePath = baseDir ? join(baseDir, file) : file
    const fileStat = await stat(fullPath)

    if (fileStat.isDirectory()) {
      // Recurse into subdirectories
      const subEntries = await scanRoutes(fullPath, relativePath)
      entries.push(...subEntries)
    } else if (/\.(ts|tsx|js|jsx)$/.test(file)) {
      // Check for special files
      const specialType = getSpecialFileType(file)
      if (specialType) {
        // Add as a special entry — not a route handler, but loadable
        entries.push({
          path: filePathToRoutePath(
            relativePath.replace(/^_renderer/, '_renderer').replace(/^_middleware/, '_middleware')
          ),
          filePath: relativePath.split(sep).join(posix.sep),
          type: 'page', // Same type, but flagged
          varName: `Special_${specialType}_${baseDir.replace(/[\\/]/g, '_') || 'root'}`,
          special: specialType,
        })
      } else if (!file.startsWith('_')) {
        // Regular route file
        const routePath = filePathToRoutePath(relativePath)
        entries.push({
          path: routePath,
          filePath: relativePath.split(sep).join(posix.sep),
          type: getRouteType(relativePath),
          varName: pathToVarName(routePath),
        })
      }
      // Other _-prefixed files (not _renderer/_middleware) are silently skipped
    }
  }

  // Sort routes: static paths first, then dynamic
  entries.sort((a, b) => {
    // Special files go to the end
    if (a.special || b.special) {
      if (a.special && !b.special) return 1
      if (!a.special && b.special) return -1
      return 0
    }
    const aDynamic = a.path.includes(':')
    const bDynamic = b.path.includes(':')
    if (aDynamic !== bDynamic) return aDynamic ? 1 : -1
    return a.path.localeCompare(b.path)
  })

  return entries
}

/**
 * Generate the virtual:routes module code.
 * Includes special file imports (_renderer, _middleware).
 */
export function generateRoutesModule(routes: RouteEntry[], routesDir: string): string {
  const regularRoutes = routes.filter(r => !r.special)
  const specialFiles = routes.filter(r => r.special)

  const imports = routes
    .map(r => {
      if (r.special) {
        // Special files are imported but not added to the routes array
        const varName = r.varName
        return `import * as ${varName} from '/${routesDir}/${r.filePath}';`
      }
      return `import * as ${r.varName} from '/${routesDir}/${r.filePath}';`
    })
    .join('\n')

  const routeDefs = regularRoutes
    .map(
      r =>
        `  { path: '${r.path}', filePath: '${r.filePath}', type: '${r.type}', module: ${r.varName} },`
    )
    .join('\n')

  // Generate special file mappings
  const rendererDefs = specialFiles
    .filter(r => r.special === 'renderer')
    .map(r => {
      // The renderer applies to the directory it's in
      const dir = r.filePath.replace(/\/_renderer\.[^.]+$/, '').replace(/_renderer\.[^.]+$/, '')
      const scope = dir ? `/${dir}` : '/'
      return `  { scope: '${scope}', module: ${r.varName} },`
    })
    .join('\n')

  const middlewareDefs = specialFiles
    .filter(r => r.special === 'middleware')
    .map(r => {
      const dir = r.filePath.replace(/\/_middleware\.[^.]+$/, '').replace(/_middleware\.[^.]+$/, '')
      const scope = dir ? `/${dir}` : '/'
      return `  { scope: '${scope}', module: ${r.varName} },`
    })
    .join('\n')

  return `// Auto-generated by @kissjs/core route-scanner
// DO NOT EDIT — changes will be overwritten

${imports}

export const routes = [
${routeDefs}
];

export const pageRoutes = routes.filter(r => r.type === 'page');
export const apiRoutes = routes.filter(r => r.type === 'api');

export const renderers = [
${rendererDefs || '  // No _renderer.ts files found'}
];

export const middlewares = [
${middlewareDefs || '  // No _middleware.ts files found'}
];
`
}

/**
 * Generate the virtual:islands module code.
 */
export function generateIslandsModule(
  islandsDir: string,
  islandFiles: string[]
): string {
  const imports = islandFiles
    .map((f, i) => {
      return `import * as Island_${i} from '/${islandsDir}/${f}';`
    })
    .join('\n')

  const islandDefs = islandFiles
    .map((f, i) => {
      const tagName = fileToTagName(f)
      return `  { tagName: '${tagName}', modulePath: '/${islandsDir}/${f}', module: Island_${i} },`
    })
    .join('\n')

  return `// Auto-generated by @kissjs/core island-scanner
// DO NOT EDIT — changes will be overwritten

${imports}

export const islands = [
${islandDefs}
];

export const islandTagNames = islands.map(i => i.tagName);
`
}

/**
 * Convert a file name to a Custom Element tag name.
 * e.g., 'my-counter.ts' → 'my-counter', 'theme-toggle.ts' → 'theme-toggle'
 */
export function fileToTagName(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '')
}

/**
 * Scan islands directory for island files.
 */
export async function scanIslands(islandsDir: string): Promise<string[]> {
  const files: string[] = []
  let entries: string[]

  try {
    entries = await readdir(islandsDir)
  } catch {
    return files
  }

  for (const entry of entries) {
    if (entry.startsWith('.')) continue
    if (/\.(ts|tsx|js|jsx)$/.test(entry)) {
      files.push(entry)
    }
  }

  return files.sort()
}
