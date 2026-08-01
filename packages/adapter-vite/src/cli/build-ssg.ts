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
import { normalizePath } from 'vite';
import process from 'node:process';
import type {
  CompatibilityClassification,
  FrameworkOptions,
  HydrationStrategy,
  RouteEntry,
} from '../internal/protocol/framework.ts';
import type { OpenElementPackageManifest } from '../internal/protocol/manifest.ts';
import type { EntryDescriptor, IslandDecl } from '../internal/protocol/ssg.ts';
import type { OpenElementBuildContext } from '../build-context.ts';
import { buildEntryDescriptor, ssgRender } from '../internal/ssg/index.ts';
import { SsrRenderError } from '@openelement/element/build-utils';
import { createLogger } from '@openelement/element';
import { createSsgRenderEvidence } from './ssg-render.ts';
import {
  createGeneratedDataResolverPlugin,
  GENERATED_BLOG_DATA_ID,
  GENERATED_I18N_ID,
  GENERATED_NAV_ID,
} from '../generated-data-resolver.ts';
import { createNpmSpecifierPlugin } from '../npm-specifier-plugin.ts';
import { mdxPlugin } from '../plugin-mdx.ts';
import { quoteGeneratedJavaScriptValue } from '../internal/ssg/codegen-literals.ts';
import {
  generateCustomElementsPolyfill,
  generateSsrPolyfillBanner,
} from '../internal/ssg/index.ts';
import { optionalPackageStubsPlugin } from '../plugin.ts';
import { normalizeViteAliases } from '../alias-utils.ts';
import { DEFAULT_OUT_DIR } from '../internal/paths.ts';

/** Chunk size warning limit (kB) for the SSR bundle build. */
const SSR_CHUNK_SIZE_WARNING_LIMIT_KB = 1500;

/** Rollup/Vite output paths mapping for known externals. */
const log = createLogger('ssg');

const VIRTUAL_SSG_ENTRY_ID = 'virtual:open-ssg-entry';
const RESOLVED_SSG_ENTRY_ID = '\0' + VIRTUAL_SSG_ENTRY_ID;
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
  islandMeta?: Record<string, Partial<import('../internal/protocol/ssg.ts').IslandDecl>>;
  packageManifests?: OpenElementPackageManifest[];
  /** CEM-derived compatibility classifications from Phase 1 auto-detection. */
  cemClassifications?: CompatibilityClassification[];
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
  speculation?: boolean | import('../internal/protocol/ssg.ts').SpeculationRulesOptions;
  /**
   * Policy for dynamic-route render failures during SSG.
   * See SsgRenderOptions.dynamicRouteFailure. Defaults to 'fail'.
   */
  dynamicRouteFailure?: 'fail' | 'warn';
  /**
   * Policy for sitemap generation failures during SSG.
   * See SsgRenderOptions.sitemapFailure. Defaults to 'fail'.
   */
  sitemapFailure?: 'fail' | 'warn';
}

/** Resolved inputs for the SSG entry descriptor (Phase 1 discoveries + Phase 3 options). */
export interface SsgEntryDescriptorInputs {
  routes: RouteEntry[];
  routesDir: string;
  islandsDir: string;
  middleware?: FrameworkOptions['middleware'];
  islandTagNames: string[];
  islandFiles: string[];
  islandMeta: Record<string, Partial<IslandDecl>>;
  packageManifests: OpenElementPackageManifest[];
  cemClassifications: CompatibilityClassification[];
  /** @security Injected as raw HTML without sanitization */
  headExtras?: string;
  allowHeadExtrasScripts?: boolean;
  html?: { lang?: string; title?: string };
  upgradeStrategy: HydrationStrategy;
  appShell?: FrameworkOptions['appShell'];
  layouts?: FrameworkOptions['layouts'];
}

/**
 * Build the SSG entry descriptor and sync its SSR admission plan into ctx.
 *
 * Single descriptor instantiation (alpha.17 B1): the admission plan and the
 * emitted SSG entry code come from the same descriptor, and
 * ctx.phase1.ssrAdmissionPlan is synced from it so the render evidence
 * (createSsgRenderEvidence) reads the same plan the SSG entry was generated
 * from.
 *
 * alpha.18 (R2-H2): inputs.cemClassifications must carry the Phase 1 CEM
 * classifications. Without them the SSG admission plan falls back to the
 * conservative package default (client-only) for CEM 'ssr-capable' islands,
 * diverging from the dev/SSR entry and corrupting the synced plan + evidence.
 */
export function buildSsgEntryDescriptor(
  inputs: SsgEntryDescriptorInputs,
  ctx: OpenElementBuildContext,
): EntryDescriptor {
  const descriptor = buildEntryDescriptor(inputs.routes, {
    routesDir: inputs.routesDir,
    islandsDir: inputs.islandsDir,
    middleware: inputs.middleware,
    ssg: true,
    islandTagNames: inputs.islandTagNames,
    islandFiles: inputs.islandFiles,
    islandMeta: inputs.islandMeta,
    packageManifests: inputs.packageManifests,
    cemClassifications: inputs.cemClassifications,
    headExtras: inputs.headExtras,
    allowHeadExtrasScripts: inputs.allowHeadExtrasScripts,
    html: inputs.html,
    upgradeStrategy: inputs.upgradeStrategy,
    appShell: inputs.appShell,
    layouts: inputs.layouts,
  });
  ctx.phase1.ssrAdmissionPlan = descriptor.ssrAdmissionPlan;
  return descriptor;
}

/**
 * Generated data ids that must exist on disk during the build (#671).
 *
 * Detection uses ctx.plugins registrations: the blog/i18n plugins always
 * register a non-null options object, and the nav plugin registers its
 * sections/links, when their buildStart() ran. Ids whose plugins never ran
 * (apps without that content feature) are not required, so their builds keep
 * the dev fallback stubs.
 */
function requiredGeneratedDataIds(ctx: OpenElementBuildContext): string[] {
  const required: string[] = [];
  if (ctx.plugins.blogOptions) required.push(GENERATED_BLOG_DATA_ID);
  if (ctx.plugins.i18nOptions) required.push(GENERATED_I18N_ID);
  if (ctx.plugins.navSections.length > 0 || ctx.plugins.headerNav.length > 0) {
    required.push(GENERATED_NAV_ID);
  }
  return required;
}

async function buildSSG(
  options: BuildSSGOptions = {},
  ctx: OpenElementBuildContext,
): Promise<void> {
  const root = options.root || ctx.phase3.root || process.cwd();
  const outDir = options.outDir || ctx.phase3.outDir || DEFAULT_OUT_DIR;
  const routesDir = options.routesDir || ctx.phase3.routesDir || 'app/routes';
  const islandsDir = options.islandsDir || ctx.phase3.islandsDir || 'app/islands';
  const appShell = options.appShell ?? ctx.phase3.appShell;
  const layouts = options.layouts ?? ctx.phase3.layouts;

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
    '../internal/ssg/index.ts'
  );
  const { renderEntry } = await import('../internal/ssg/index.ts');

  const routes = options.routes ?? await scanRoutes(routesDir);

  const islandsRoot = join(root, islandsDir);
  const ssgIslandFiles = options.islandFiles ?? await scanIslands(islandsRoot);
  const ssgIslandTagNames = islandTagNames.length > 0
    ? islandTagNames
    : ssgIslandFiles.map((f) => fileToTagName(f));
  const ssgIslandMeta = Object.keys(islandMeta).length > 0
    ? islandMeta
    : await scanIslandMeta(islandsRoot, ssgIslandFiles);
  // Single descriptor instantiation (alpha.17 B1): the SSR admission plan and
  // the emitted SSG entry code come from the same descriptor. Previously the
  // plan was built without middleware/html/upgradeStrategy and diverged from
  // the descriptor used for rendering.
  // alpha.18 (R2-H2): cemClassifications come from Phase 1 (plugin.ts
  // buildStart auto-detection) so the SSG plan matches the dev/SSR plan.
  const ssgDescriptor = buildSsgEntryDescriptor({
    routes,
    routesDir,
    islandsDir,
    middleware: options.middleware,
    islandTagNames: ssgIslandTagNames,
    islandFiles: ssgIslandFiles,
    islandMeta: ssgIslandMeta,
    packageManifests,
    cemClassifications: options.cemClassifications || ctx.phase1.cemClassifications || [],
    headExtras: options.headExtras,
    allowHeadExtrasScripts: options.allowHeadExtrasScripts,
    html: options.html,
    upgradeStrategy: options.upgradeStrategy || 'idle',
    appShell,
    layouts,
  }, ctx);

  const ssgEntryCode = generateSsrPolyfillBanner() + '\n' + renderEntry(ssgDescriptor);
  // Deno import map resolution handles bare specifiers (e.g. @openelement/ui/open-callout)
  // via the createDenoImportMapPlugin added to the Phase 3 viteBuild plugins below.

  try {
    const { build: viteBuild } = await import('vite');

    // Handle alias - prefer CLI options, then ctx from Phase 1
    const alias = metadataResolveAlias;
    const viteResolveAlias = normalizeViteAliases(alias, root);

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
            // ADR-0044: customElements polyfill must run before ESM imports.
            // Uses Map-backed define()/get(); renderDsdByName() looks up
            // components via customElements.get(tagName) during SSG rendering.
            // SOP-016: HTMLElement stub is self-contained in @openelement/element/dsd-element.ts.
            banner: generateCustomElementsPolyfill(),
          },
        },
      },
      // The generated SSR entry is a portable deployment artifact. Bundle all
      // runtime dependencies so Node, Deno, Workers and Nitro never inherit
      // the build machine's import map or `npm:` URL semantics.
      ssr: { noExternal: true },
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
        jsxImportSource: '@openelement/element',
        tsconfigRaw: {
          compilerOptions: {
            useDefineForClassFields: false,
          },
        },
      },
      plugins: [
        // MDX route support must mirror the outer plugin list (plugin.ts:396),
        // otherwise .mdx routes fail Phase 3 parse (esbuild treats them as JS).
        mdxPlugin(),
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
        // Generated optional application modules may not be installed.
        // This plugin resolves them to empty stubs when missing, so the
        // viteBuild() succeeds regardless of which packages are available.
        optionalPackageStubsPlugin(),
        // #671: Fail-closed generated data for build. The nav/blog/i18n
        // plugins write these modules during the build and register their data
        // in ctx.plugins; a registered id whose file is missing means the
        // write failed, and the build must not silently ship the empty dev
        // fallback stubs. Ids whose plugins never ran keep the fallback so
        // apps without those content plugins still build.
        createGeneratedDataResolverPlugin({
          root,
          name: 'open:ssg-generated-data',
          required: requiredGeneratedDataIds(ctx),
        }),
        createNpmSpecifierPlugin(),
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
              `export const tagName = ${quoteGeneratedJavaScriptValue(tagName)};`,
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
        preserveSymlinks: false,
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
        dynamicRouteFailure: options.dynamicRouteFailure,
        sitemapFailure: options.sitemapFailure,
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
