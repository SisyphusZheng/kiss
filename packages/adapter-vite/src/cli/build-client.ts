/**
 * @openelement/adapter-vite - CLI: Client Island Build
 *
 * Client build for Island components.
 * Produces dist/client/islands/*.js + manifest for SSG post-processing.
 *
 * ADR 0011: This module exports buildClient() only - it is called from
 * closeBundle() in open:build plugin. No longer a standalone CLI entry.
 * ctx parameter is required (no globalThis fallback).
 *
 * Usage:
 *   deno task build  (unified entry - runs all 3 phases)
 */

import { build as viteBuild, type InlineConfig } from 'vite';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import {
  generateClientEntry,
  resolveIslandHydrate,
  resolveIslandSsrDsd,
} from '../internal/ssg/index.ts';
import { fsPathToModuleSpecifier } from '../internal/ssg/module-specifier.ts';
import type { ClientIslandEntry } from '../internal/protocol/ssg.ts';
import type { OpenElementBuildContext } from '../build-context.ts';
import { createNpmSpecifierPlugin } from '../npm-specifier-plugin.ts';
import { parseJsonc } from '../internal/jsonc.ts';
import { sortAliasEntries } from '../alias-utils.ts';
import { formatError } from '@openelement/element';
import { createLogger } from '@openelement/element';
import {
  CHUNK_SIZE_WARNING_LIMIT_KB,
  DEFAULT_ISLANDS_DIR,
  DEFAULT_OUT_DIR,
} from '../internal/paths.ts';

const log = createLogger('build-client');

const VIRTUAL_CLIENT_ENTRY_ID = 'virtual:open-client-entry';
const RESOLVED_CLIENT_ENTRY_ID = '\0' + VIRTUAL_CLIENT_ENTRY_ID;

type ViteBuildOptionsWithManifest = NonNullable<InlineConfig['build']> & {
  manifest?: boolean;
};

type ViteInlineConfigWithManifest = Omit<InlineConfig, 'build'> & {
  build?: ViteBuildOptionsWithManifest;
};

/** Workspace root derived from this module's location (packages/adapter-vite/src/cli/).
 * Only valid in the local monorepo layout. In npm/JSR consumers, returns null. */
const WORKSPACE_ROOT: string | null = (() => {
  if (!import.meta.url.startsWith('file:')) return null;
  try {
    const root = fileURLToPath(new URL('../../../..', import.meta.url)).replace(/\\/g, '/');
    if (!existsSync(join(root, 'packages', 'element', 'deno.json'))) return null;
    return root;
  } catch (e) {
    log.warn('Unable to resolve workspace root, falling back to null', e);
    return null;
  }
})();

/**
 * Look up a bare specifier in a deno.json import map.
 * Walks up directory tree to find workspace-level deno.json as fallback.
 * Returns { target, denoJsonDir } so relative paths can be resolved correctly.
 */
function lookupInDenoJson(
  id: string,
  root: string,
): { target: string; denoJsonDir: string } | null {
  const denoJsonDirs = new Set<string>();
  let dir = resolve(root);

  // Walk up from consumer root
  while (!denoJsonDirs.has(dir)) {
    denoJsonDirs.add(dir);
    const found = tryDenoJsonDir(id, dir);
    if (found) return found;
    const parent = resolve(dir, '..');
    if (parent === dir) break;
    dir = parent;
  }

  // Also try workspace root (module-relative, for monorepo dev / testing)
  if (WORKSPACE_ROOT && !denoJsonDirs.has(WORKSPACE_ROOT)) {
    const found = tryDenoJsonDir(id, WORKSPACE_ROOT);
    if (found) return found;
  }

  return null;
}

/** Check a single directory for a deno.json with the given import. */
function tryDenoJsonDir(
  id: string,
  dir: string,
): { target: string; denoJsonDir: string } | null {
  const denoJsonPath = join(dir, 'deno.json');
  if (!existsSync(denoJsonPath)) return null;
  const raw = readFileSync(denoJsonPath, 'utf-8');
  // #708: shared JSONC parser (single implementation with workspace-alias.ts).
  // Handles mid-line // comments, /* */ blocks, string literals, and trailing commas.
  const denoJson = parseJsonc(raw);
  if (!denoJson) {
    log.warn('Invalid deno.json JSON, skipping');
    return null; // Invalid JSON — skip this deno.json
  }
  const imports = denoJson.imports as Record<string, string> | undefined;
  if (!imports) return null;
  // Exact match
  if (imports[id]) return { target: imports[id], denoJsonDir: dir };
  // Prefix/subpath matching (trailing slash)
  for (const [key, value] of Object.entries(imports)) {
    if (key.endsWith('/') && id.startsWith(key)) {
      return { target: value + id.slice(key.length), denoJsonDir: dir };
    }
  }
  return null;
}

/**
 * Convert a Deno import map target to a resolvable Vite path.
 * - file:// URLs → absolute filesystem path
 * - Relative paths (./) → resolved relative to denoJsonDir
 * - npm:, jsr: → null (handled by node_modules)
 */
function convertImportMapTarget(target: string, denoJsonDir: string): string | null {
  if (target.startsWith('file://')) {
    try {
      return fileURLToPath(target).replace(/\\/g, '/');
    } catch (e) {
      log.warn('Unable to convert file:// import-map target, skipping', e);
      return null;
    }
  }
  // Relative path — resolve relative to the deno.json directory
  if (target.startsWith('./') || target.startsWith('../')) {
    return resolve(denoJsonDir, target).replace(/\\/g, '/');
  }
  // npm:, jsr: — let Vite/Rolldown handle these normally
  return null;
}

async function buildClient(ctx: OpenElementBuildContext): Promise<void> {
  const root = ctx.phase3.root || process.cwd();
  const outDir = ctx.phase3.outDir || DEFAULT_OUT_DIR;
  const islandsDir = ctx.phase3.islandsDir || DEFAULT_ISLANDS_DIR;
  const localIslands = ctx.phase1.islandTagNames || [];
  const localIslandFiles = ctx.phase1.islandFiles || [];
  const packageIslandDecls = ctx.phase1.packageIslandDecls || [];

  // Aliases pre-generated by createOpenPlugin() and stored in ctx
  const resolveAlias = ctx.phase1.userResolveAlias;
  // #709: shared specificity sort with alias-utils.ts (single implementation).
  const serializedAlias = sortAliasEntries(
    resolveAlias
      ? (Array.isArray(resolveAlias)
        ? resolveAlias.map((a) => ({
          find: a.find,
          replacement: a.replacement,
        }))
        : Object.entries(resolveAlias).map(([find, replacement]) => ({ find, replacement })))
      : [],
  );

  // #569: an island-free app with data-open-enhance forms still needs the
  // client entry — it carries the form-enhancement layer.
  const enhancedForms = (ctx.phase1.cachedRoutes ?? []).some((route) =>
    route.type === 'page' && route.hasEnhancedForms === true
  );

  if (localIslands.length === 0 && packageIslandDecls.length === 0 && !enhancedForms) {
    log.info('No islands found - zero client JS output');
    return;
  }

  const totalIslands = localIslands.length + packageIslandDecls.length;
  log.info(
    `Building client bundle for ${totalIslands} island(s)` +
      (enhancedForms ? ' + data-open-enhance form enhancement' : '') + '...',
  );

  // Generate client entry code
  const islandEntries: ClientIslandEntry[] = [
    ...localIslands.map((tagName: string, i: number) => {
      const meta = ctx.phase1.islandMeta[tagName];
      return {
        tagName,
        // #460: resolve() emits drive-letter backslash paths on Windows; convert
        // to a Vite-resolvable specifier (root-relative or /@fs/).
        modulePath: fsPathToModuleSpecifier(
          resolve(
            root,
            localIslandFiles[i]
              ? `${islandsDir}/${localIslandFiles[i]}`
              : `${islandsDir}/${tagName}.ts`,
          ),
          root,
        ),
        isPackage: false,
        strategy: resolveIslandHydrate(meta?.hydrate, ctx.phase3.upgradeStrategy),
        ...resolveIslandSsrDsd(meta ?? {}),
        reason: meta?.reason,
      };
    }),
    ...packageIslandDecls.map(
      (island) => ({
        tagName: island.tagName,
        modulePath: island.modulePath,
        isPackage: true,
        // #638: forward the named export so the client factory reads
        // mod[exportName] (UI package chunks dropped `export default`).
        exportName: island.exportName,
        strategy: resolveIslandHydrate(island.hydrate, ctx.phase3.upgradeStrategy),
        ...resolveIslandSsrDsd(island),
        reason: island.reason,
      }),
    ),
  ];

  const clientEntryCode = generateClientEntry(islandEntries, { enhancedForms });

  // Restore RegExp from serialized noExternal patterns
  const noExternalPatterns = (ctx.phase3.ssrNoExternal || []).map((item) => {
    if (typeof item === 'string') return item;
    if (item && typeof item === 'object' && (item as Record<string, unknown>).__type === 'RegExp') {
      return new RegExp(
        (item as { source: string; flags: string }).source,
        (item as { source: string; flags: string }).flags,
      );
    }
    return item;
  });

  const clientOutDir = resolve(root, outDir, 'client');
  const clientBase = ctx.phase3.base || '/';
  const clientConfig: ViteInlineConfigWithManifest = {
    configFile: false,
    root,
    base: `${clientBase}client/`,
    logLevel: 'warn',
    // ADR-0057: JSX automatic runtime must be configured in the internal
    // viteBuild() call — configFile:false means user's vite.config.ts is
    // NOT read. Without this, esbuild defaults to classic React.createElement
    // transform, producing {type, props, $$typeof} objects that OpenElement
    // does not recognize (causes [object Object] rendering).
    esbuild: {
      jsx: 'automatic',
      jsxImportSource: '@openelement/element',
    },
    build: {
      outDir: clientOutDir,
      emptyOutDir: true,
      chunkSizeWarningLimit: CHUNK_SIZE_WARNING_LIMIT_KB,
      minify: 'oxc',
      manifest: true,
      rollupOptions: {
        input: { client: VIRTUAL_CLIENT_ENTRY_ID },
        output: {
          format: 'esm',
          entryFileNames: 'islands/[name].js',
          chunkFileNames: 'islands/[name]-[hash].js',
          manualChunks(id: string) {
            // Force preact + preact/hooks into a single chunk so the shared
            // options object is not duplicated across chunks (which breaks hooks).
            if (id.includes('node_modules/preact') || id.includes('/preact/')) {
              return 'preact';
            }
            if (id.includes(`/${islandsDir}/`)) {
              // Extensions mirror resolve.extensions below and scanIslands
              // (ts/tsx/js/jsx). Previously missing tsx/jsx meant .tsx
              // islands skipped manualChunks and lost the `island-` prefix.
              const match = id.match(/\/([^/]+)\.(ts|tsx|js|jsx)$/);
              if (match) return `island-${match[1]}`;
            }
            for (const island of packageIslandDecls) {
              if (id.includes(island.modulePath)) return `island-${island.tagName}`;
            }
          },
        },
      },
    },
    resolve: {
      ...(serializedAlias.length > 0 ? { alias: serializedAlias } : {}),
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
      dedupe: ['preact'],
    },
    ssr: {
      noExternal: (noExternalPatterns.length > 0 ? noExternalPatterns : undefined) as
        | (string | RegExp)[]
        | undefined,
    },
    plugins: [
      createNpmSpecifierPlugin(),
      {
        name: 'open:exclude-preact-rts',
        resolveId(id: string) {
          if (id === 'preact-render-to-string') {
            return '\0empty-preact-rts';
          }
          return null;
        },
        load(id: string) {
          if (id === '\0empty-preact-rts') {
            return 'export const renderToString = () => { throw new Error("preact-render-to-string is not available in browser"); };';
          }
          return null;
        },
      },
      {
        name: 'open:virtual-client-entry',
        resolveId(id) {
          if (id === VIRTUAL_CLIENT_ENTRY_ID) return RESOLVED_CLIENT_ENTRY_ID;
        },
        load(id) {
          if (id === RESOLVED_CLIENT_ENTRY_ID) return clientEntryCode;
        },
      },
      {
        name: 'open:deno-import-map-resolve',
        enforce: 'pre',
        async resolveId(id, importer) {
          // Only handle bare specifiers (no relative imports, no absolute paths)
          if (id.startsWith('.') || id.startsWith('/') || id.startsWith('file:')) {
            return null;
          }

          // Try deno.json import map — walks up from root to find
          // workspace-level deno.json as fallback for monorepo dev.
          const result = lookupInDenoJson(id, root);
          if (!result) return null;

          // Only handle file:// and relative targets (workspace-local dev mappings).
          // npm:, jsr: → return null, let node_modules handle them.
          const resolved = convertImportMapTarget(result.target, result.denoJsonDir);
          if (!resolved) return null;

          return await this.resolve(resolved, importer, { skipSelf: true });
        },
      },
    ],
  };

  try {
    await viteBuild(clientConfig);
    log.info('Client bundle built -> ' + clientOutDir);

    const { printBuildManifest } = await import('../build-manifest.ts');
    printBuildManifest({ root, outDir, phase: 2, budget: ctx.phase3.manifestBudget });
  } catch (error) {
    log.error(`Client build failed: ${formatError(error)}`);
    throw error;
  }
}

export { buildClient };
