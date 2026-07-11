/**
 * @openelement/adapter-vite - CLI: SSG Build
 *
 * SSG rendering + post-processing.
 * Builds a self-contained SSR bundle via viteBuild(ssr:true, noExternal),
 * then imports it to render all pages to static HTML, and post-processes
 * island paths.
 *
 * ADR 0011: This module exports buildSSG() only - it is called from
 * closeBundle() in open:build plugin. No longer a standalone CLI entry.
 * ctx parameter is required (no globalThis fallback).
 *
 * Usage:
 *   deno task build  (unified entry - runs all 3 phases)
 */

import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizePath } from 'vite';
import process from 'node:process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import type {
  FrameworkOptions,
  HydrationStrategy,
  RouteEntry,
} from '@openelement/protocol/framework';
import type { OpenElementPackageManifest } from '@openelement/protocol/manifest';
import type { OpenElementBuildContext } from '../build-context.ts';
import { ssgRender } from '@openelement/ssg';
import { SsrRenderError } from '@openelement/core/errors';
import { createLogger } from '@openelement/core/logger';
import { createSsgRenderEvidence } from './ssg-render.ts';
import { createGeneratedDataResolverPlugin } from '../generated-data-resolver.ts';
import { createOpenJsrPackageResolverPlugin } from '../ssg-package-resolver.ts';
import { generateSsrPolyfillBanner, resolveExternalManifest } from '@openelement/ssg';
import { optionalPackageStubsPlugin } from '../plugin.ts';
import { normalizeViteAliases } from '../alias-utils.ts';

/** Fallback package version when adapter-vite cannot read its own deno.json. */
const DEFAULT_ADAPTER_VERSION_FALLBACK = '0.35.1';

/** Chunk size warning limit (kB) for the SSR bundle build. */
const SSR_CHUNK_SIZE_WARNING_LIMIT_KB = 1500;

/** Rollup/Vite output paths mapping for known externals. */
const SSR_EXTERNAL_PATHS: Record<string, string> = {
  'sanitize-html': 'npm:sanitize-html@^2.17.4',
};

const log = createLogger('ssg');

const VIRTUAL_SSG_ENTRY_ID = 'virtual:open-ssg-entry';
const RESOLVED_SSG_ENTRY_ID = '\0' + VIRTUAL_SSG_ENTRY_ID;
function getJsrPackageVersion(metaUrl: string): string {
  const match = metaUrl.match(/\/@openelement\/adapter-vite\/([^/]+)\//);
  if (match) return match[1];
  // Read from own deno.json
  try {
    const denoJson = JSON.parse(
      typeof Deno !== 'undefined'
        ? Deno.readTextFileSync(new URL('../deno.json', import.meta.url))
        : readFileSync(new URL('../deno.json', import.meta.url), 'utf-8'),
    );
    return denoJson.version || DEFAULT_ADAPTER_VERSION_FALLBACK;
  } catch {
    return DEFAULT_ADAPTER_VERSION_FALLBACK;
  }
}

function getLocalOpenElementPackageRoot(metaUrl: string): string | null {
  if (!metaUrl.startsWith('file:')) return null;
  try {
    const root = resolve(fileURLToPath(new URL('.', metaUrl)), '..', '..', '..', '..');
    return existsSync(resolve(root, 'packages', 'core', 'deno.json')) ? root : null;
  } catch {
    return null;
  }
}

interface BuildSSGOptions {
  root?: string;
  outDir?: string;
  routesDir?: string;
  islandsDir?: string;
  middleware?: FrameworkOptions['middleware'];
  ssr?: FrameworkOptions['ssr'];
  islandTagNames?: string[];
  /** Phase 1 discoveries reused by the production BuildPlan path. */
  routes?: RouteEntry[];
  islandFiles?: string[];
  islandMeta?: Record<string, Partial<import('@openelement/protocol/ssg').IslandDecl>>;
  packageManifests?: OpenElementPackageManifest[];
  /** @security Injected as raw HTML without sanitization */
  headExtras?: string;
  allowHeadExtrasScripts?: boolean;
  html?: { lang?: string; title?: string };
  appShell?: FrameworkOptions['appShell'];
  layouts?: FrameworkOptions['layouts'];
  upgradeStrategy?: HydrationStrategy;
  resolveAlias?: Record<string, string> | import('vite').Alias[];
  base?: string;
  /**
   * View Transitions API configuration.
   * When true (default), injects <meta name="view-transition" content="same-origin">
   * into all HTML files for smooth cross-page animations in MPA navigation.
   * Set to false to disable.
   * @default true
   */
  viewTransition?: boolean;
  /**
   * Speculation Rules API configuration.
   * Enables browser prefetch/prerender of pages before the user navigates.
   * Can be a boolean (true = auto-generate from routes) or explicit rules.
   */
  speculation?: boolean | import('@openelement/protocol/ssg').SpeculationRulesOptions;
  /** ADR-0047: Skip Deno pre-resolution, use regex fallback for external deps. */
  skipPreResolution?: boolean;
}

async function buildSSG(
  options: BuildSSGOptions = {},
  ctx: OpenElementBuildContext,
): Promise<void> {
  const root = options.root || ctx.phase3.root || process.cwd();
  const outDir = options.outDir || ctx.phase3.outDir || 'dist';
  const routesDir = options.routesDir || ctx.phase3.routesDir || 'app/routes';
  const islandsDir = options.islandsDir || ctx.phase3.islandsDir || 'app/islands';
  const appShell = options.appShell ?? ctx.phase3.appShell;
  const layouts = options.layouts ?? ctx.phase3.layouts;

  // SOP-v0.21.6: Detect if we're running from a Deno workspace.
  // In workspace mode, @deno/vite-plugin resolves bare specifiers.
  // In JSR mode, we need the open:ssg-core-resolve plugin.
  const workspaceRoot = (() => {
    try {
      for (let d = resolve(root); d !== resolve(d, '..'); d = resolve(d, '..')) {
        const cfg = JSON.parse(readFileSync(resolve(d, 'deno.json'), 'utf-8'));
        if (cfg.workspace && Array.isArray(cfg.workspace)) return d;
      }
    } catch { /* deno.json not found, keep walking up */ }
    return null;
  })();

  // Read island metadata from ctx (ADR 0010: no .openElement/ fallback)
  const islandTagNames = options.islandTagNames || ctx.phase1.islandTagNames || [];
  const islandMeta = options.islandMeta || ctx.phase1.islandMeta || {};
  const packageManifests = options.packageManifests || ctx.phase1.packageManifests || [];
  const metadataResolveAlias = options.resolveAlias ||
    (ctx.phase1.userResolveAlias as Record<string, string> | import('vite').Alias[] | undefined);

  // Read options from ctx
  if (!options.headExtras) options.headExtras = ctx.phase3.headExtras || undefined;
  if (options.allowHeadExtrasScripts === undefined) {
    options.allowHeadExtrasScripts = ctx.phase3.allowHeadExtrasScripts;
  }
  if (!options.html) options.html = ctx.phase3.html || undefined;
  if (!options.middleware) options.middleware = ctx.phase3.middleware || undefined;
  if (!options.upgradeStrategy) options.upgradeStrategy = ctx.phase3.upgradeStrategy;
  if (!options.base) options.base = ctx.phase3.base;
  if (options.viewTransition === undefined) options.viewTransition = ctx.phase3.viewTransition;
  if (!options.speculation) options.speculation = ctx.phase3.speculation || undefined;

  // Generate SSG entry code
  const { scanRoutes, scanIslands, scanIslandMeta, fileToTagName } = await import(
    '@openelement/ssg'
  );
  const { generateHonoEntryCode } = await import('@openelement/ssg');

  const routes = options.routes ?? await scanRoutes(routesDir);

  // v0.25.0: Generate type-safe route parameter declarations for `virtual:open-routes`
  const { generateRouteTypes } = await import('@openelement/ssg');
  const routeTypeDts = generateRouteTypes(routes);
  const dotOpenElementDir = join(root, '.openElement');
  mkdirSync(dotOpenElementDir, { recursive: true });
  writeFileSync(join(dotOpenElementDir, 'routes.d.ts'), routeTypeDts, 'utf-8');
  log.info(`Route types generated -> .openElement/routes.d.ts`);

  const islandsRoot = join(root, islandsDir);
  const ssgIslandFiles = options.islandFiles ?? await scanIslands(islandsRoot);
  const ssgIslandTagNames = islandTagNames.length > 0
    ? islandTagNames
    : ssgIslandFiles.map((f) => fileToTagName(f));
  const ssgIslandMeta = Object.keys(islandMeta).length > 0
    ? islandMeta
    : await scanIslandMeta(islandsRoot, ssgIslandFiles);
  const { buildEntryDescriptor } = await import('@openelement/ssg');

  ctx.phase1.ssrAdmissionPlan = buildEntryDescriptor(routes, {
    routesDir,
    islandsDir,
    ssg: true,
    islandTagNames: ssgIslandTagNames,
    islandFiles: ssgIslandFiles,
    islandMeta: ssgIslandMeta,
    packageManifests,
    clientOnlyTags: [],
    appShell,
    layouts,
  }).ssrAdmissionPlan;

  const rawSsgEntryCode = generateSsrPolyfillBanner() + '\n' + generateHonoEntryCode(routes, {
    routesDir,
    islandsDir,
    middleware: options.middleware,
    ssg: true,
    islandTagNames: ssgIslandTagNames,
    islandFiles: ssgIslandFiles,
    islandMeta: ssgIslandMeta,
    packageManifests,
    headExtras: options.headExtras,
    allowHeadExtrasScripts: options.allowHeadExtrasScripts,
    html: options.html,
    upgradeStrategy: options.upgradeStrategy || 'idle',
    clientOnlyTags: [],
    appShell,
    layouts,
  });
  // Deno import map resolution handles bare specifiers (e.g. @openelement/ui/open-callout)
  // via the createDenoImportMapPlugin added to the Phase 3 viteBuild plugins below.
  const ssgEntryCode = rawSsgEntryCode;

  try {
    const { build: viteBuild } = await import('vite');

    // SSR noExternal: packages that MUST be inlined into the SSR bundle.
    // Without these, the SSR bundle contains bare specifier imports that cannot
    // be resolved in non-workspace environments (e.g. CF Pages), causing
    // import(entry.js) to fail and the entire SSG pipeline to produce empty HTML.
    const defaultNoExternal = [
      /^@openelement\//,
    ];
    // ADR-0047: External packages are externalized, not bundled.
    // ADR-0054: AST-based exports resolution covers ALL subpath exports
    // so Rolldown externalizes them correctly via manifest.specifiers.
    // Consumer template deno.json declares these packages so Deno can
    // resolve them at runtime when buildSSG() executes import(entry.js).
    // Hono stays external unless the user explicitly requests adapter-specific
    // bundling through options.ssr.noExternal.
    const ssrExternalDefaults = [
      'hono',
    ];

    // Step 0: Deno pre-resolution + AST subpath discovery (ADR-0047 + ADR-0054)
    const manifest = await resolveExternalManifest(
      ssrExternalDefaults,
      root,
      options.skipPreResolution || ctx.phase3?.skipPreResolution,
    );

    const userNoExternal = options.ssr?.noExternal || [];
    const allNoExternal = [...defaultNoExternal, ...userNoExternal];

    // Handle alias - prefer CLI options, then ctx from Phase 1
    const alias = metadataResolveAlias;
    const viteResolveAlias = normalizeViteAliases(alias, root);
    if (alias) {
      if (Array.isArray(alias)) {
        for (const a of alias) {
          if (a.find === '@openelement/ui') {
            // v0.14.6: Check if replacement is already covered by defaultNoExternal
            const isAlreadyCovered = defaultNoExternal.some(
              (pattern: string | RegExp) =>
                pattern instanceof RegExp && pattern.test(a.replacement),
            );
            if (!isAlreadyCovered) {
              allNoExternal.push(a.replacement);
            }
          }
        }
      } else if ('@openelement/ui' in alias) {
        const isAlreadyCovered = defaultNoExternal.some(
          (pattern: string | RegExp) =>
            pattern instanceof RegExp && pattern.test(alias['@openelement/ui']),
        );
        if (!isAlreadyCovered) {
          allNoExternal.push(alias['@openelement/ui']);
        }
      }
    }

    // Build the self-contained SSR bundle (ADR 0008 Phase C)
    // Replaces createServer() + ssrLoadModule() with viteBuild + import().
    // noExternal ensures all dependencies are inlined into a single bundle,
    // so module-level variables (Phase B) are shared across the entire graph.
    const ssrOutDir = join(root, outDir, 'server');
    log.info(`Building SSR bundle -> ${ssrOutDir}`);
    const clientOnlyIslandIds = new Set(
      Object.entries(ssgIslandMeta)
        .filter(([, meta]) => meta.ssr === false)
        .map(([tag]) => {
          const file = ssgIslandFiles[ssgIslandTagNames.indexOf(tag)];
          return file ? normalizePath(resolve(root, islandsDir, file)) : '';
        })
        .filter(Boolean),
    );
    // v0.21: Build filePath -> tagName map for client-only placeholder generation.
    const clientOnlyTagMap = new Map<string, string>();
    for (const [tag, meta] of Object.entries(ssgIslandMeta)) {
      if (meta.ssr !== false) continue;
      const file = ssgIslandFiles[ssgIslandTagNames.indexOf(tag)];
      if (file) clientOnlyTagMap.set(normalizePath(resolve(root, islandsDir, file)), tag);
    }

    // v0.21 SOP-004: Conflict detection: same tag must not be both SSR and client:only.
    const ssrTags = new Set(
      Object.entries(ssgIslandMeta)
        .filter(([, meta]) => meta.ssr !== false)
        .map(([tag]) => tag),
    );
    const conflictTags = [...clientOnlyTagMap.values()].filter((t) => ssrTags.has(t));
    if (conflictTags.length > 0) {
      throw new Error(
        `[openElement] SSR+client:only conflict detected for tags: ${conflictTags.join(', ')}. ` +
          'A tag cannot be both SSR-capable and client:only on the same page.',
      );
    }

    await viteBuild({
      configFile: false,
      root,
      logLevel: 'error',
      build: {
        ssr: true,
        outDir: ssrOutDir,
        chunkSizeWarningLimit: SSR_CHUNK_SIZE_WARNING_LIMIT_KB,
        rollupOptions: {
          input: { entry: VIRTUAL_SSG_ENTRY_ID },
          // v0.21: Suppress IMPORT_IS_UNDEFINED for revalidate; the generated
          // code uses typeof check which correctly handles undefined exports.
          onwarn(warning, warn) {
            if (warning.code === 'IMPORT_IS_UNDEFINED') return;
            warn(warning);
          },
          output: {
            format: 'esm',
            // Workspace sources may use explicit npm: specifiers that Rolldown
            // rewrites to bare imports while bundling. Re-emit known externals
            // as Deno-resolvable npm: imports for fresh JSR consumers.
            paths: SSR_EXTERNAL_PATHS,
            // ADR-0044: customElements polyfill must run before ESM imports.
            // Uses Map-backed define()/get(); renderDsdByName() looks up
            // components via customElements.get(tagName) during SSG rendering.
            // SOP-016: HTMLElement stub is self-contained in @openelement/core/dsd-element.ts.
            banner: `\
if (typeof globalThis.customElements === 'undefined') {
  const __openCeRegistry = new Map();
  globalThis.customElements = {
    define(name, ctor, _opts) { __openCeRegistry.set(name, ctor); },
    get(name) { return __openCeRegistry.get(name); },
    whenDefined(name) { return Promise.resolve(__openCeRegistry.get(name)); },
    upgrade(_root) {},
  };
}
`,
          },
        },
      },
      ssr: { noExternal: allNoExternal, external: manifest.specifiers },
      // ADR 0008 Phase A: Inject headExtras via define instead of .openElement/head-extras.html
      // The generated entry code uses __HEAD_EXTRAS__ which gets replaced
      // at build time. This avoids the Vite SSR AsyncFunction syntax errors
      // that large inline strings (with backticks/${}) cause.
      define: options.headExtras
        ? { __HEAD_EXTRAS__: JSON.stringify(options.headExtras) }
        : { __HEAD_EXTRAS__: '""' },
      esbuild: {
        // ADR-0057: JSX automatic runtime, same reason as build-client.ts.
        // SSG build also processes .tsx island files for SSR rendering.
        jsx: 'automatic',
        jsxImportSource: '@openelement/core',
        tsconfigRaw: {
          compilerOptions: {
            useDefineForClassFields: false,
          },
        },
      },
      plugins: [
        // ADR 0010: Virtual SSG entry module
        // Replaces .openElement/.openElement-ssg-entry.ts file write
        {
          name: 'open:virtual-ssg-entry',
          resolveId(id) {
            if (id === VIRTUAL_SSG_ENTRY_ID) return RESOLVED_SSG_ENTRY_ID;
          },
          load(id) {
            if (id === RESOLVED_SSG_ENTRY_ID) return ssgEntryCode;
          },
        },
        // ADR 0008 Phase C: Provide stubs for retained optional packages.
        // The generated entry code can import @openelement/content and
        // @openelement/i18n, but these may not be installed.
        // This plugin resolves them to empty stubs when missing, so the
        // viteBuild() succeeds regardless of which packages are available.
        optionalPackageStubsPlugin(),
        createGeneratedDataResolverPlugin({
          root,
          name: 'open:ssg-generated-data',
        }),
        createOpenJsrPackageResolverPlugin({
          workspaceRoot,
          version: getJsrPackageVersion(import.meta.url),
          localPackageRoot: getLocalOpenElementPackageRoot(import.meta.url),
          userAliases: metadataResolveAlias,
        }),
        {
          name: 'open:ssg-client-only-island-stubs',
          enforce: 'pre',
          load(id) {
            const normalized = normalizePath(id.split('?')[0]);
            if (!clientOnlyIslandIds.has(normalized)) return;
            const tagName = clientOnlyTagMap.get(normalized) || 'open-client-only-stub';
            // Client-only stub marker uses an unbranded attribute.
            // SSR outputs <tag-name data-client-only="true"></tag-name>
            // Client runtime imports the real module and upgrades the element.
            return [
              `import { defineIslandConfig } from '@openelement/app';`,
              `export const tagName = ${JSON.stringify(tagName)};`,
              'export const openElement = defineIslandConfig({ ssr: false });',
              `export default class OpenClientOnlyStub extends HTMLElement {
  connectedCallback() {
    if (!this.hasAttribute('data-client-only')) {
      this.setAttribute('data-client-only', 'true');
    }
  }
}`,
            ].join('\n');
          },
        },
      ],
      resolve: {
        preserveSymlinks: true,
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        ...(viteResolveAlias ? { alias: viteResolveAlias } : {}),
      },
    });
    log.info('SSR bundle built successfully');

    // Load the SSR bundle and run SSG rendering pipeline
    const ssrBundlePath = resolve(ssrOutDir, 'entry.js');
    // M-18 fix: Use process.platform instead of Deno.build.os for Node.js compat
    const isWindows = typeof process !== 'undefined' && process.platform === 'win32';
    const ssrBundleUrl = isWindows
      ? 'file:///' + ssrBundlePath.replace(/\\/g, '/')
      : 'file://' + ssrBundlePath;
    const module = await import(ssrBundleUrl) as Record<string, unknown>;

    if (!module.default) {
      throw new SsrRenderError('virtual:open-ssg-entry', new Error('Failed to load Hono app'));
    }

    // Delegate to shared ssgRender() - zero Vite dependency from this point
    await ssgRender(
      module as Parameters<typeof ssgRender>[0],
      {
        root,
        outDir,
        base: options.base || '/',
        headExtras: options.headExtras,
        html: options.html,
        middleware: options.middleware,
        islandTagNames: ssgIslandTagNames,
        viewTransition: options.viewTransition,
        speculation: options.speculation as boolean | Record<string, unknown> | undefined,
      },
      createSsgRenderEvidence(ctx),
    );

    log.info('Static site generated -> ' + join(root, outDir));
  } catch (err) {
    const cause = err instanceof Error ? err : new Error(String(err));
    throw new SsrRenderError('SSG pipeline', cause);
  }
}

export { buildSSG };
