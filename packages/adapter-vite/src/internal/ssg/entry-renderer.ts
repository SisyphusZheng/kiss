/**
 * @openelement/element - Entry Renderer
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
 *   adapter-vite generates code that imports its public sitemap utility
 *   content package imports @openelement/adapter-vite/build-context
 * Shared contracts now live in @openelement/element and adapter internals.
 * so consumer import maps can be checked.
 *
 * Thin orchestrator: delegates code generation to focused sub-modules:
 *   - entry-render-helpers.ts  — individual code fragment generators
 *   - entry-render-runtime.ts  — runtime helper function code generation
 *   - entry-render-ssg.ts      — SSG re-export & routeInfo/renderRoute/getStaticPaths
 *
 * v0.41.0-alpha.1: The intermediate EntryDescriptor data model was collapsed
 * into this file. Consumers build a descriptor via `buildEntryDescriptor()`
 * and pass it directly to `renderEntry()`.
 */

import type { EntryDescriptor, IslandDecl } from '../protocol/ssg.ts';
import type { FrameworkOptions, HydrationStrategy } from '../protocol/framework.ts';
import type { OpenElementPackageManifest } from '../protocol/manifest.ts';
import { validateIslandModuleSpecifier } from './entry-generators.ts';
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
import { quoteGeneratedJavaScriptValue } from './codegen-literals.ts';

// Re-export the canonical descriptor type for consumers that need it.
export type { EntryDescriptor } from '../protocol/ssg.ts';
export { buildEntryDescriptor, buildSsrAdmissionPlan } from './entry-descriptor.ts';

/**
 * Render an EntryDescriptor into a complete virtual module string.
 *
 * Pure function - deterministic, testable, side-effect-free.
 */
export function renderEntry(desc: EntryDescriptor): string {
  const lines: string[] = [];
  const ssrAdmissionPlan = desc.ssrAdmissionPlan;
  for (const island of desc.islands) validateIslandModuleSpecifier(island.modulePath);

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
  lines.push(`const __islandMap = ${quoteGeneratedJavaScriptValue(islandLookup, 2)}`);
  lines.push('');

  // --- Document wrapper ---
  lines.push(`import { wrapInDocument } from '@openelement/element';`);
  lines.push(`import { jsx } from '@openelement/element';`);
  lines.push(`import { createLogger } from '@openelement/element';`);
  lines.push(`import { createRuntimeAdapter } from '@openelement/element/build-utils';`);
  lines.push(
    `import { isOpenElementRedirect as __isOpenElementRedirect, isOpenElementNotFound as __isOpenElementNotFound } from '@openelement/app';`,
  );
  lines.push(
    `import { headerNav as __headerNav, navSections as __navSections } from '@openelement/generated/nav';`,
  );
  lines.push(
    `import { getDefaultLocale as __getDefaultLocale, locales as __locales } from '@openelement/generated/i18n';`,
  );
  for (const importPath of appShellImports) {
    lines.push(`import ${quoteGeneratedJavaScriptValue(importPath)};`);
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
    lines.push('  try { _origDefine(name, ctor, options); } catch (e) {');
    lines.push('    if (e && e.name === "NotSupportedError") return;');
    lines.push('    throw e;');
    lines.push('  }');
    lines.push('};');
    lines.push('');
  }
  for (const route of desc.pageRoutes) {
    const tagNameExpr = routeTagNameExpr(route.varName, route.tagName);
    lines.push(
      `if (!customElements.get(${tagNameExpr})) {`,
    );
    lines.push(
      `  try { customElements.define(${tagNameExpr}, ${route.varName}.default); } catch (err) { console.error('[ssg] Failed to register route custom element ${tagNameExpr}:', err); throw err; }`,
    );
    lines.push(`}`);
  }
  lines.push('');

  // --- Register island components in SSR customElements registry ---
  const ssrRenderableTags = new Set(ssrAdmissionPlan.renderableTags);
  const ssrIslands = desc.islands.filter((island) => ssrRenderableTags.has(island.tagName));
  for (const island of ssrIslands) {
    const varName = `__island_${island.tagName.replace(/-/g, '_')}`;
    lines.push(`import * as ${varName} from ${quoteGeneratedJavaScriptValue(island.modulePath)}`);
  }
  for (const island of ssrIslands) {
    const varName = `__island_${island.tagName.replace(/-/g, '_')}`;
    const componentVar = `__island_component_${island.tagName.replace(/-/g, '_')}`;
    lines.push(`const ${componentVar} = ${varName}?.default`);
    lines.push(
      `if (${componentVar} && !customElements.get(${
        quoteGeneratedJavaScriptValue(island.tagName)
      })) {`,
    );
    lines.push(
      `  try { customElements.define(${
        quoteGeneratedJavaScriptValue(island.tagName)
      }, ${componentVar}); } catch (err) { console.error('[ssg] Failed to register island custom element <${island.tagName}>:', err); throw err; }`,
    );
    lines.push(`}`);
  }
  lines.push('');

  lines.push('// v0.17.4: SSR admission plan');
  lines.push(
    `export const ssrAdmissionPlan = ${quoteGeneratedJavaScriptValue(ssrAdmissionPlan, 2)};`,
  );
  lines.push('');

  // --- SSG: headExtras via define injection ---
  // Always emitted in SSG mode: renderRouteHandler references __headExtras
  // unconditionally, so a project without headExtras would otherwise render
  // every static page into a 500 (latent until the request-time fixture hit
  // it in 0.42.0-alpha.1).
  if (desc.isSSG) {
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
      `app.use(${
        JSON.stringify(mwScope.scope === '/' ? '/*' : `${mwScope.scope}/*`)
      }, ${mwScope.varName}.default)`,
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
  appShell?: FrameworkOptions['appShell'];
  layouts?: FrameworkOptions['layouts'];
}
