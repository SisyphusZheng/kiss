/**
 * @openelement/adapter-vite - Entry Orchestrator
 *
 * Top-level composition axis of the entry-* family (#901): renderEntry()
 * composes the codegen fragments (entry-codegen.ts), the runtime helper
 * emission (entry-render-runtime.ts) and the SSG section
 * (entry-render-ssg.ts) into the complete virtual Hono entry module.
 *
 * Pure function: routes + options -> Hono entry virtual module code.
 *
 * Architecture notes:
 * - API routes use Hono standard app.route() (not app.all + fetch transform)
 * - Island upgrade is handled by the client entry (built by Vite in Phase 2).
 *   No inline script in SSG HTML; the client entry is a Vite-built module
 *   referenced via <script type="module" src="..."> and imports island modules
 *   for side-effect custom element registration.
 * - HTML document wrapping delegates to wrapInDocument from html-escape.ts
 *   (imported at runtime - single source of truth, no duplicate HTML logic)
 * - DSD output must remain plain HTML, without Lit SSR marker comments.
 *
 * Thin orchestrator: delegates code generation to focused sub-modules:
 *   - entry-codegen.ts         — entry code string generation (#901)
 *   - entry-render-runtime.ts  — runtime helper function code generation
 *   - entry-render-ssg.ts      — SSG re-export & routeInfo/renderRoute/getStaticPaths
 *
 * v0.41.0-alpha.1: Consumers build a descriptor via `buildEntryDescriptor()`
 * (entry-descriptor.ts; the EntryDescriptor type lives in protocol/ssg.ts)
 * and pass it directly to `renderEntry()`.
 */

import type { EntryDescriptor } from '../protocol/ssg.ts';
import { validateIslandModuleSpecifier } from './entry-generators.ts';
import {
  renderActionRoute,
  renderApiRoute,
  renderDataEndpoint,
  renderDataRouteMap,
  renderImport,
  renderMiddleware,
  renderNotFoundRoute,
  renderPageRoute,
  routeTagNameExpr,
} from './entry-codegen.ts';
import { renderRuntimeHelpers } from './entry-render-runtime.ts';
import { renderSsgSection } from './entry-render-ssg.ts';
import { quoteGeneratedJavaScriptValue } from './codegen-literals.ts';

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

  // --- Dev island client script (#951) ---
  // Production injects the built client entry into HTML post-build
  // (postprocess.ts); in dev there is no build, so the entry injects the tag
  // itself and the open:dev-island-client plugin serves the module at the
  // same public URL. import.meta.env.DEV/BASE_URL are compile-time constants
  // in both the dev module runner and the build, so the built bundle keeps
  // this as dead code.
  {
    const hasClientEntry = desc.islands.length > 0 || desc.hasEnhancedForms === true;
    lines.push('// #951: dev-only island client script injection (prod injects post-build)');
    lines.push(
      `const __devClientScriptSrc = import.meta.env.DEV && ${
        JSON.stringify(hasClientEntry)
      } ? import.meta.env.BASE_URL + 'client/islands/client.js' : null;`,
    );
    lines.push('function __withDevClientScript(html) {');
    lines.push('  if (!__devClientScriptSrc) return html;');
    lines.push(
      `  const tag = '<script type="module" src="' + __devClientScriptSrc + '"></script>';`,
    );
    lines.push(
      `  return html.includes('</body>') ? html.replace('</body>', '  ' + tag + '\\n</body>') : html + tag;`,
    );
    lines.push('}');
    lines.push('');
  }

  // --- Document wrapper ---
  lines.push(`import { wrapInDocument } from '@openelement/element';`);
  lines.push(`import { jsx } from '@openelement/element';`);
  lines.push(`import { createLogger } from '@openelement/element';`);
  lines.push(`import { createRuntimeAdapter } from '@openelement/element/build-utils';`);
  if (desc.fetchMiddleware?.length) {
    lines.push(`import { composeFetchMiddleware } from '@openelement/element/build-utils';`);
  }
  lines.push(
    `import { isOpenElementRedirect as __isOpenElementRedirect, isOpenElementNotFound as __isOpenElementNotFound, isActionFailure as __isActionFailure, ACTION_FETCH_HEADER as __actionFetchHeader, PROBLEM_JSON_MEDIA_TYPE as __problemJsonMediaType } from '@openelement/app';`,
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
  lines.push(`const log = createLogger('server-entry');`);
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
      '// #952: under the dev SSR stub (__openElementSsrStub) re-definition must',
    );
    lines.push(
      '// WIN instead — the registry outlives module re-evaluation, so route',
    );
    lines.push(
      '// edits only reach SSR output when define() overwrites the stale class.',
    );
    lines.push(
      'const _origDefine = customElements.define.bind(customElements);',
    );
    lines.push('customElements.define = (name, ctor, options) => {');
    lines.push('  if (!customElements.__openElementSsrStub && customElements.get(name)) return;');
    lines.push('  try { _origDefine(name, ctor, options); } catch (e) {');
    lines.push('    if (e && e.name === "NotSupportedError") return;');
    lines.push('    throw e;');
    lines.push('  }');
    lines.push('};');
    lines.push('');
    // #952: entry-side registration ownership tracking. A route module can
    // self-register a DIFFERENT class for its tag via defineElement at module
    // top level (the starter pattern: defineElement('home-page', …) plus a
    // definePage default export whose render() returns <home-page/>). On dev
    // re-evaluation that fresh self-registered class must win; overwriting it
    // with the page class would recurse (its render emits the same tag). The
    // entry therefore only overwrites registrations it made itself.
    lines.push('const __entryDefined = customElements.__openEntryDefined ||= new Map();');
    lines.push('function __registerSsrComponent(tag, ctor) {');
    lines.push('  const current = customElements.get(tag);');
    lines.push('  if (customElements.__openElementSsrStub) {');
    lines.push('    if (current && __entryDefined.get(tag) !== current) return;');
    lines.push('    customElements.define(tag, ctor);');
    lines.push('    __entryDefined.set(tag, ctor);');
    lines.push('    return;');
    lines.push('  }');
    lines.push('  if (!current) customElements.define(tag, ctor);');
    lines.push('}');
    lines.push('');
    // #954: MDX routes default-export a plain function component, not an
    // element class with a render() method. Wrap it in a minimal class whose
    // render() mounts the function's VNode, so .mdx pages render through the
    // same custom-element path as definePage routes. The check keys on
    // prototype.render because the SSR bundle has no global HTMLElement to
    // instanceof against (the element base class falls back to a local stub).
    lines.push('const __asRouteElementClass = (component) => {');
    lines.push(
      '  if (typeof component === "function" && typeof component.prototype?.render !== "function") {',
    );
    lines.push('    return class {');
    lines.push('      render() { return component({}); }');
    lines.push('    };');
    lines.push('  }');
    lines.push('  return component;');
    lines.push('};');
    lines.push('');
  }
  for (const route of desc.pageRoutes) {
    const tagNameExpr = routeTagNameExpr(route.varName, route.tagName);
    lines.push(
      `try { __registerSsrComponent(${tagNameExpr}, __asRouteElementClass(${route.varName}.default)); } catch (err) { console.error('[ssg] Failed to register route custom element ${tagNameExpr}:', err); throw err; }`,
    );
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
      `if (${componentVar}) {`,
    );
    lines.push(
      `  try { __registerSsrComponent(${
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

  // --- Styled 404 (#923): unmatched paths render the /404 page ---
  const notFoundPage = desc.pageRoutes.find((r) => r.path === '/404');
  if (notFoundPage) {
    renderNotFoundRoute(lines, notFoundPage, desc.renderers, docConfig, desc.isSSG);
  }

  // --- /_data endpoint for SPA navigation ---
  renderDataRouteMap(lines, desc.pageRoutes);
  renderDataEndpoint(lines);

  // --- Export ---
  if (desc.fetchMiddleware?.length) {
    // ADR-0123 item 2 (#858): fetch middleware composed at the handler
    // boundary in onion order (use[0] outermost), outside the Hono app, so
    // the dev server, the start CLI, the e2e fixture server, and the Nitro
    // production entry share one composed handler.
    lines.push('// ADR-0123 (#858): fetch middleware contract (WinterCG shape)');
    lines.push('const __openElementFetchMiddleware = [');
    for (const source of desc.fetchMiddleware) {
      lines.push(`  ${source},`);
    }
    lines.push('];');
    lines.push('const __openElementBaseHandler = (request, context = {}) => {');
    lines.push('  return app.fetch(request, context.env || {}, context.platform)');
    lines.push('}');
    lines.push(
      'export const openElementHandler = composeFetchMiddleware(__openElementFetchMiddleware, __openElementBaseHandler)',
    );
    lines.push('');
    // The dev server (@hono/vite-dev-server) reads this named export instead of
    // the default Hono app when middleware.use is configured (see plugin.ts);
    // it adapts the (request, env, executionCtx) call shape onto the same
    // composed handler every other runtime uses.
    lines.push('export const openElementDevFetch = {');
    lines.push('  fetch: (request, env, executionContext) =>');
    lines.push('    openElementHandler(request, { env: env || {}, platform: executionContext }),');
    lines.push('}');
  } else {
    lines.push('export const openElementHandler = (request, context = {}) => {');
    lines.push('  return app.fetch(request, context.env || {}, context.platform)');
    lines.push('}');
  }
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
