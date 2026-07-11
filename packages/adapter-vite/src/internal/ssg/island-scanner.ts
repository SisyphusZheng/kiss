/** Island and package-manifest discovery without executing local island modules. */
import type { OpenElementPackageManifest } from '../protocol/manifest.ts';
import { formatError, OpenElementError } from '@openelement/element';
import { createLogger } from '@openelement/element';
import { pathToTagName } from '@openelement/element';
import { join } from 'node:path';
import { safeReadDir, safeReadFile, safeStat } from './route-scanner-fs.ts';

const log = createLogger('core');

/** Local island metadata indexed by tag name. */
export interface LocalIslandMeta {
  tagName: string;
  filePath: string;
  ssr?: boolean;
  dsd?: boolean;
  hydrate?: 'load' | 'idle' | 'visible' | 'only';
  reason?: string;
}

function staticOpenElementError(message: string): OpenElementError {
  return new OpenElementError(
    `Invalid static island metadata export "openElement": ${message}. Accepted shape: export const openElement = defineIslandConfig({ ssr?: boolean, dsd?: boolean, hydrate?: "load" | "idle" | "visible" | "only" }).`,
    {
      code: 'ISLAND_METADATA_ERROR',
      statusCode: 500,
      recoverable: false,
    },
  );
}

/**
 * v0.41.0-alpha.1: Regex-based extraction of
 * `export const openElement = defineIslandConfig({ ... })`.
 *
 * The scanner intentionally does not execute island modules. It accepts only a
 * defineIslandConfig() call with boolean `ssr`/`dsd` and string `hydrate`
 * literal values. Dynamic metadata is rejected instead of guessed.
 */
export function readIslandConfig(source: string): {
  ssr?: boolean;
  dsd?: boolean;
  hydrate?: LocalIslandMeta['hydrate'];
} | null {
  const declMatch = source.match(/export\s+const\s+openElement\s*=/);
  if (!declMatch) return null;

  const afterEquals = source.slice(declMatch.index! + declMatch[0].length).trimStart();

  // Must call defineIslandConfig(...) - reject legacy object literals.
  const callMatch = afterEquals.match(/^defineIslandConfig\s*\(\s*(\{[\s\S]*?\})\s*\)/);
  if (!callMatch) {
    const hasCall = /^defineIslandConfig\s*\(/.test(afterEquals);
    if (hasCall) {
      throw staticOpenElementError(
        'defineIslandConfig() argument must be a static object literal',
      );
    }
    throw staticOpenElementError('openElement export must call defineIslandConfig(...)');
  }

  const body = callMatch[1].slice(1, -1);
  const meta: { ssr?: boolean; dsd?: boolean; hydrate?: LocalIslandMeta['hydrate'] } = {};

  // Match key: value pairs, skipping nested braces/strings.
  const propRe = /\b(ssr|dsd|hydrate|[^\s:,{}]+)\s*:\s*(true|false|["']([^"']*)["'])/g;
  let m: RegExpExecArray | null;

  while ((m = propRe.exec(body)) !== null) {
    const key = m[1];
    const raw = m[2];

    if (!['ssr', 'dsd', 'hydrate'].includes(key)) {
      throw staticOpenElementError(`unsupported openElement metadata key "${key}"`);
    }

    const typedKey = key as 'ssr' | 'dsd' | 'hydrate';

    if (typedKey === 'ssr' || typedKey === 'dsd') {
      if (raw !== 'true' && raw !== 'false') {
        throw staticOpenElementError(`openElement.${typedKey} must be a boolean literal`);
      }
      meta[typedKey] = raw === 'true';
      continue;
    }

    const value = raw.slice(1, -1);
    if (!['load', 'idle', 'visible', 'only'].includes(value)) {
      throw staticOpenElementError(`openElement.hydrate has unsupported value "${value}"`);
    }
    meta.hydrate = value as LocalIslandMeta['hydrate'];
  }

  return meta;
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

/**
 * v0.41.0-alpha.1: Regex-based — reads island metadata by statically scanning the module
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
    const tagName = pathToTagName(filePath);
    const fullPath = join(islandsDir, filePath);

    const source = await safeReadFile(fullPath);
    if (source === undefined) {
      log.debug(`Unable to read island module for metadata: ${fullPath}`);
      continue;
    }

    // Read the `openElement` export directly; no regex needed.
    const islandConfig = readIslandConfig(source);
    if (!islandConfig) continue;

    const hydrate: LocalIslandMeta['hydrate'] = islandConfig.hydrate &&
        ['load', 'idle', 'visible', 'only'].includes(islandConfig.hydrate)
      ? islandConfig.hydrate
      : undefined;

    meta[tagName] = {
      tagName,
      filePath,
      ssr: hydrate === 'only' ? false : islandConfig.ssr,
      dsd: hydrate === 'only' ? false : islandConfig.dsd,
      hydrate,
      reason: hydrate === 'only'
        ? 'local island exports openElement.hydrate=only'
        : islandConfig.ssr === false
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
 * export { manifest } from './manifest.ts';
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
        {
          code: 'PACKAGE_SCAN_ERROR',
          statusCode: 500,
          recoverable: false,
        },
      );
    }
    if (mod.manifest && typeof mod.manifest === 'object') {
      const manifest = mod.manifest as OpenElementPackageManifest;
      if (manifest.packageName && manifest.declarations) {
        allManifests.push(manifest);
      } else {
        throw new OpenElementError(
          `Invalid manifest in ${pkg}: missing packageName or declarations`,
          {
            code: 'PACKAGE_MANIFEST_ERROR',
            statusCode: 500,
            recoverable: false,
          },
        );
      }
    } else {
      throw new OpenElementError(
        `Package ${pkg} does not export a manifest`,
        {
          code: 'PACKAGE_MANIFEST_ERROR',
          statusCode: 500,
          recoverable: false,
        },
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
