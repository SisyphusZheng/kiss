/**
 * @openelement/core - Route scanner
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
 *    - See: `packages/core/src/jsx-render-string.ts` and `renderDsdTree()`
 *
 * Audit completed: 2026-05-17
 * Auditor: AI agent (openElement v0.17.4 SOP compliance check)
 *
 * ─── v0.25: AST Upgrade ───────────────────────────────────
 *
 * Replaced source-text heuristics with structured extraction:
 * - readRouteTagNameFromModule(): TypeScript AST static literal scan
 * - readBooleanMeta() / readHydrateMeta(): eliminated; scanIslandMeta() uses AST
 * - All remaining regex patterns are path-utility only, annotated with v0.25: AST-verified
 *
 * Rationale: route modules and island modules are ESM .ts files. Static AST
 * extraction avoids module execution and avoids source regex heuristics.
 *
 * ─── v0.40.5: Internal module split ─────────────────────────
 *
 * AST helpers live in `route-scanner-ast.ts` and file-system helpers live in
 * `route-scanner-fs.ts`. This file remains the orchestrator and re-exports the
 * original public API unchanged.
 */

import type {
  CompatibilityClassification,
  OpenElementPackageManifest,
  RouteEntry,
  SpecialFileType,
} from '@openelement/core';
import { formatError, OpenElementError } from '@openelement/core/errors';
import { createLogger } from '@openelement/core/logger';
import { join, posix, sep } from 'node:path';
import { classifyCemManifest, parseCem } from './cem-compat.ts';
import { readRouteTagNameFromModule, readStaticOpenElementExport } from './route-scanner-ast.ts';
import type { LocalIslandMeta } from './route-scanner-ast.ts';
import { safeReadDir, safeReadFile, safeStat } from './route-scanner-fs.ts';

const log = createLogger('core');

/**
 * Convert a file path to a URL path pattern.
 * e.g., 'index.ts' -> '/', 'about.ts' -> '/about', 'posts/[id].ts' -> '/posts/:id'
 *
 * v0.6': Uses URLPattern-compatible syntax where possible.
 * URLPattern is the WHATWG standard for URL matching (section7.2).
 * Pattern :param is compatible with both Hono and URLPattern.
 */
function filePathToRoutePath(filePath: string): string {
  // Normalize separators - handle Windows backslash paths
  // v0.14.3: Use posix.join to ensure all output paths use forward slashes
  // regardless of platform. This prevents \ from leaking into URL patterns.
  let p = filePath.split(sep).join(posix.sep);

  // v0.25: AST-verified — path utility, regex is the appropriate tool
  p = p.replace(/\.[^.]+$/, '');

  // v0.25: AST-verified — path utility, converts [param] to :param
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
function getSpecialFileType(fileName: string): SpecialFileType | null {
  // v0.25: AST-verified — path utility, simple extension strip
  const baseName = fileName.replace(/\.[^.]+$/, '');
  switch (baseName) {
    case '_renderer':
      return 'renderer';
    case '_middleware':
      return 'middleware';
    default:
      return null;
  }
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
export async function scanRoutes(
  routesDir: string,
  baseDir: string = '',
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
      const subEntries = await scanRoutes(fullPath, relativePath);
      entries.push(...subEntries);
    } else if (/\.(ts|tsx|js|jsx)$/.test(file)) {
      // Check for special files
      const specialType = getSpecialFileType(file);
      if (specialType) {
        // Add as a special entry - not a route handler, but loadable
        entries.push({
          path: filePathToRoutePath(relativePath),
          filePath: relativePath.split(sep).join(posix.sep),
          type: 'special', // Not a page or API route - renderer/middleware only
          varName: `Special_${specialType}_${baseDir.replace(/[\\/]/g, '_') || 'root'}`,
          special: specialType,
        });
      } else if (!file.startsWith('_')) {
        // Regular route file
        const routePath = filePathToRoutePath(relativePath);
        const routeType = getRouteType(relativePath);
        // v0.25: AST-verified — path utility, extracts [param] patterns
        const paramMatches = relativePath.match(/\[([^\]]+)\]/g);
        const params = paramMatches ? paramMatches.map((m) => m.slice(1, -1)) : undefined;
        let tagName: string | undefined;
        if (routeType === 'page') {
          // Static AST scanning reads `export const tagName` without executing the module.
          tagName = await readRouteTagNameFromModule(fullPath);
          if (tagName === undefined) {
            // tagName not found is normal — not all page routes define one
            log.debug(`No tagName export found in route module: ${fullPath}`);
          }
        }
        entries.push({
          path: routePath,
          filePath: relativePath.split(sep).join(posix.sep),
          type: routeType,
          varName: pathToVarName(routePath),
          tagName,
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
 * v0.25: AST-verified — converts file name to a valid Custom Element tag name.
 * Uses regex for path manipulation since tag names are derived from file paths.
 *
 * Examples:
 *   'my-counter.ts'        -> 'my-counter'
 *   'posts/index.ts'       -> 'posts-index'
 *   'admin\\dashboard.ts'  -> 'admin-dashboard'
 */
export function fileToTagName(fileName: string): string {
  return fileName
    .replace(/\.[^.]+$/, '') // v0.25: AST-verified — remove extension
    .replace(/[\\/]/g, '-') // v0.25: AST-verified — replace path separators with hyphens
    .toLowerCase();
}

/**
 * Scan islands directory recursively for island files.
 * Returns paths relative to islandsDir (e.g., ['my-counter.ts', 'posts/index.ts']).
 */
export async function scanIslands(
  islandsDir: string,
  relativeDir: string = '',
): Promise<string[]> {
  const files: string[] = [];
  const entries = await safeReadDir(islandsDir);

  if (entries === undefined) {
    log.debug(`Islands directory "${islandsDir}" not found`);
    return files;
  }

  for (const entry of entries) {
    if (entry.startsWith('.')) continue;

    const fullPath = join(islandsDir, entry);
    const fileStat = await safeStat(fullPath);
    if (!fileStat) {
      log.debug(`Island file vanished before stat: ${fullPath}`);
      continue;
    }

    const relativePath = relativeDir ? join(relativeDir, entry) : entry;

    if (fileStat.isDirectory()) {
      const subFiles = await scanIslands(fullPath, relativePath);
      files.push(...subFiles);
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry)) {
      files.push(relativePath);
    }
  }

  return files.sort();
}

export type { LocalIslandMeta } from './route-scanner-ast.ts';

/**
 * v0.25: AST-verified — reads island metadata by statically scanning the module
 * source for `export const openElement = defineIslandConfig({ ... })`.
 *
 * Supported form:
 *   export const openElement = defineIslandConfig({ ssr: false, dsd: false, hydrate: 'only' })
 *
 * This is more reliable than regex because it handles:
 * - Comments inside the object literal
 * - Computed properties
 * - Destructured/re-exported values
 * - Canonical defineIslandConfig(...) calls
 *
 * If a module cannot be read, its metadata is silently skipped.
 */
export async function scanIslandMeta(
  islandsDir: string,
  islandFiles: string[],
): Promise<Record<string, LocalIslandMeta>> {
  const meta: Record<string, LocalIslandMeta> = {};

  for (const filePath of islandFiles) {
    const tagName = fileToTagName(filePath);
    const fullPath = join(islandsDir, filePath);

    const source = await safeReadFile(fullPath);
    if (source === undefined) {
      log.debug(`Unable to read island module for metadata: ${fullPath}`);
      continue;
    }

    // Read the `openElement` export directly; no regex needed.
    const openElementExport = readStaticOpenElementExport(source);
    if (!openElementExport) continue;

    const hydrate: LocalIslandMeta['hydrate'] = openElementExport.hydrate &&
        ['load', 'idle', 'visible', 'only'].includes(openElementExport.hydrate)
      ? openElementExport.hydrate
      : undefined;

    meta[tagName] = {
      tagName,
      filePath,
      ssr: hydrate === 'only' ? false : openElementExport.ssr,
      dsd: hydrate === 'only' ? false : openElementExport.dsd,
      hydrate,
      reason: hydrate === 'only'
        ? 'local island exports openElement.hydrate=only'
        : openElementExport.ssr === false
        ? 'local island exports openElement.ssr=false'
        : undefined,
    };
  }

  return meta;
}

/**
 * Scan package exports for OpenElementPackageManifest.
 * Packages should export a `manifest` OpenElementPackageManifest in their main entry.
 *
 * Example package export:
 * ```ts
 * // @openelement/ui/index.ts
 * export { manifest } from './manifest.js';
 * ```
 *
 * @param packageNames - List of package names to scan (e.g., ['@openelement/ui'])
 * @returns Array of OpenElementPackageManifest
 */
export async function scanPackageManifests(
  packageNames: string[],
): Promise<OpenElementPackageManifest[]> {
  const allManifests: OpenElementPackageManifest[] = [];

  for (const pkg of packageNames) {
    // @vite-ignore suppresses unanalyzable-dynamic-import JSR warning.
    let mod: Record<string, unknown>;
    try {
      mod = await import(/* @vite-ignore */ pkg) as Record<string, unknown>;
    } catch (e) {
      if (isBrowserOnlyPackageImportError(e)) {
        log.warn(
          `Skipping package manifest from "${pkg}": browser-only package cannot be imported during SSR discovery`,
        );
        continue;
      }
      throw new OpenElementError(
        `Failed to scan package manifest from "${pkg}": ${formatError(e)}`,
        'PACKAGE_SCAN_ERROR',
        500,
        false,
      );
    }
    if (mod.manifest && typeof mod.manifest === 'object') {
      const manifest = mod.manifest as OpenElementPackageManifest;
      if (manifest.packageName && manifest.declarations) {
        allManifests.push(manifest);
      } else {
        throw new OpenElementError(
          `Invalid manifest in ${pkg}: missing packageName or declarations`,
          'PACKAGE_MANIFEST_ERROR',
          500,
          false,
        );
      }
    } else {
      throw new OpenElementError(
        `Package ${pkg} does not export a manifest`,
        'PACKAGE_MANIFEST_ERROR',
        500,
        false,
      );
    }
  }

  return allManifests;
}

/**
 * v0.25: AST-verified — error message classification, regex is the appropriate tool
 * for matching runtime error strings from failed dynamic imports.
 */
function isBrowserOnlyPackageImportError(error: unknown): boolean {
  const message = formatError(error);
  return /\b(window|document|HTMLElement|customElements|navigator)\b.*\bis not defined\b/i.test(
    message,
  );
}

// ─── CEM Auto-Detection (v0.18.0) ─────────────────────────────────────────

/** Result of scanning node_modules for CEM manifests */
export interface CemScanResult {
  /** Package name (e.g. '@openelement/ui') */
  packageName: string;
  /** Absolute path to custom-elements.json */
  cemPath: string;
  /** Raw JSON content */
  json: string;
}

/**
 * Scan node_modules for packages that ship a `custom-elements.json`.
 *
 * Strategy:
 *   1. Read node_modules directory entries (top-level packages + scoped orgs)
 *   2. For each package, check if `<pkg>/custom-elements.json` exists
 *   3. Return the raw JSON - caller is responsible for parsing + classifying
 *
 * This function reads files only. It never imports or executes package code.
 *
 * @param nodeModulesDir - Absolute path to the node_modules directory
 * @returns Array of found CEM manifests
 */
export async function scanCemManifests(
  nodeModulesDir: string,
): Promise<CemScanResult[]> {
  const results: CemScanResult[] = [];

  const entries = await safeReadDir(nodeModulesDir);
  if (!entries) return results;

  for (const entry of entries) {
    if (entry.startsWith('.')) continue;

    if (entry.startsWith('@')) {
      // Scoped package directory - recurse one level
      const scopeDir = join(nodeModulesDir, entry);
      const scopedEntries = await safeReadDir(scopeDir);
      if (!scopedEntries) continue;
      for (const scopedEntry of scopedEntries) {
        if (scopedEntry.startsWith('.')) continue;
        const packageName = `${entry}/${scopedEntry}`;
        const cemPath = join(nodeModulesDir, entry, scopedEntry, 'custom-elements.json');
        const result = await tryReadCemFile(cemPath, packageName);
        if (result) results.push(result);
      }
    } else {
      // Regular (non-scoped) package
      const cemPath = join(nodeModulesDir, entry, 'custom-elements.json');
      const result = await tryReadCemFile(cemPath, entry);
      if (result) results.push(result);
    }
  }

  return results;
}

/**
 * Try to read a custom-elements.json file.
 * Returns null if the file doesn't exist or can't be read.
 */
async function tryReadCemFile(
  cemPath: string,
  packageName: string,
): Promise<CemScanResult | null> {
  const json = await safeReadFile(cemPath);
  return json === undefined ? null : { packageName, cemPath, json };
}

/**
 * Run CEM auto-detection: scan node_modules, parse each manifest,
 * and classify all discovered components.
 *
 * This is the high-level function called from the Vite plugin buildStart().
 * It combines scanCemManifests() + parseCem() + classifyCemManifest()
 * into a single pipeline.
 *
 * @param nodeModulesDir - Absolute path to node_modules
 * @returns Array of compatibility classifications (may be empty if no CEM found)
 */
export async function detectAndClassifyCemPackages(
  nodeModulesDir: string,
): Promise<CompatibilityClassification[]> {
  const cemResults = await scanCemManifests(nodeModulesDir);
  if (cemResults.length === 0) return [];

  const allClassifications: CompatibilityClassification[] = [];

  for (const { packageName, json } of cemResults) {
    const parseResult = parseCem(json);
    if (!parseResult.success || !parseResult.manifest) {
      log.debug(
        `Skipping invalid CEM manifest from "${packageName}": ` +
          parseResult.errors.map((e) => e.message).join('; '),
      );
      continue;
    }

    // Attach package name to the manifest for better diagnostics
    const manifest = { ...parseResult.manifest, packageName };
    const classResult = classifyCemManifest(manifest);

    // Log summary
    const { stats } = classResult;
    if (stats.totalComponents > 0) {
      log.info(
        `CEM: ${packageName} - ${stats.totalComponents} component(s): ` +
          `${stats.ssrCapableCount} ssr-capable, ${stats.clientOnlyCount} client-only` +
          (stats.rejectedCount > 0 ? `, ${stats.rejectedCount} rejected` : '') +
          (stats.experimentalDomCount > 0 ? `, ${stats.experimentalDomCount} experimental` : ''),
      );
    }

    allClassifications.push(...classResult.classifications);
  }

  return allClassifications;
}
