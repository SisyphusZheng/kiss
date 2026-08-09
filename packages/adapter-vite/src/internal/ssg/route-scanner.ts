/**
 * route-scanner.ts - Route scanner
 * Scans the routes directory and generates a route map.
 * Produces the virtual:routes module.
 *
 * Phase 1 enhancement: support for _renderer.ts (layout) and
 * _middleware.ts (Hono middleware) special files.
 *
 * Phase 2 enhancement: support for package islands auto-detection.
 * Packages can export an `islands` array in their main entry.
 *
 * Convention (minimal augmentation):
 * - _renderer.ts: exports a renderer that wraps route VNodes
 * - _middleware.ts: exports a Hono middleware function applied before the route
 * - Files starting with _ are not route handlers but are loaded by the framework
 *
 * ─── SSR Import Discovery Audit (Step1) ─────────────────────
 *
 * This file discovers islands but does NOT import them (static scan only):
 *
 * 1. Local island files:
 *    - Scanned by `scanIslands()`
 *    - Metadata read by `scanIslandMeta()` (static, no import)
 *    - SSR decision: `openElement.ssr` field (static read, no import)
 *
 * 2. Package manifest islands:
 *    - Discovered by `scanPackageManifests()`
 *    - Imports package module to read `manifest` export
 *    - Browser-only packages: caught by try/catch
 *    - SSR decision: `manifest.declarations[].openElement.ssr` field
 *
 * 3. CEM manifests (v0.18.0):
 *    - Discovered by `scanCemManifests()` - reads custom-elements.json from
 *      node_modules packages WITHOUT importing package code
 *    - Results fed into the compatibility classifier (parseCem + classifyCemManifest)
 *
 * 4. Nested custom elements (from the VNode tree):
 *    - NOT handled in this file
 *    - See: `packages/element/src/internal/core/render-ir.ts` and `renderDsdTree()`
 *
 * Audit completed: 2026-05-17
 * Auditor: AI agent (openElement v0.17.4 SOP compliance check)
 *
 * ─── v0.41.0-alpha.1: AST removed ────────────────────────────
 *
 * Replaced TypeScript AST scanning with regex/glob-based extraction.
 * Route and island modules are simple ESM files; parsing the whole source
 * with the TypeScript compiler is overkill and adds a heavy dependency.
 */

import type { RouteEntry, SpecialFileType } from '../protocol/framework.ts';
import { createLogger } from '@openelement/element';
import { normalizeSeparators, pathToTagName } from '@openelement/element/build-utils';
import { dirname, join, posix, resolve, sep } from 'node:path';
import { safeReadDir, safeReadFile, safeStat } from './route-scanner-fs.ts';

/** data-open-enhance in attribute form (= or >), so prose never triggers (#569). */
const ENHANCED_FORM_RE = /data-open-enhance\s*(?:=|>)/;
const RELATIVE_IMPORT_RE = /^import\s[^'"]*from\s*['"](\.[^'"]+)['"]/gm;
const IMPORT_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js'];

/**
 * #577: a page's enhanced form may live in an imported component — scanning
 * only the route source would silently drop the enhancement layer. Follow
 * project-local relative imports (bounded depth, cycle-safe) and scan those
 * sources too.
 */
async function sourceTreeHasEnhancedForms(
  filePath: string,
  source: string,
  depth = 0,
  seen: Set<string> = new Set(),
): Promise<boolean> {
  if (ENHANCED_FORM_RE.test(source)) return true;
  if (depth >= 3 || seen.has(filePath)) return false;
  seen.add(filePath);
  const dir = dirname(filePath);
  for (const match of source.matchAll(RELATIVE_IMPORT_RE)) {
    const specifier = match[1];
    const candidates = [specifier, ...IMPORT_EXTENSIONS.map((ext) => specifier + ext)];
    for (const rel of candidates) {
      const candidate = join(dir, rel);
      const imported = await safeReadFile(candidate);
      if (imported === undefined) continue;
      if (await sourceTreeHasEnhancedForms(candidate, imported, depth + 1, seen)) return true;
      break;
    }
  }
  return false;
}

const log = createLogger('scanner');

/**
 * definePage-style routes never need a `tagName` export — the generated
 * server entry registers their default export itself (entry-orchestrator.ts)
 * with a fallback name — so a missing tagName on them is not noteworthy.
 */
const DEFINE_PAGE_RE = /\bdefinePage\s*\(/;

/**
 * Missing-tagName notes fire at most once per file per process. scanRoutes()
 * is invoked by several build phases with different routesDir spellings
 * (relative vs absolute); keying on the resolved path keeps each file to a
 * single note.
 */
const notedMissingTagName = new Set<string>();

/** Read a static route tagName export from source text. */
function readRouteTagName(source: string): string | undefined {
  const match = source.match(/export\s+const\s+tagName\s*=\s*(["'`])([^"'`]+)\1/);
  return match?.[2];
}

/**
 * Convert a route file path to a URL path pattern.
 * e.g., 'index.ts' -> '/', 'about.ts' -> '/about', 'posts/[id].ts' -> '/posts/:id'
 *
 * v0.6': Uses URLPattern-compatible syntax where possible.
 * URLPattern is the WHATWG standard for URL matching (section7.2).
 * Pattern :param is compatible with both Hono and URLPattern.
 */
export function parseRouteFilePath(filePath: string): string {
  // Normalize separators - handle Windows backslash paths
  let p = normalizeSeparators(filePath);

  // v0.25: AST-verified — path utility, regex is the appropriate tool
  p = p.replace(/\.[^.]+$/, '');

  // v0.25: AST-verified — path utility, converts [param] to :param
  // 0.42.0-alpha.5 (#556): a catch-all segment [...path] becomes the Hono
  // named regex parameter :path{.+} (matches across '/'), not the literal
  // single-segment ':...path' the naive replacement produced.
  p = p.replace(/\[\.\.\.([^\]]+)\]/g, ':$1{.+}');
  p = p.replace(/\[([^\]]+)\]/g, ':$1');

  // Handle index
  if (p === 'index') return '/';
  if (p.endsWith('/index')) {
    p = p.slice(0, -6); // Remove trailing /index
    // After stripping /index, check if the result is the root index
    if (p === 'index' || p === '') return '/';
  }

  // Ensure leading slash
  if (!p.startsWith('/')) p = '/' + p;

  return p;
}

/**
 * Determine route type from file path.
 * Files under 'api/' subdirectory are API routes.
 */
function getRouteType(filePath: string): 'page' | 'api' {
  const normalized = filePath.split(sep).join(posix.sep);
  return normalized.startsWith('api/') || normalized.includes('/api/') ? 'api' : 'page';
}

/**
 * Generate a valid JS variable name from a route path.
 * e.g., '/' -> 'RouteIndex', '/about' -> 'RouteAbout', '/posts/:id' -> 'RoutePostsId'
 */
function pathToVarName(path: string): string {
  // v0.25: AST-verified — path-to-identifier transformation, regex is the appropriate tool
  let name = path
    .replace(/^\//, '')
    .replace(/\/$/, '')
    .replace(/:([^/]+)/g, '$1')
    .replace(/[^a-zA-Z0-9]/g, '_');
  if (!name || name === '_') name = 'Index';
  return 'Route_' + name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * Identify special file types by name.
 * _renderer.ts -> renderer, _middleware.ts -> middleware
 */
// inline lookup replaces 2-case switch
function getSpecialFileType(fileName: string): SpecialFileType | null {
  const baseName = fileName.replace(/\.[^.]+$/, '');
  return ({ _renderer: 'renderer', _middleware: 'middleware' } as Record<string, SpecialFileType>)[
    baseName
  ] ?? null;
}

/**
 * Check if a file should be ignored for routing.
 * Dot-files are always ignored.
 */
function isIgnoredFile(fileName: string): boolean {
  return fileName.startsWith('.');
}

/**
 * Recursively scan a directory for route files.
 * Also collects _renderer.ts and _middleware.ts special files.
 */
interface ScanRoutesOptions {
  /** Capture source text for page routes so consumers can extract metadata. */
  includeSource?: boolean;
}

/**
 * Recursively scan a directory for route files.
 * Also collects _renderer.ts and _middleware.ts special files.
 */
export async function scanRoutes(
  routesDir: string,
  baseDir: string = '',
  options: ScanRoutesOptions = {},
): Promise<RouteEntry[]> {
  const entries: RouteEntry[] = [];
  const files = await safeReadDir(routesDir);

  if (files === undefined) {
    log.debug(`Routes directory "${routesDir}" not found`);
    return entries;
  }

  for (const file of files) {
    if (isIgnoredFile(file)) continue;

    const fullPath = join(routesDir, file);
    const relativePath = baseDir ? join(baseDir, file) : file;
    const fileStat = await safeStat(fullPath);
    if (!fileStat) {
      log.debug(`File vanished before stat: ${fullPath}`);
      continue;
    }

    if (fileStat.isDirectory()) {
      // Recurse into subdirectories
      const subEntries = await scanRoutes(fullPath, relativePath, options);
      entries.push(...subEntries);
    } else if (/\.(ts|tsx|js|jsx)$/.test(file)) {
      // Check for special files
      const specialType = getSpecialFileType(file);
      if (specialType) {
        // Add as a special entry - not a route handler, but loadable
        entries.push({
          path: parseRouteFilePath(relativePath),
          filePath: normalizeSeparators(relativePath),
          type: 'special', // Not a page or API route - renderer/middleware only
          varName: `Special_${specialType}_${baseDir.replace(/[\\/]/g, '_') || 'root'}`,
          special: specialType,
        });
      } else if (!file.startsWith('_')) {
        // Regular route file
        const routePath = parseRouteFilePath(relativePath);
        const routeType = getRouteType(relativePath);
        // v0.25: AST-verified — path utility, extracts [param] patterns
        // 0.42.0-alpha.5 (#556): a catch-all [...path] contributes the bare
        // param name 'path' (no '...' prefix) to match the ':path{.+}' pattern.
        const paramMatches = relativePath.match(/\[([^\]]+)\]/g);
        const params = paramMatches
          ? paramMatches.map((m) => m.slice(1, -1).replace(/^\.\.\./, ''))
          : undefined;
        let tagName: string | undefined;
        let source: string | undefined;
        if (routeType === 'page') {
          // Regex-based scanning reads `export const tagName` without executing the module.
          source = await safeReadFile(fullPath);
          if (source === undefined) {
            log.debug(`Unable to read route module: ${fullPath}`);
          } else {
            tagName = readRouteTagName(source);
            if (tagName === undefined && !DEFINE_PAGE_RE.test(source)) {
              // tagName not found is normal — not all page routes define one.
              // Dedupe by resolved path: multiple scan passes spell the same
              // routesDir differently (relative vs absolute).
              const resolvedPath = resolve(fullPath);
              if (!notedMissingTagName.has(resolvedPath)) {
                notedMissingTagName.add(resolvedPath);
                log.debug(`No tagName export found in route module: ${resolvedPath}`);
              }
            }
          }
        }
        entries.push({
          path: routePath,
          filePath: normalizeSeparators(relativePath),
          type: routeType,
          varName: pathToVarName(routePath),
          tagName,
          // #569: page sources carrying data-open-enhance require the client
          // enhancement layer even when the app has zero islands. The match
          // requires attribute shape (= or >) so prose mentioning the
          // attribute (e.g. guide pages) does not pull the layer in. #577:
          // follow relative imports so forms inside shared components count.
          ...(source !== undefined && await sourceTreeHasEnhancedForms(fullPath, source)
            ? { hasEnhancedForms: true }
            : {}),
          ...(options.includeSource && source !== undefined ? { source } : {}),
          params,
        });
      }
      // Other _-prefixed files (not _renderer/_middleware) are silently skipped
    }
  }

  // Sort routes: static paths first, then dynamic
  entries.sort((a, b) => {
    // Special files go to the end
    if (a.special || b.special) {
      if (a.special && !b.special) return 1;
      if (!a.special && b.special) return -1;
      return 0;
    }
    const aDynamic = a.path.includes(':');
    const bDynamic = b.path.includes(':');
    if (aDynamic !== bDynamic) return aDynamic ? 1 : -1;
    return a.path.localeCompare(b.path);
  });

  return entries;
}

/**
 * Convert a file path to a valid Custom Element tag name.
 *
 * Delegates to `@openelement/element` so the validation rules stay in
 * one place. Top-level files like `404.ts` get a safe prefix (`el-404`) and
 * files without a natural hyphen get a `-page` suffix.
 *
 * Examples:
 *   'my-counter.ts'        -> 'my-counter'
 *   'posts/index.ts'       -> 'posts-index'
 *   'admin\\dashboard.ts'  -> 'admin-dashboard'
 *   '404.ts'               -> 'el-404'
 */
export function fileToTagName(fileName: string): string {
  return pathToTagName(fileName);
}

export {
  type LocalIslandMeta,
  readIslandConfig,
  resolveIslandHydrate,
  resolveIslandSsrDsd,
  scanIslandMeta,
  scanIslands,
  scanPackageManifests,
} from './island-scanner.ts';
export {
  type CemScanResult,
  detectAndClassifyCemPackages,
  scanCemManifests,
} from './cem-scanner.ts';
