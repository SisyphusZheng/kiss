/**
 * @openelement/ssg - Entry Renderer
 *
 * Pure function: routes + options -> Hono entry virtual module code.
 *
 * openElement Architecture (v0.5.0):
 * - API routes use Hono standard app.route() (not app.all + fetch transform)
 * - Island upgrade is handled by the client entry (built by Vite in Phase 2).
 *   No inline script in SSG HTML; the client entry is a Vite-built module
 *   referenced via <script type="module" src="..."> and imports island modules
 *   for side-effect custom element registration.
 * - HTML document wrapping delegates to wrapInDocument from html-escape.ts
 *   (imported at runtime - single source of truth, no duplicate HTML logic)
 * - DSD output must remain plain HTML, without Lit SSR marker comments.
 *
 * H-16 KNOWN ISSUE: Circular dependency between adapter-vite <-> content
 *   adapter-vite generates code that imports @openelement/content/sitemap
 *   content package imports @openelement/adapter-vite/build-context
 * Shared contracts now live in @openelement/core, @openelement/ssg, @openelement/router,
 * and @openelement/signal. Generated optional package imports are still emitted explicitly
 * so consumer import maps can be checked.
 *
 * Thin orchestrator: delegates code generation to focused sub-modules:
 *   - entry-render-helpers.ts  — individual code fragment generators
 *   - entry-render-runtime.ts  — runtime helper function code generation
 *   - entry-render-ssg.ts      — SSG re-export & routeInfo/renderRoute/getStaticPaths
 *
 * v0.41.0-alpha.1: The intermediate EntryDescriptor data model was collapsed
 * into this file. `generateHonoEntryCode()` builds descriptor-shaped data and
 * passes it directly to `renderEntry()` without a separate public descriptor
 * builder or file.
 */

import type {
  ApiRouteDecl,
  AppShellPlan,
  CorsOriginConfig,
  DocumentConfig,
  EntryDescriptor,
  ImportDecl,
  IslandDecl,
  MiddlewareDecl,
  PageRouteDecl,
  RendererDecl,
  ResolvedAppShell,
  SsrAdmissionPlan,
} from '@openelement/protocol/ssg';
import type {
  AppShellConfig,
  CompatibilityClassification,
  FrameworkOptions,
  HydrationStrategy,
  RouteEntry,
} from '@openelement/protocol/framework';
import type { OpenElementPackageManifest } from '@openelement/protocol/manifest';
import type { SsrAdmissionDecision } from '@openelement/protocol/render';
import { fileToTagName } from './route-scanner.ts';
import {
  renderActionRoute,
  renderApiRoute,
  renderDataEndpoint,
  renderDataRouteMap,
  renderImport,
  renderMiddleware,
  renderPageRoute,
  routeTagNameExpr,
} from './entry-render-helpers.ts';
import { renderRuntimeHelpers } from './entry-render-runtime.ts';
import { renderSsgSection } from './entry-render-ssg.ts';

// Re-export the canonical descriptor type for consumers that need it.
export type { EntryDescriptor } from '@openelement/protocol/ssg';

/**
 * Render an EntryDescriptor into a complete virtual module string.
 *
 * Pure function - deterministic, testable, side-effect-free.
 */
export function renderEntry(desc: EntryDescriptor): string {
  const lines: string[] = [];
  const ssrAdmissionPlan = desc.ssrAdmissionPlan;

  // --- Imports ---
  for (const imp of desc.imports) {
    lines.push(renderImport(imp));
  }

  // --- Island lookup (build-time known list) ---
  const islandLookup: Record<string, string> = {};
  for (const island of desc.islands) {
    islandLookup[island.tagName] = island.modulePath;
  }
  const appShellImports = new Set<string>();
  const collectShellImport = (shell: typeof desc.appShell.default) => {
    if (shell) appShellImports.add(shell.importPath);
  };
  collectShellImport(desc.appShell.default);
  for (const shell of Object.values(desc.appShell.layouts)) collectShellImport(shell);

  lines.push(
    `// Known islands (determined at build time by scanning islandsDir)`,
  );
  lines.push(`const __islandMap = ${JSON.stringify(islandLookup)}`);
  lines.push('');

  // --- Document wrapper ---
  lines.push(`import { wrapInDocument } from '@openelement/core';`);
  lines.push(`import { jsx } from '@openelement/core/jsx-runtime';`);
  lines.push(`import { createLogger } from '@openelement/core/logger';`);
  lines.push(`import { createRuntimeAdapter } from '@openelement/core/runtime';`);
  lines.push(
    `import { headerNav as __headerNav, navSections as __navSections } from '@openelement/generated/nav';`,
  );
  lines.push(
    `import { getDefaultLocale as __getDefaultLocale, locales as __locales } from '@openelement/generated/i18n';`,
  );
  for (const importPath of appShellImports) {
    lines.push(`import '${importPath}';`);
  }
  lines.push(`const log = createLogger('core');`);
  lines.push('');

  // --- Route module imports ---
  for (const route of [...desc.apiRoutes, ...desc.pageRoutes]) {
    lines.push(`import * as ${route.varName} from '${route.importPath}'`);
  }
  for (const renderer of desc.renderers) {
    lines.push(`import * as ${renderer.varName} from '${renderer.importPath}'`);
  }
  for (const mwScope of desc.middlewareScopes) {
    lines.push(`import * as ${mwScope.varName} from '${mwScope.importPath}'`);
  }
  lines.push('');

  // --- Register page components in SSR customElements registry ---
  {
    lines.push('// ADR 0014: Idempotent customElements.define for SSR (dev + SSG)');
    lines.push(
      '// Island modules call customElements.define() as a side-effect.',
    );
    lines.push(
      '// The SSR dom-shim does not make define() idempotent, so we patch it.',
    );
    lines.push(
      'const _origDefine = customElements.define.bind(customElements);',
    );
    lines.push('customElements.define = (name, ctor, options) => {');
    lines.push('  if (customElements.get(name)) return;');
    lines.push(
      '  try { _origDefine(name, ctor, options); } catch { /* already defined */ }',
    );
    lines.push('};');
    lines.push('');
  }
  for (const route of desc.pageRoutes) {
    const tagNameExpr = routeTagNameExpr(route.varName, route.tagName);
    lines.push(
      `if (!customElements.get(${tagNameExpr})) {`,
    );
    lines.push(
      `  customElements.define(${tagNameExpr}, ${route.varName}.default)`,
    );
    lines.push(`}`);
  }
  lines.push('');

  // --- Register island components in SSR customElements registry ---
  const ssrRenderableTags = new Set(ssrAdmissionPlan.renderableTags);
  const ssrIslands = desc.islands.filter((island) => ssrRenderableTags.has(island.tagName));
  for (const island of ssrIslands) {
    const varName = `__island_${island.tagName.replace(/-/g, '_')}`;
    lines.push(`import * as ${varName} from '${island.modulePath}'`);
  }
  for (const island of ssrIslands) {
    const varName = `__island_${island.tagName.replace(/-/g, '_')}`;
    const componentVar = `__island_component_${island.tagName.replace(/-/g, '_')}`;
    lines.push(`const ${componentVar} = ${varName}?.default`);
    lines.push(
      `if (${componentVar} && !customElements.get('${island.tagName}')) {`,
    );
    lines.push(`  customElements.define('${island.tagName}', ${componentVar})`);
    lines.push(`}`);
  }
  lines.push('');

  lines.push('// v0.17.4: SSR admission plan');
  lines.push(
    `(globalThis).__CLIENT_ONLY_TAGS__ = new Set(${
      JSON.stringify(ssrAdmissionPlan.clientOnlyTags)
    })`,
  );
  lines.push(
    `export const ssrAdmissionPlan = ${JSON.stringify(ssrAdmissionPlan, null, 2)};`,
  );
  lines.push('');

  // --- SSG: headExtras via define injection ---
  if (desc.isSSG && desc.document.headExtras) {
    lines.push(
      '// SSG: headExtras injected via Vite define (ADR 0008 Phase A)',
    );
    lines.push('// Replaces the old .openElement/head-extras.html runtime file read');
    lines.push('const __headExtras = __HEAD_EXTRAS__ || "";');
    lines.push('');
  }

  // --- Runtime helpers ---
  lines.push(renderRuntimeHelpers(desc.appShell));
  lines.push('');

  // --- App creation + Middleware ---
  lines.push('const app = new Hono()');
  lines.push('');

  for (const mw of desc.middleware) {
    renderMiddleware(lines, mw);
  }

  // --- Middleware scopes (v0.3.0: _middleware.ts files) ---
  for (const mwScope of desc.middlewareScopes) {
    lines.push(`// Middleware scope: ${mwScope.scope} (${mwScope.importPath})`);
    lines.push(
      `app.use('${mwScope.scope === '/' ? '' : mwScope.scope}/*', ${mwScope.varName}.default)`,
    );
    lines.push('');
  }

  // --- API routes ---
  for (const route of desc.apiRoutes) {
    renderApiRoute(lines, route);
  }

  // --- Page routes ---
  const docConfig = {
    title: desc.document.title,
    lang: desc.document.lang,
    headExtras: desc.document.headExtras,
    allowHeadExtrasScripts: desc.document.allowHeadExtrasScripts,
  };
  for (const route of desc.pageRoutes) {
    renderPageRoute(lines, route, desc.renderers, docConfig, desc.isSSG);
  }

  // --- Action POST handlers ---
  for (const route of desc.pageRoutes) {
    renderActionRoute(lines, route, desc.renderers, docConfig, desc.isSSG);
  }

  // --- /_data endpoint for SPA navigation ---
  renderDataRouteMap(lines, desc.pageRoutes);
  renderDataEndpoint(lines);

  // --- Export ---
  lines.push('export const openElementHandler = (request, context = {}) => {');
  lines.push('  return app.fetch(request, context.env || {}, context.platform)');
  lines.push('}');
  lines.push('');
  lines.push('export const openElementRuntimeAdapter = {');
  lines.push("  ...createRuntimeAdapter({ name: 'openelement-hono', fetch: openElementHandler }),");
  lines.push('}');
  lines.push('');
  lines.push('export default app');

  // --- SSG section ---
  const ssgSection = renderSsgSection(desc);
  if (ssgSection) {
    lines.push(ssgSection);
  }

  return lines.join('\n');
}

function normalizeAppShellImport(importPath: string): string {
  if (importPath.startsWith('./')) return `/${importPath.slice(2)}`;
  if (importPath.startsWith('../')) return importPath;
  return importPath;
}

function normalizeAppShell(config: AppShellConfig | undefined): ResolvedAppShell {
  if (config === false) return false;
  if (config === undefined || config === 'default') {
    return {
      tagName: 'open-layout',
      importPath: '@openelement/ui/open-layout',
      props: {},
    };
  }
  return {
    tagName: config.tagName,
    importPath: normalizeAppShellImport(config.import),
    props: config.props ?? {},
  };
}

function buildAppShellPlan(options: {
  appShell?: FrameworkOptions['appShell'];
  layouts?: FrameworkOptions['layouts'];
}): AppShellPlan {
  const defaultShell = normalizeAppShell(options.layouts?.default ?? options.appShell);
  const layouts: Record<string, ResolvedAppShell> = {};
  for (const [name, config] of Object.entries(options.layouts ?? {})) {
    if (name === 'default' || config === undefined) continue;
    layouts[name] = normalizeAppShell(config);
  }
  return { default: defaultShell, layouts };
}

export function buildEntryDescriptor(
  routes: RouteEntry[],
  options: {
    routesDir?: string;
    islandsDir?: string;
    middleware?: FrameworkOptions['middleware'];
    ssg?: boolean;
    islandTagNames?: string[];
    /** Relative file paths for local islands (preserves subdirectory structure) */
    islandFiles?: string[];
    /** Local island metadata indexed by tag name. */
    islandMeta?: Record<string, Partial<IslandDecl>>;
    /** Package manifests discovered from npm/JSR packages */
    packageManifests?: OpenElementPackageManifest[];
    /** CEM-derived compatibility classifications (from compatibility classifier) */
    cemClassifications?: CompatibilityClassification[];
    /** @security Injected as raw HTML without sanitization */
    headExtras?: string;
    allowHeadExtrasScripts?: boolean;
    html?: { lang?: string; title?: string };
    upgradeStrategy?: HydrationStrategy;
    /** Additional client-only tag names from external registries (ADR-0035 A1) */
    clientOnlyTags?: string[];
    appShell?: FrameworkOptions['appShell'];
    layouts?: FrameworkOptions['layouts'];
  } = {},
): EntryDescriptor {
  const routesDir = options.routesDir || 'app/routes';
  const islandsDir = options.islandsDir || 'app/islands';
  const isSSG = options.ssg === true;

  // --- Imports ---
  const imports: ImportDecl[] = [];

  // Always needed
  imports.push({ from: 'hono', names: ['Hono'] });
  imports.push({
    from: '@openelement/core',
    names: ['renderDsd', 'renderDsdTree', 'escapeHtml'],
  });

  // Conditional middleware imports
  const mw = options.middleware;
  if (mw?.requestId !== false) {
    imports.push({ from: 'hono/request-id', names: ['requestId'] });
  }
  if (mw?.logger !== false) {
    imports.push({ from: 'hono/logger', names: ['logger'], alias: 'honoLogger' });
  }
  if (mw?.cors !== false) {
    imports.push({ from: 'hono/cors', names: ['cors'] });
  }
  if (mw?.securityHeaders !== false) {
    imports.push({ from: 'hono/secure-headers', names: ['secureHeaders'] });
  }

  // --- Middleware ---
  const middleware: MiddlewareDecl[] = [];

  if (mw?.requestId !== false) {
    middleware.push({
      kind: 'requestId',
      comment: '1. Request ID - base for logging and error tracking',
    });
  }
  if (mw?.logger !== false) {
    middleware.push({
      kind: 'logger',
      comment: '2. Logger - structured request logging',
    });
  }
  if (mw?.cors !== false) {
    let corsOrigin: CorsOriginConfig | undefined;
    if (mw?.corsOrigin !== undefined) {
      if (typeof mw.corsOrigin === 'string') {
        corsOrigin = mw.corsOrigin;
      } else if (Array.isArray(mw.corsOrigin)) {
        corsOrigin = mw.corsOrigin;
      } else {
        corsOrigin = { type: 'function', body: mw.corsOrigin.toString() };
      }
    }
    middleware.push({
      kind: 'cors',
      comment: '3. CORS - Web Standards (no process.env)',
      config: { corsOrigin },
    });
  }
  if (mw?.securityHeaders !== false) {
    middleware.push({
      kind: 'securityHeaders',
      comment: '4. Security headers',
    });
  }
  if (mw?.csp) {
    middleware.push({
      kind: 'csp',
      comment: '5. Content Security Policy',
      config: { csp: mw.csp },
    });
  }

  // --- Routes ---
  const apiRoutes: ApiRouteDecl[] = routes
    .filter((r) => r.type === 'api' && !r.special)
    .map((r) => ({
      kind: 'api' as const,
      path: r.path,
      varName: `$${r.varName}`,
      filePath: r.filePath,
      importPath: `/${routesDir}/${r.filePath}`,
    }));

  const pageRoutes: PageRouteDecl[] = routes
    .filter((r) => r.type === 'page' && !r.special)
    .map((r) => {
      const isDynamic = r.path.includes(':');
      const paramNames = isDynamic ? [...r.path.matchAll(/:([^/]+)/g)].map((m) => m[1]) : [];
      return {
        kind: 'page' as const,
        path: r.path,
        varName: `$${r.varName}`,
        filePath: r.filePath,
        defaultTagName: fileToTagName(r.filePath),
        tagName: r.tagName || fileToTagName(r.filePath),
        importPath: `/${routesDir}/${r.filePath}`,
        isDynamic,
        paramNames,
      };
    });

  // --- Special files: _renderer.ts / _middleware.ts (v0.3.0) ---
  const specialRoutes = routes.filter((r) => r.type === 'special');

  const renderers: RendererDecl[] = specialRoutes
    .filter((r) => r.special === 'renderer')
    .map((r) => {
      const scope = r.path.replace(/\/?_renderer$/, '') || '/';
      const depth = scope === '/' ? 0 : scope.split('/').filter(Boolean).length;
      return {
        varName: `$${r.varName}`,
        scope,
        importPath: `/${routesDir}/${r.filePath}`,
        depth,
      };
    })
    .sort((a, b) => b.depth - a.depth);

  const middlewareScopes = specialRoutes
    .filter((r) => r.special === 'middleware')
    .map((r) => ({
      varName: `$${r.varName}`,
      scope: r.path.replace(/\/?_middleware$/, '') || '/',
      importPath: `/${routesDir}/${r.filePath}`,
    }));

  // --- Islands ---
  const islandTagNames = options.islandTagNames || [];
  const islandFiles = options.islandFiles || [];
  const islandMeta = options.islandMeta || {};
  const packageManifests = options.packageManifests || [];

  const localIslands: IslandDecl[] = islandTagNames.map((tagName, i) => ({
    tagName,
    modulePath: islandFiles[i]
      ? `/${islandsDir}/${islandFiles[i]}`
      : `/${islandsDir}/${tagName}.ts`,
    source: 'local',
    ssr: islandMeta[tagName]?.hydrate === 'only' ? false : islandMeta[tagName]?.ssr,
    dsd: islandMeta[tagName]?.hydrate === 'only' ? false : islandMeta[tagName]?.dsd,
    hydrate: islandMeta[tagName]?.hydrate || options.upgradeStrategy || 'idle',
    reason: islandMeta[tagName]?.reason,
  }));

  const packageIslandDecls: IslandDecl[] = packageManifests.flatMap((pkg) =>
    pkg.declarations
      .filter((d) => d.openElement?.module)
      .map((d) => {
        const modulePath = d.openElement?.module;
        if (!modulePath) {
          throw new Error(
            `Package manifest declaration "${d.tagName}" is missing openElement.module`,
          );
        }
        return {
          tagName: d.tagName,
          modulePath,
          isPackage: true,
          source: 'package',
          hydrate:
            (d.openElement?.hydrate || options.upgradeStrategy || 'idle') as IslandDecl['hydrate'],
          ssr: d.openElement?.hydrate === 'only' ? false : d.openElement?.ssr,
          dsd: d.openElement?.hydrate === 'only' ? false : d.openElement?.dsd,
        };
      })
  );

  const islands: IslandDecl[] = [...localIslands, ...packageIslandDecls];
  const cemClassifications = options.cemClassifications || [];
  const ssrAdmissionPlan = buildSsrAdmissionPlan(
    islands,
    cemClassifications,
    options.clientOnlyTags || [],
  );

  // --- Document ---
  const document: DocumentConfig = {
    lang: options.html?.lang || 'en',
    title: options.html?.title || 'openElement',
    headExtras: options.headExtras || '',
    allowHeadExtrasScripts: options.allowHeadExtrasScripts || false,
  };
  const appShell = buildAppShellPlan({
    appShell: options.appShell,
    layouts: options.layouts,
  });

  // --- Debug routes (dev only) ---
  const debugRoutes = isSSG ? undefined : routes
    .filter((r) => !r.special)
    .map((r) => ({ path: r.path, type: r.type }));

  return {
    isSSG,
    imports,
    middleware,
    apiRoutes,
    pageRoutes,
    islands,
    ssrAdmissionPlan,
    cemClassifications,
    clientOnlyTags: options.clientOnlyTags,
    renderers,
    middlewareScopes,
    document,
    appShell,
    upgradeStrategy: options.upgradeStrategy || 'idle',
    debugRoutes,
  };
}

export function buildSsrAdmissionPlan(
  islands: IslandDecl[],
  cemClassifications: CompatibilityClassification[] = [],
  clientOnlyTags: string[] = [],
): SsrAdmissionPlan {
  const renderableTags: string[] = [];
  const mergedClientOnlyTags: string[] = [];
  const rejectedTags: string[] = [];
  const reasons: Record<string, string> = {};
  const decisions: SsrAdmissionDecision[] = [];
  const seen = new Set<string>();
  const admittedTags = new Set<string>();

  const cemMap = new Map<string, CompatibilityClassification>();
  for (const classification of cemClassifications) {
    cemMap.set(classification.tagName, classification);
  }

  for (const island of islands) {
    const source = island.source || (island.isPackage ? 'package' : 'local');

    if (seen.has(island.tagName)) {
      const reason = 'duplicate custom element tag';
      rejectedTags.push(island.tagName);
      reasons[island.tagName] = reason;

      if (admittedTags.has(island.tagName)) {
        const rIdx = renderableTags.indexOf(island.tagName);
        if (rIdx !== -1) renderableTags.splice(rIdx, 1);
        const cIdx = mergedClientOnlyTags.indexOf(island.tagName);
        if (cIdx !== -1) mergedClientOnlyTags.splice(cIdx, 1);
        admittedTags.delete(island.tagName);
      }

      decisions.push({
        tagName: island.tagName,
        modulePath: island.modulePath,
        source,
        renderPath: 'rejected',
        reason,
      });
      continue;
    }
    seen.add(island.tagName);

    let renderPath: SsrAdmissionDecision['renderPath'];
    let reason: string;

    const cemClassification = cemMap.get(island.tagName);

    if (cemClassification) {
      const TIER_RENDER_PATH: Record<string, string> = {
        'ssr-capable': 'ssr+client',
        'client-only': 'client-only',
        'experimental-dom': 'client-only',
        rejected: 'rejected',
      };

      const knownTier = cemClassification.tier in TIER_RENDER_PATH;
      renderPath = (TIER_RENDER_PATH[cemClassification.tier] ?? 'client-only') as typeof renderPath;
      reason = knownTier
        ? `CEM ${cemClassification.tier}: ${cemClassification.reason}`
        : `Unknown CEM tier (${cemClassification.tier}) - conservative default to client-only`;
    } else if (island.hydrate === 'only') {
      renderPath = 'client-only';
      reason = island.reason || 'client:only island is excluded from SSR';
    } else if (island.ssr === false) {
      renderPath = 'client-only';
      reason = island.reason || 'openElement.ssr is false';
    } else if (source === 'package') {
      if (island.ssr === true) {
        renderPath = 'ssr+client';
        reason = 'package island with openElement.ssr=true';
      } else {
        renderPath = 'client-only';
        reason = 'package island has no validated SSR capability (conservative default)';
      }
    } else {
      renderPath = 'ssr+client';
      reason = island.ssr === true ? 'openElement.ssr is true' : 'local island default SSR path';
    }

    if (renderPath === 'ssr+client') {
      renderableTags.push(island.tagName);
      admittedTags.add(island.tagName);
    }
    if (renderPath === 'client-only') {
      mergedClientOnlyTags.push(island.tagName);
      admittedTags.add(island.tagName);
    }
    if (renderPath === 'rejected') {
      rejectedTags.push(island.tagName);
      admittedTags.delete(island.tagName);
    }

    reasons[island.tagName] = reason;
    decisions.push({
      tagName: island.tagName,
      modulePath: island.modulePath,
      source,
      renderPath,
      reason,
    });
  }

  for (const tag of clientOnlyTags) {
    if (!seen.has(tag) && !admittedTags.has(tag)) {
      mergedClientOnlyTags.push(tag);
      admittedTags.add(tag);
      seen.add(tag);
      reasons[tag] = 'Registry client-only component (ADR-0035)';
      decisions.push({
        tagName: tag,
        modulePath: '',
        source: 'nested',
        renderPath: 'client-only',
        reason: 'Registry client-only component (ADR-0035)',
      });
    }
  }

  return {
    renderableTags,
    clientOnlyTags: mergedClientOnlyTags,
    rejectedTags,
    reasons,
    decisions,
    cemClassifications,
  };
}

/** Options for the Hono entry code generator */
export interface HonoEntryOptions {
  routesDir?: string;
  islandsDir?: string;
  componentsDir?: string;
  middleware?: FrameworkOptions['middleware'];
  ssg?: boolean;
  islandTagNames?: string[];
  /** Relative file paths for local islands (preserves subdirectory structure) */
  islandFiles?: string[];
  islandMeta?: Record<string, Partial<IslandDecl>>;
  packageManifests?: OpenElementPackageManifest[];
  /** @security Injected as raw HTML without sanitization */
  headExtras?: string;
  allowHeadExtrasScripts?: boolean;
  html?: { lang?: string; title?: string };
  upgradeStrategy?: HydrationStrategy;
  /** Additional client-only tag names from external registries (ADR-0035 A1) */
  clientOnlyTags?: string[];
  appShell?: FrameworkOptions['appShell'];
  layouts?: FrameworkOptions['layouts'];
}

/**
 * Generate the Hono entry module code from scanned routes.
 *
 * Internally builds a descriptor-shaped object and renders it directly.
 */
export function generateHonoEntryCode(
  routes: RouteEntry[],
  options: HonoEntryOptions = {},
): string {
  const descriptor = buildEntryDescriptor(routes, options);
  return renderEntry(descriptor);
}
