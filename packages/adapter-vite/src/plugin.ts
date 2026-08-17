/**
 * Extracted from index.ts in v0.22 (SOP-004: adapter-vite decomposition).
 *
 * This is the core build plugin implementation. It is NOT part of the
 * public API. Use `openPipeline()` from the main entry instead.
 *
 * Internal only: called by openPipeline() and the @openelement/app umbrella.
 */

import type { Alias, Plugin, ViteDevServer } from 'vite';
import type {
  FrameworkOptions,
  OpenElementPackageManifest,
  RouteEntry,
} from './internal/protocol/framework.ts';
import type { SsgBehaviorOptions } from './internal/protocol/ssg.ts';

import { join, relative, resolve } from 'node:path';
import process from 'node:process';
import { formatError, OpenElementError } from '@openelement/element';
import { createLogger } from '@openelement/element';

const log = createLogger('adapter-vite');

import honoDevServer, { defaultOptions as honoDevServerDefaults } from '@hono/vite-dev-server';
import { OpenElementBuildContext } from './build-context.ts';
import { findWorkspaceRoot, generateWorkspaceAliases } from './workspace-alias.ts';
import { normalizeViteAliases } from './alias-utils.ts';
import { buildPlugin } from './build.ts';
import type { EntryDescriptor } from './internal/ssg/index.ts';
import {
  buildEntryDescriptor,
  generateCustomElementsPolyfill,
  renderEntry,
} from './internal/ssg/index.ts';
import { buildHeadExtras } from './head-injection.ts';
import { islandTransformPlugin } from './island-transform.ts';
import { devIslandClientPlugin } from './dev-island-client.ts';
import { createGeneratedDataResolverPlugin } from './generated-data-resolver.ts';
import {
  detectAndClassifyCemPackages,
  fileToTagName,
  scanForeignTags,
  scanIslandMeta,
  scanIslands,
  scanPackageManifests,
  scanRoutes,
} from './internal/ssg/index.ts';
import { buildPackageIslandDecls } from './internal/ssg/island-scanner.ts';
import { mdxPlugin } from './plugin-mdx.ts';
import {
  CHUNK_SIZE_WARNING_LIMIT_KB,
  DEFAULT_COMPONENTS_DIR,
  DEFAULT_ISLANDS_DIR,
  DEFAULT_ROUTES_DIR,
} from './internal/paths.ts';

type AliasOptionsInput = Record<string, string> | Alias[] | null | undefined;

function mergeAliasOptions(
  primary: AliasOptionsInput,
  fallback: AliasOptionsInput,
): Record<string, string> | Alias[] | null {
  if (!primary) return fallback ?? null;
  if (!fallback) return primary;

  const merged: Alias[] = [];
  const append = (aliases: AliasOptionsInput): void => {
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
  '@openelement/app/i18n':
    'console.warn("[openElement] Optional i18n package is unavailable; install and configure @openelement/app/i18n to enable locale expansion.");\n' +
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
  options: FrameworkOptions & { ssg?: SsgBehaviorOptions } = {},
  externalCtx?: OpenElementBuildContext,
): Plugin[] {
  // Build head extras (validated HTML fragments, stylesheets, scripts)
  const { headExtras, allowHeadExtrasScripts } = buildHeadExtras(options);

  const resolvedOptions: FrameworkOptions & {
    allowHeadExtrasScripts?: boolean;
    ssg?: SsgBehaviorOptions;
  } = {
    ...options,
    routesDir: options.routesDir || DEFAULT_ROUTES_DIR,
    islandsDir: options.islandsDir || DEFAULT_ISLANDS_DIR,
    componentsDir: options.componentsDir || DEFAULT_COMPONENTS_DIR,
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
  } catch (e) {
    log.debug('Workspace not available - aliases stay null', e);
  }

  const VIRTUAL_ENTRY_ID = 'virtual:open-hono-entry';
  const RESOLVED_ENTRY_ID = '\0' + VIRTUAL_ENTRY_ID;
  const VIRTUAL_BUILD_TRIGGER_ID = 'virtual:open-build-trigger';
  const RESOLVED_BUILD_TRIGGER_ID = '\0' + VIRTUAL_BUILD_TRIGGER_ID;
  // Dev SSR polyfill (ADR-0044): route modules call customElements.define()
  // at module top level, so the dev SSR entry imports the polyfill as its
  // first module — ESM evaluates it before every other import. The build
  // path ships the same stub as the Rollup banner (build-ssg.ts).
  const VIRTUAL_POLYFILL_ID = 'virtual:open-ssr-polyfill';
  const RESOLVED_POLYFILL_ID = '\0' + VIRTUAL_POLYFILL_ID;

  function buildDescriptor(
    routes: RouteEntry[],
    islandTagNames: string[] = [],
    packageManifests: OpenElementPackageManifest[] = [],
    islandFiles: string[] = [],
  ): EntryDescriptor {
    return buildEntryDescriptor(routes, {
      routesDir: resolvedOptions.routesDir,
      islandsDir: resolvedOptions.islandsDir,
      middleware: resolvedOptions.middleware,
      islandTagNames,
      islandFiles,
      islandMeta: ctx.phase1.islandMeta,
      packageManifests,
      cemClassifications: ctx.phase1.cemClassifications,
      foreignTags: ctx.phase1.foreignTags,
      headExtras: resolvedOptions.headExtras,
      allowHeadExtrasScripts,
      html: resolvedOptions.html,
      upgradeStrategy: resolvedOptions.island?.upgradeStrategy || 'idle',
      appShell: resolvedOptions.appShell,
      layouts: resolvedOptions.layouts,
    });
  }

  // alpha.17 B1: the entry descriptor is instantiated once per buildStart and
  // shared between the emitted virtual entry code (renderEntry) and
  // ctx.phase1.ssrAdmissionPlan. Previously the descriptor was built twice
  // with divergent options (the plan saw CEM classifications, the emitted
  // entry did not).
  let entryDescriptor: EntryDescriptor | null = null;

  function generateEntry(
    routes: RouteEntry[],
    islandTagNames: string[] = [],
    packageManifests: OpenElementPackageManifest[] = [],
    islandFiles: string[] = [],
  ): string {
    entryDescriptor = buildDescriptor(routes, islandTagNames, packageManifests, islandFiles);
    return renderEntry(entryDescriptor);
  }

  /**
   * #1028: dev-only route rescan. buildStart() scans the routes dir once, so a
   * route file added/removed while `deno task dev` runs never reached the
   * cached entryDescriptor and 404'd until restart. Re-scan, rebuild the
   * descriptor (virtualEntryPlugin.load() renders from it), and invalidate the
   * virtual entry module so the dev server re-evaluates it on the next pass.
   */
  async function rescanRoutes(): Promise<void> {
    const routes = await scanRoutes(resolvedOptions.routesDir!);
    ctx.phase1.cachedRoutes = routes;
    if (resolvedOptions.mode === 'spa') return;
    generateEntry(
      routes,
      ctx.phase1.islandTagNames,
      ctx.phase1.packageManifests,
      ctx.phase1.islandFiles,
    );
    if (entryDescriptor) {
      ctx.phase1.ssrAdmissionPlan = entryDescriptor.ssrAdmissionPlan;
    }
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
      const normalizedAliases = normalizeViteAliases(aliases, process.cwd());
      if (normalizedAliases) {
        ctx.phase1.userResolveAlias = normalizedAliases;
      }

      return {
        resolve: normalizedAliases ? { alias: normalizedAliases } : undefined,
        build: {
          // The generated virtual entry intentionally contains the whole route graph.
          // Keep the budget explicit so Vite does not report it as an unexpected warning.
          chunkSizeWarningLimit: CHUNK_SIZE_WARNING_LIMIT_KB,
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
      // The returned code string is discarded: the call's job is to populate
      // entryDescriptor, which virtualEntryPlugin.load() renders from.
      generateEntry(
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
          resolvedOptions.islandsDir || DEFAULT_ISLANDS_DIR,
        );
        const islandFiles = await scanIslands(islandsRoot);
        ctx.phase1.islandTagNames = islandFiles.map((f) => fileToTagName(f));
        ctx.phase1.islandFiles = islandFiles;
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
            ctx.phase1.packageIslandDecls = buildPackageIslandDecls(
              ctx.phase1.packageManifests,
              resolvedOptions.island?.upgradeStrategy,
            );
            log.info(
              `Package islands: ${ctx.phase1.packageIslandDecls.map((i) => i.tagName).join(', ')}`,
            );
          }
        }

        // Cache routes for lazy load() regeneration (ctx.blogOptions may not
        // be set yet - openContent() buildStart() runs after this one).
        ctx.phase1.cachedRoutes = routes;

        // SPA mode: skip SSR virtual entry generation + SSR admission plan
        if (resolvedOptions.mode === 'spa') {
          ctx.phase1.isSpa = true;
          log.info('SPA mode: skipping SSR entry generation, SSG rendering will be skipped');
          const pageCount = routes.filter(
            (r) => r.type === 'page' && !r.special,
          ).length;
          const totalIslands = ctx.phase1.islandTagNames.length +
            ctx.phase1.packageIslandDecls.length;
          log.info(
            `Routes: ${pageCount} page(s), ${totalIslands} island(s) - openElement Architecture (SPA)`,
          );
          return;
        }

        // v0.18.0: CEM auto-detection - scan node_modules for custom-elements.json
        // without importing or executing any package code. Runs BEFORE the entry
        // descriptor is built so the emitted entry and the SSR admission plan
        // share one descriptor instantiation (alpha.17 B1).
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

        // #979 (0.43.0-alpha.2): foreign-tag discovery. Scan page route and
        // island sources for custom-element tags that are neither local
        // islands, package-manifest islands, nor openElement-authored
        // elements, so the admission plan records them explicitly
        // (client-only, visibility only) instead of never seeing them.
        try {
          const knownTags = new Set<string>(ctx.phase1.islandTagNames);
          for (const pkg of ctx.phase1.packageManifests) {
            for (const decl of pkg.declarations) knownTags.add(decl.tagName);
          }
          const pageRoutes = routes.filter((r) => r.type === 'page' && !r.special);
          for (const route of pageRoutes) {
            knownTags.add(fileToTagName(route.filePath));
            if (route.tagName) knownTags.add(route.tagName);
          }
          const shellConfigs = [
            resolvedOptions.appShell,
            ...Object.values(resolvedOptions.layouts ?? {}),
          ];
          for (const shell of shellConfigs) {
            if (shell && typeof shell === 'object' && shell.tagName) {
              knownTags.add(shell.tagName);
            }
          }
          ctx.phase1.foreignTags = await scanForeignTags({
            routesDir: join(process.cwd(), resolvedOptions.routesDir || DEFAULT_ROUTES_DIR),
            islandsDir: islandsRoot,
            routeFiles: pageRoutes.map((r) => r.filePath),
            islandFiles,
            knownTags,
          });
          if (ctx.phase1.foreignTags.length > 0) {
            log.info(
              `Foreign WC tags consumed in JSX: ${ctx.phase1.foreignTags.join(', ')}`,
            );
          }
        } catch (err) {
          // Foreign-tag discovery is best-effort - never fail the build
          log.debug(
            `Foreign-tag scan failed (non-fatal): ${formatError(err)}`,
          );
          ctx.phase1.foreignTags = [];
        }

        // Single descriptor instantiation: the emitted entry code and the
        // admission plan come from the same object. The returned code string
        // is discarded — the call populates entryDescriptor, which
        // virtualEntryPlugin.load() renders from.
        generateEntry(
          routes,
          ctx.phase1.islandTagNames,
          ctx.phase1.packageManifests,
          ctx.phase1.islandFiles,
        );
        if (entryDescriptor) {
          ctx.phase1.ssrAdmissionPlan = entryDescriptor.ssrAdmissionPlan;
        }
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

    configureServer(server: ViteDevServer) {
      const absoluteRoutesDir = resolve(process.cwd(), resolvedOptions.routesDir!);
      server.watcher.add(absoluteRoutesDir);

      // Only add/unlink change the route SET; content edits to an existing
      // route file flow through normal HMR without touching the descriptor.
      const onRouteSetChanged = (file: string) => {
        if (!file.startsWith(absoluteRoutesDir)) return;
        if (!/\.(ts|tsx|js|jsx|mdx)$/.test(file)) return;

        rescanRoutes().then(() => {
          const mod = server.moduleGraph.getModuleById(RESOLVED_ENTRY_ID);
          if (mod) server.moduleGraph.invalidateModule(mod);
          log.info(`Routes changed: ${relative(process.cwd(), file)} - reloading`);
          server.hot.send({ type: 'full-reload' });
        }).catch((err: unknown) => {
          // A broken route file must not kill the dev server — the next edit
          // re-triggers the scan.
          log.error(`Route rescan failed: ${formatError(err)}`);
        });
      };

      server.watcher.on('add', onRouteSetChanged);
      server.watcher.on('unlink', onRouteSetChanged);
      server.httpServer?.on('close', () => {
        server.watcher.off('add', onRouteSetChanged);
        server.watcher.off('unlink', onRouteSetChanged);
      });
    },
  };

  const virtualEntryPlugin: Plugin = {
    name: 'open:virtual-entry',

    resolveId(id) {
      if (id === VIRTUAL_ENTRY_ID) return RESOLVED_ENTRY_ID;
      if (id === VIRTUAL_BUILD_TRIGGER_ID) return RESOLVED_BUILD_TRIGGER_ID;
      if (id === VIRTUAL_POLYFILL_ID) return RESOLVED_POLYFILL_ID;
    },

    load(id) {
      if (id === RESOLVED_POLYFILL_ID) {
        return generateCustomElementsPolyfill();
      }
      if (id === RESOLVED_BUILD_TRIGGER_ID) {
        return 'export default null;';
      }
      if (id === RESOLVED_ENTRY_ID) {
        // Reuse the descriptor built in buildStart(): the emitted entry code
        // and ctx.phase1.ssrAdmissionPlan must come from one instantiation.
        // The descriptor does not depend on late-settled plugin data, so
        // regeneration is only a fallback for the pre-buildStart placeholder.
        const entryCode = entryDescriptor ? renderEntry(entryDescriptor) : generateEntry(
          ctx.phase1.cachedRoutes || [],
          ctx.phase1.islandTagNames,
          ctx.phase1.packageManifests,
          ctx.phase1.islandFiles,
        );
        return `import '${VIRTUAL_POLYFILL_ID}';\n` + entryCode;
      }
    },
  };

  // SPA mode is client-only: the @hono/vite-dev-server middleware would import
  // route modules on the server to SSR-render them, but route modules call
  // `customElements.define(...)` at module top level (and may touch `document`/
  // `localStorage`), which crashes with "customElements is not defined" in a
  // server context. In SPA mode the client bootstrap (e.g. reader.tsx) owns
  // rendering, so Vite's built-in SPA middleware (index.html + HMR) is all we
  // need. Skip the SSR dev server entirely.
  const plugins: Plugin[] = [
    mdxPlugin(),
    corePlugin,
    createGeneratedDataResolverPlugin({ root: process.cwd() }),
    optionalPackageStubsPlugin(),
    virtualEntryPlugin,
  ];

  if (resolvedOptions.mode !== 'spa') {
    plugins.push(
      honoDevServer({
        entry: VIRTUAL_ENTRY_ID,
        // ADR-0123 item 2 (#858): with middleware.use configured, the entry
        // exposes openElementDevFetch — the dev-server-shaped adapter over the
        // same composed fetch-middleware handler that the start CLI, the e2e
        // fixture server, and the Nitro entry use. Without it, keep the
        // default export (the bare Hono app) so the dev path is unchanged.
        ...(resolvedOptions.middleware?.use?.length ? { export: 'openElementDevFetch' } : {}),
        injectClientScript: true,
        // #951: the upstream exclude regexes test req.url WITH its query
        // string, so vite's versioned module URLs (/.vite/deps/x.js?v=hash —
        // the optimized-dependency form of every bare import in the dev island
        // client graph) fell through to the Hono app and 404'd. Extend the
        // defaults to let versioned module requests reach Vite.
        exclude: [...honoDevServerDefaults.exclude, /\?v=[A-Za-z0-9]+$/],
      }) as Plugin,
    );
  }

  plugins.push(
    islandTransformPlugin(resolvedOptions.islandsDir!),
    buildPlugin(resolvedOptions, ctx),
    // #951: dev-only serving of the island client entry at the same public
    // URL the production build emits (<base>client/islands/client.js).
    devIslandClientPlugin(resolvedOptions, ctx),
  );

  return plugins;
}
