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
import { generateClientEntry } from '@openelement/ssg';
import type { ClientIslandEntry } from '@openelement/protocol/ssg';
import type { OpenElementBuildContext } from '../build-context.ts';
import { createOpenJsrPackageResolverPlugin } from '../ssg-package-resolver.ts';
import { formatError } from '@openelement/core/errors';
import { createLogger } from '@openelement/core/logger';

const log = createLogger('ssg');

const VIRTUAL_CLIENT_ENTRY_ID = 'virtual:open-client-entry';
const RESOLVED_CLIENT_ENTRY_ID = '\0' + VIRTUAL_CLIENT_ENTRY_ID;
const FALLBACK_openElement_VERSION = '0.23.0';

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
    // Sanity check: the real workspace has packages/core/src/style-sheet.ts.
    if (!existsSync(join(root, 'packages', 'core', 'src', 'style-sheet.ts'))) return null;
    return root;
  } catch {
    return null;
  }
})();

function getJsrPackageVersion(metaUrl: string): string {
  const match = metaUrl.match(/\/@openelement\/adapter-vite\/([^/]+)\//);
  return match?.[1] ?? FALLBACK_openElement_VERSION;
}

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
  // Strip JSONC comments:
  // - Line comments: // at start of line (after optional whitespace)
  // - Block comments: /* ... */
  // - Trailing commas (Deno JSONC allows them, JSON.parse does not)
  const json = raw
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/,\s*([}\]])/g, '$1');
  let denoJson: Record<string, unknown>;
  try {
    denoJson = JSON.parse(json);
  } catch {
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
    } catch {
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
  const outDir = ctx.phase3.outDir || 'dist';
  const islandsDir = ctx.phase3.islandsDir || 'app/islands';
  const localIslands = ctx.phase1.islandTagNames || [];
  const localIslandFiles = ctx.phase1.islandFiles || [];
  const packageIslandDecls = ctx.phase1.packageIslandDecls || [];

  // Aliases pre-generated by createOpenPlugin() and stored in ctx
  const resolveAlias = ctx.phase1.userResolveAlias;
  const serializedAlias = resolveAlias
    ? (Array.isArray(resolveAlias)
      ? resolveAlias.filter((a) => typeof a.find === 'string').map((a) => ({
        find: a.find as string,
        replacement: a.replacement,
      }))
      : Object.entries(resolveAlias).map(([find, replacement]) => ({ find, replacement })))
    : [];

  // Always resolve @openelement/core/style-sheet from workspace (core re-exports it)
  if (WORKSPACE_ROOT) {
    serializedAlias.push({
      find: '@openelement/core/style-sheet',
      replacement: join(WORKSPACE_ROOT, 'packages', 'core', 'src', 'style-sheet.ts'),
    });
    (serializedAlias as Array<{ find: string | RegExp; replacement: string }>).push({
      find: /^@openelement\/router/,
      replacement: join(WORKSPACE_ROOT, 'packages', 'router', 'src'),
    });
  }
  serializedAlias.sort((a, b) => {
    const findA = typeof a.find === 'string' ? a.find.length : 0;
    const findB = typeof b.find === 'string' ? b.find.length : 0;
    return findB - findA;
  });

  if (localIslands.length === 0 && packageIslandDecls.length === 0) {
    log.info('No islands found - zero client JS output');
    return;
  }

  const totalIslands = localIslands.length + packageIslandDecls.length;
  log.info(`Building client bundle for ${totalIslands} island(s)...`);

  // Generate client entry code
  const islandEntries: ClientIslandEntry[] = [
    ...localIslands.map((tagName: string, i: number) => ({
      tagName,
      modulePath: resolve(
        root,
        localIslandFiles[i]
          ? `${islandsDir}/${localIslandFiles[i]}`
          : `${islandsDir}/${tagName}.ts`,
      ).replace(/\\/g, '/'),
      isPackage: false,
      strategy: ctx.phase1.islandMeta[tagName]?.hydrate || ctx.phase3.upgradeStrategy || 'idle',
      ssr: ctx.phase1.islandMeta[tagName]?.hydrate === 'only'
        ? false
        : ctx.phase1.islandMeta[tagName]?.ssr,
      dsd: ctx.phase1.islandMeta[tagName]?.hydrate === 'only'
        ? false
        : ctx.phase1.islandMeta[tagName]?.dsd,
      reason: ctx.phase1.islandMeta[tagName]?.reason,
    })),
    ...packageIslandDecls.map(
      (island) => ({
        tagName: island.tagName,
        modulePath: island.modulePath,
        isPackage: true,
        strategy: island.hydrate || ctx.phase3.upgradeStrategy || 'idle',
        ssr: island.hydrate === 'only' ? false : island.ssr,
        dsd: island.hydrate === 'only' ? false : island.dsd,
        reason: island.reason,
      }),
    ),
  ];

  const clientEntryCode = generateClientEntry(islandEntries);

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
    // transform, producing {type, props, $$typeof} objects that DsdElement
    // does not recognize (causes [object Object] rendering).
    esbuild: {
      jsx: 'automatic',
      jsxImportSource: '@openelement/core',
    },
    build: {
      outDir: clientOutDir,
      emptyOutDir: true,
      chunkSizeWarningLimit: 1500,
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
              const match = id.match(/\/([^/]+)\.(ts|js)$/);
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
      createOpenJsrPackageResolverPlugin({
        workspaceRoot: WORKSPACE_ROOT,
        version: getJsrPackageVersion(import.meta.url),
      }),
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
