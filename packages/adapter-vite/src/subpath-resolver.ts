/**
 * Extracted from index.ts in v0.22 (SOP-004: adapter-vite decomposition).
 *
 * When @openelement/element is loaded from JSR (https:// import.meta.url),
 * Vite's SSR runner cannot load https:// URLs via Node.js ESM loader.
 * This module intercepts @openelement/element/* imports and loads source code
 * through virtual modules, bypassing Node.js ESM loader entirely.
 *
 * ADR 0018 Phase 0: buildCoreSubpathAliases() DELETED.
 * Local mode now relies on @deno/vite-plugin for bare specifier resolution.
 * Remote JSR resolution (createCoreResolvePlugin) is retained because
 * JSR packages are not in node_modules and require virtual module loading.
 */

import type { Plugin } from 'vite';

import { formatError, OpenElementError } from '@openelement/element';

/** Virtual module ID prefix for JSR remote resolution */
export const VIRTUAL_CORE_PREFIX = '\0openelement:core/src/';

/**
 * Mapping of @openelement/element/* subpath specifiers to source files
 * (used by JSR remote resolution only).
 */
export const CORE_SUBPATHS: Record<string, string> = {
  logger: 'logger.ts',
  'build-context': 'build-context.ts',
  errors: 'errors.ts',
};

// M-08 fix: Add max size limit to prevent unbounded memory growth in long dev sessions

const JSR_CACHE_MAX = 100;
const jsrSourceCache = new Map<string, string>();

function cacheGet(key: string): string | undefined {
  return jsrSourceCache.get(key);
}

function cacheSet(key: string, value: string): void {
  if (jsrSourceCache.size >= JSR_CACHE_MAX) {
    // Evict oldest entry
    const firstKey = jsrSourceCache.keys().next().value;
    if (firstKey !== undefined) jsrSourceCache.delete(firstKey);
  }
  jsrSourceCache.set(key, value);
}

const OPENELEMENT_PACKAGE_SRC_BASE_RE = /\/@openelement\/([^/]+)\/([^/]+)\/src\/.*$/;
const SAFE_CORE_SOURCE_PATH_RE = /^[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*\.(?:ts|js)$/;

/**
 * Extract the JSR package source base URL from import.meta.url.
 * Handles both standard JSR paths and edge cases where the version
 * segment differs from expectations.
 */
function getOpenPackageSrcBase(metaUrl: string, packageName: string): string {
  const match = metaUrl.match(OPENELEMENT_PACKAGE_SRC_BASE_RE);
  if (match) {
    return metaUrl.replace(
      OPENELEMENT_PACKAGE_SRC_BASE_RE,
      `/@openelement/${packageName}/${match[2]}/src/`,
    );
  }
  return metaUrl
    .replace(/\/@openelement\/[^/]+@([^/]+)\/src\/.*$/, `/@openelement/${packageName}/$1/src/`)
    .replace(/\/src\/.*$/, '/src/');
}

function assertSafeCoreSourcePath(filePath: string): void {
  if (!SAFE_CORE_SOURCE_PATH_RE.test(filePath)) {
    throw new OpenElementError(
      `Unsafe @openelement/element source path: ${filePath}`,
      {
        code: 'JSR_INVALID_SOURCE_PATH',
        statusCode: 400,
        recoverable: false,
      },
    );
  }
}

export function buildCoreJsrSourceUrl(jsrSrcBase: string, filePath: string): string {
  assertSafeCoreSourcePath(filePath);
  const base = new URL(jsrSrcBase);
  if (base.protocol !== 'https:' && base.protocol !== 'http:') {
    throw new OpenElementError(
      `Unsafe @openelement/element source base URL: ${jsrSrcBase}`,
      {
        code: 'JSR_INVALID_SOURCE_BASE',
        statusCode: 400,
        recoverable: false,
      },
    );
  }
  return new URL(filePath, base).toString();
}

/**
 * Create the core subpath resolution plugin for JSR remote execution.
 *
 * When @openelement/element is loaded from JSR (https:// import.meta.url),
 * Vite's SSR runner cannot load https:// URLs via Node.js ESM loader.
 * This plugin intercepts @openelement/element/* imports and loads source code
 * through virtual modules, bypassing Node.js ESM loader entirely.
 */
export function createCoreResolvePlugin(metaUrl: string): Plugin {
  const isRemote = metaUrl.startsWith('https://') || metaUrl.startsWith('http://');

  // Compute JSR base URL for source fetching.
  let jsrSrcBase = '';
  if (isRemote) {
    jsrSrcBase = getOpenPackageSrcBase(metaUrl, 'core');
  }

  return {
    name: 'open:core-resolve',
    enforce: 'pre',

    resolveId(source, importer, options) {
      if (!isRemote) return;

      // Case 1: Bare specifier @openelement/element or @openelement/element/*
      if (source === '@openelement/element' || source.startsWith('@openelement/element/')) {
        const subpath = source === '@openelement/element'
          ? 'index.ts'
          : CORE_SUBPATHS[source.slice('@openelement/element/'.length)] ||
            `${source.slice('@openelement/element/'.length)}.ts`;
        return `${VIRTUAL_CORE_PREFIX}${subpath}`;
      }

      // Case 2: Relative imports from within our virtual modules
      if (
        importer?.startsWith(VIRTUAL_CORE_PREFIX) &&
        source.startsWith('./')
      ) {
        const importerDir = importer.replace(/[/\\][^/\\]+$/, '');
        return `${importerDir}/${source.slice(2)}`;
      }

      // Case 3: Third-party bare specifiers from virtual modules
      if (
        importer?.startsWith(VIRTUAL_CORE_PREFIX) &&
        !source.startsWith('/') &&
        !source.startsWith('.') &&
        !source.startsWith('\0')
      ) {
        return this.resolve(source, undefined, { ...options, skipSelf: true });
      }

      // Case 4: Already-resolved virtual IDs (re-resolve safeguard)
      if (source.startsWith(VIRTUAL_CORE_PREFIX)) {
        return source;
      }
    },

    async load(id) {
      if (!isRemote) return;
      if (!id.startsWith(VIRTUAL_CORE_PREFIX)) return;

      // Check cache
      if (jsrSourceCache.has(id)) return cacheGet(id);

      // Normalize .js -> .ts (Deno convention: imports use .js, files are .ts)
      let filePath = id.slice(VIRTUAL_CORE_PREFIX.length);
      if (filePath.endsWith('.js') && !filePath.endsWith('.ts')) {
        filePath = filePath.slice(0, -3) + '.ts';
      }

      // Fetch TypeScript source from JSR
      const url = buildCoreJsrSourceUrl(jsrSrcBase, filePath);
      let tsCode: string;
      // M-09 fix: Add 30s timeout for JSR fetches to prevent hanging builds
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30_000);
      try {
        const resp = await fetch(url, { signal: controller.signal });
        if (!resp.ok) {
          throw new Error(
            `[open:core-resolve] Failed to fetch ${url}: HTTP ${resp.status}`,
          );
        }
        tsCode = await resp.text();
        clearTimeout(timeoutId);
      } catch (err) {
        clearTimeout(timeoutId);
        throw new OpenElementError(
          `Failed to load @openelement/element module from JSR: ${filePath}. ` +
            `URL: ${url}. Error: ${formatError(err)}`,
          {
            code: 'JSR_FETCH_ERROR',
            statusCode: 500,
            recoverable: false,
          },
        );
      }

      // Compile TypeScript -> JavaScript via Vite's bundled esbuild transform
      let jsCode: string;
      try {
        const { transformWithEsbuild } = await import('vite');
        const result = await transformWithEsbuild(tsCode, filePath, {
          loader: 'ts',
          target: 'esnext',
          format: 'esm',
        });
        jsCode = result.code;
      } catch (err) {
        throw new OpenElementError(
          `Failed to compile @openelement/element module from JSR: ${filePath}. ` +
            `Error: ${formatError(err)}`,
          {
            code: 'JSR_COMPILE_ERROR',
            statusCode: 500,
            recoverable: false,
          },
        );
      }

      // Post-process: rewrite npm: specifiers to bare specifiers.
      jsCode = jsCode.replace(
        /(["'])npm:([^"']+)\1/g,
        (_: string, quote: string, specifier: string) => {
          const isScoped = specifier.startsWith('@');
          const withoutScope = isScoped ? specifier.slice(1) : specifier;
          const namePart = withoutScope.split('@')[0];
          return `${quote}${isScoped ? '@' : ''}${namePart}${quote}`;
        },
      );

      cacheSet(id, jsCode);
      return jsCode;
    },
  };
}
