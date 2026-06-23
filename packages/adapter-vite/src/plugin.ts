/**
 * Extracted from index.ts in v0.22 (SOP-004: adapter-vite decomposition).
 *
 * This is the core build plugin implementation. It is NOT part of the
 * public API. Use `openPipeline()` from the main entry instead.
 *
 * Internal only: called by openPipeline() and the @openelement/app umbrella.
 */

import type { Alias, Plugin } from 'vite';
import type {
  FrameworkOptions,
  HydrationStrategy,
  RouteEntry,
} from '@openelement/protocol/framework';
import type { OpenElementPackageManifest } from '@openelement/protocol/manifest';

import { join } from 'node:path';
import process from 'node:process';
import { formatError, OpenElementError } from '@openelement/core/errors';
import { createLogger } from '@openelement/core/logger';

const log = createLogger('adapter-vite');

import honoDevServer from '@hono/vite-dev-server';
import { OpenElementBuildContext } from './build-context.js';
import { findWorkspaceRoot, generateWorkspaceAliases } from './workspace-alias.js';
import { buildPlugin } from './build.js';
import { generateHonoEntryCode } from '@openelement/ssg';
import { buildHeadExtras } from './head-injection.js';
import { islandTransformPlugin } from './island-transform.js';
import { createGeneratedDataResolverPlugin } from './generated-data-resolver.js';
import {
  detectAndClassifyCemPackages,
  fileToTagName,
  scanIslands,
  scanPackageManifests,
  scanRoutes,
} from '@openelement/ssg';
import { createCoreResolvePlugin } from './subpath-resolver.js';
import { mdxPlugin } from './plugin-mdx.js';

type LessAliasOptions = Record<string, string> | Alias[] | null | undefined;

function mergeAliasOptions(
  primary: LessAliasOptions,
  fallback: LessAliasOptions,
): Record<string, string> | Alias[] | null {
  if (!primary) return fallback ?? null;
  if (!fallback) return primary;

  const merged: Alias[] = [];
  const append = (aliases: LessAliasOptions): void => {
    if (!aliases) return;
    if (Array.isArray(aliases)) {
      merged.push(...aliases);
      return;
    }
    for (const [find, replacement] of Object.entries(aliases)) {
      merged.push({ find, replacement });
    }
  };

  append(primary);
  append(fallback);
  return merged;
}

const OPTIONAL_PACKAGE_STUBS: Record<string, string> = {
  '@openelement/content':
    'export async function loadBlogData() { return { posts: [], basePath: "" }; }',
  '@openelement/content/sitemap': 'export function generateSitemap() { return []; }',
  '@openelement/app/i18n':
    'export function loadI18nData() { return { locales: [], defaultLocale: "en" }; }',
};

export function optionalPackageStubsPlugin(): Plugin {
  return {
    name: 'open:optional-package-stubs',
    enforce: 'pre',
    async resolveId(id) {
      if (!(id in OPTIONAL_PACKAGE_STUBS)) return;
      const resolved = await this.resolve(id, undefined, { skipSelf: true });
      if (resolved) return null;
      return `\0open:optional-stub:${id}`;
    },
    load(id) {
      const prefix = '\0open:optional-stub:';
      if (!id.startsWith(prefix)) return;
      return OPTIONAL_PACKAGE_STUBS[id.slice(prefix.length)];
    },
  };
}

/**
 * This is the core build plugin implementation. It is NOT part of the
 * public API. Use `openPipeline()` from @openelement/adapter-vite instead.
 *
 * Internal only: called by openPipeline() and the @openelement/app umbrella.
 * Jamstack: M=SSG+DSD, A=API Routes, J=Islands.
 *
 * @param options - Framework options
 * @param externalCtx - Optional shared OpenElementBuildContext (used by openElement() umbrella)
 * @internal
 */
export function createOpenPlugin(
  options: FrameworkOptions = {},
  externalCtx?: OpenElementBuildContext,
): Plugin[] {
  const metaUrl = import.meta.url;

  // Build head extras (validated HTML fragments, stylesheets, scripts)
  const { headExtras, allowHeadExtrasScripts } = buildHeadExtras(options);

  const resolvedOptions: FrameworkOptions & {
    allowHeadExtrasScripts?: boolean;
  } = {
    ...options,
    routesDir: options.routesDir || 'app/routes',
    islandsDir: options.islandsDir || 'app/islands',
    componentsDir: options.componentsDir || 'app/components',
    headExtras,
    allowHeadExtrasScripts,
  };

  const ctx = externalCtx || new OpenElementBuildContext(resolvedOptions);

  // Pre-generate workspace aliases (sync, once, cached in ctx).
  // Phase 1 config, Phase 2 client build, and Phase 3 SSG build
  // all read ctx.phase1.userResolveAlias - zero redundant generation.
  try {
    const wsRoot = findWorkspaceRoot(process.cwd());
    if (wsRoot) {
      ctx.phase1.userResolveAlias = generateWorkspaceAliases(wsRoot);
      log.info(
        `Auto-generated ${
          (ctx.phase1.userResolveAlias as Array<unknown>).length
        } resolve alias(es) from workspace`,
      );
    }
  } catch {
    log.debug('Workspace not available - aliases stay null');
  }

  const VIRTUAL_ENTRY_ID = 'virtual:open-hono-entry';
  const RESOLVED_ENTRY_ID = '\0' + VIRTUAL_ENTRY_ID;
  const VIRTUAL_BUILD_TRIGGER_ID = 'virtual:open-build-trigger';
  const RESOLVED_BUILD_TRIGGER_ID = '\0' + VIRTUAL_BUILD_TRIGGER_ID;

  function generateEntry(
    routes: RouteEntry[],
    islandTagNames: string[] = [],
    packageManifests: OpenElementPackageManifest[] = [],
    islandFiles: string[] = [],
  ): string {
    return generateHonoEntryCode(routes, {
      routesDir: resolvedOptions.routesDir,
      islandsDir: resolvedOptions.islandsDir,
      componentsDir: resolvedOptions.componentsDir,
      middleware: resolvedOptions.middleware,
      islandTagNames,
      islandFiles,
      islandMeta: ctx.phase1.islandMeta,
      packageManifests,
      headExtras: resolvedOptions.headExtras,
      allowHeadExtrasScripts,
      html: resolvedOptions.html,
      upgradeStrategy: resolvedOptions.island?.upgradeStrategy || 'idle',
      clientOnlyTags: [],
      appShell: resolvedOptions.appShell,
      layouts: resolvedOptions.layouts,
    });
  }

  const corePlugin: Plugin = {
    name: 'open:core',

    config(userConfig) {
      if (userConfig.resolve?.alias) {
        ctx.phase1.userResolveAlias = mergeAliasOptions(
          userConfig.resolve.alias as Record<string, string> | Alias[],
          ctx.phase1.userResolveAlias,
        );
      }

      const aliases = ctx.phase1.userResolveAlias as
        | Alias[]
        | Record<string, string>
        | null;

      return {
        resolve: aliases ? { alias: aliases } : undefined,
        build: {
          // The generated virtual entry intentionally contains the whole route graph.
          // Keep the budget explicit so Vite does not report it as an unexpected warning.
          chunkSizeWarningLimit: 1500,
          rollupOptions: {
            input: [VIRTUAL_BUILD_TRIGGER_ID],
          },
        },
      };
    },

    configResolved(cfg) {
      if (cfg.resolve?.alias && !ctx.phase1.userResolveAlias) {
        ctx.phase1.userResolveAlias = cfg.resolve.alias;
      }
      // v0.14.6: Generate placeholder entry code with empty routes in configResolved.
      // This is a Vite requirement - the virtual entry must exist before buildStart().
      // The real entry with actual routes is generated in buildStart() which runs later.
      ctx.phase1.honoEntryCode = generateEntry(
        [],
        ctx.phase1.islandTagNames,
        ctx.phase1.packageManifests,
        ctx.phase1.islandFiles,
      );
    },

    async buildStart() {
      ctx.reset();

      try {
        const routes = await scanRoutes(resolvedOptions.routesDir!);

        const islandsRoot = join(
          process.cwd(),
          resolvedOptions.islandsDir || 'app/islands',
        );
        const islandFiles = await scanIslands(islandsRoot);
        ctx.phase1.islandTagNames = islandFiles.map((f) => fileToTagName(f));
        ctx.phase1.islandFiles = islandFiles;
        const { scanIslandMeta } = await import('@openelement/ssg');
        ctx.phase1.islandMeta = await scanIslandMeta(islandsRoot, islandFiles);

        if (
          resolvedOptions.packageIslands &&
          resolvedOptions.packageIslands.length > 0
        ) {
          ctx.phase1.packageManifests = await scanPackageManifests(
            resolvedOptions.packageIslands,
          );
          if (ctx.phase1.packageManifests.length > 0) {
            // Extract island declarations from manifests
            ctx.phase1.packageIslandDecls = ctx.phase1.packageManifests.flatMap((pkg) =>
              pkg.declarations
                .filter((d) => d.openElement?.module)
                .map((d) => ({
                  tagName: d.tagName,
                  modulePath: d.openElement!.module!,
                  isPackage: true,
                  hydrate: d.openElement?.hydrate as HydrationStrategy | undefined,
                  ssr: d.openElement?.hydrate === 'only' ? false : d.openElement?.ssr,
                  dsd: d.openElement?.hydrate === 'only' ? false : d.openElement?.dsd,
                }))
            );
            log.info(
              `Package islands: ${ctx.phase1.packageIslandDecls.map((i) => i.tagName).join(', ')}`,
            );
          }
        }

        // Cache routes for lazy load() regeneration (ctx.blogOptions may not
        // be set yet - openContent() buildStart() runs after this one).
        ctx.phase1.cachedRoutes = routes;

        ctx.phase1.honoEntryCode = generateEntry(
          routes,
          ctx.phase1.islandTagNames,
          ctx.phase1.packageManifests,
          ctx.phase1.islandFiles,
        );
        const { buildEntryDescriptor } = await import('@openelement/ssg');

        // v0.18.0: CEM auto-detection - scan node_modules for custom-elements.json
        // without importing or executing any package code.
        try {
          const nodeModulesDir = join(process.cwd(), 'node_modules');
          ctx.phase1.cemClassifications = await detectAndClassifyCemPackages(nodeModulesDir);
          if (ctx.phase1.cemClassifications.length > 0) {
            log.info(
              `CEM auto-detection: classified ${ctx.phase1.cemClassifications.length} component(s) from node_modules`,
            );
          }
        } catch (err) {
          // CEM detection is best-effort - never fail the build
          log.debug(
            `CEM auto-detection failed (non-fatal): ${formatError(err)}`,
          );
          ctx.phase1.cemClassifications = [];
        }

        ctx.phase1.ssrAdmissionPlan = buildEntryDescriptor(routes, {
          routesDir: resolvedOptions.routesDir,
          islandsDir: resolvedOptions.islandsDir,
          islandTagNames: ctx.phase1.islandTagNames,
          islandFiles: ctx.phase1.islandFiles,
          islandMeta: ctx.phase1.islandMeta,
          packageManifests: ctx.phase1.packageManifests,
          cemClassifications: ctx.phase1.cemClassifications,
          clientOnlyTags: [],
          appShell: resolvedOptions.appShell,
          layouts: resolvedOptions.layouts,
        }).ssrAdmissionPlan;
        const pageCount = routes.filter(
          (r) => r.type === 'page' && !r.special,
        ).length;
        const apiCount = routes.filter(
          (r) => r.type === 'api' && !r.special,
        ).length;
        const totalIslands = ctx.phase1.islandTagNames.length +
          ctx.phase1.packageIslandDecls.length;
        log.info(
          `Routes: ${pageCount} page(s), ${apiCount} API route(s), ` +
            `${totalIslands} island(s) - openElement Architecture`,
        );
      } catch (err) {
        throw new OpenElementError(`Route scan failed: ${formatError(err)}`, {
          code: 'ROUTE_SCAN_ERROR',
          statusCode: 500,
          recoverable: false,
        });
      }
    },
  };

  const virtualEntryPlugin: Plugin = {
    name: 'open:virtual-entry',

    resolveId(id) {
      if (id === VIRTUAL_ENTRY_ID) return RESOLVED_ENTRY_ID;
      if (id === VIRTUAL_BUILD_TRIGGER_ID) return RESOLVED_BUILD_TRIGGER_ID;
    },

    load(id) {
      if (id === RESOLVED_BUILD_TRIGGER_ID) {
        return 'export default null;';
      }
      if (id === RESOLVED_ENTRY_ID) {
        // Always regenerate to pick up late-settled ctx fields (e.g., blogOptions
        // from openContent() buildStart() which runs after open:core buildStart()).
        // In dev mode, load() is called lazily by the SSR runner, so all buildStart()
        // hooks have completed by this point.
        return generateEntry(
          ctx.phase1.cachedRoutes || [],
          ctx.phase1.islandTagNames,
          ctx.phase1.packageManifests,
          ctx.phase1.islandFiles,
        );
      }
    },
  };

  const devServerPlugin = honoDevServer({
    entry: VIRTUAL_ENTRY_ID,
    injectClientScript: true,
  }) as Plugin;

  return [
    mdxPlugin(),
    corePlugin,
    createGeneratedDataResolverPlugin({ root: process.cwd() }),
    createCoreResolvePlugin(metaUrl),
    optionalPackageStubsPlugin(),
    virtualEntryPlugin,
    devServerPlugin,
    islandTransformPlugin(resolvedOptions.islandsDir!),
    buildPlugin(resolvedOptions, ctx),
  ];
}
