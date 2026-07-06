/**
 * @openelement/ssg - SSG entry code generation
 *
 * Generates the SSG-specific sections of the virtual Hono entry module,
 * including SSG utility re-exports, routeInfo, renderRoute, getStaticPaths,
 * and supporting helper functions.
 */

import type { EntryDescriptor } from '@openelement/protocol/ssg';
import { jsStringLiteral, routeRevalidateExpr, routeTagNameExpr } from './entry-render-helpers.ts';

/**
 * Render the SSG-specific section of the entry code.
 *
 * This includes SSG utility re-exports, route metadata, renderRoute,
 * getStaticPaths, and supporting helper functions.
 *
 * Returns an empty string when SSG mode is disabled.
 */
export function renderSsgSection(desc: EntryDescriptor): string {
  if (!desc.isSSG) return '';

  const lines: string[] = [];

  lines.push('');
  lines.push(
    '// - SSG Utility Re-exports (ADR 0008 Phase C) -',
  );
  lines.push('// Used by build-ssg.ts after importing the SSR bundle.');
  lines.push(
    '// Shared module scope ensures adapter/data state is consistent.',
  );
  lines.push('');
  lines.push(
    'export { renderDsd, renderDsdTree, wrapInDocument } from "@openelement/core"',
  );
  lines.push(
    'export { posts, getPostBySlug, getBlogOptions } from "@openelement/generated/blog-data"',
  );
  lines.push('export { generateSitemap } from "@openelement/content/sitemap"');
  lines.push(
    'export { locales, getDefaultLocale, getI18nOptions } from "@openelement/generated/i18n"',
  );
  lines.push('');
  lines.push(
    '// - ADR 0014: DSD-first rendering API -',
  );
  lines.push(
    '// build-ssg.ts calls these - never touches customElements directly.',
  );
  lines.push('');

  // --- routeInfo: structured route metadata ---
  lines.push('export const routeInfo = [');
  for (const r of desc.pageRoutes) {
    const tagNameExpr = routeTagNameExpr(r.varName, r.tagName);
    lines.push(
      `  { path: ${jsStringLiteral(r.path)}, filePath: ${
        jsStringLiteral(r.filePath)
      }, tagName: ${tagNameExpr}, module: ${r.varName}, isDynamic: ${!!r
        .isDynamic}, paramNames: [${
        (r.paramNames || []).map(jsStringLiteral).join(', ')
      }], revalidate: ${
        routeRevalidateExpr(r.varName)
      }, rendering: (__pageDefinition(${r.varName}).renderIntent?.mode || "auto"), streaming: (__pageDefinition(${r.varName}).renderIntent?.streaming || "auto") },`,
    );
  }
  lines.push('];');
  lines.push('');

  lines.push('function __rendererContext(routePath, params) {');
  lines.push('  return {');
  lines.push('    req: {');
  lines.push('      path: routePath,');
  lines.push('      param: (name) => name ? params[name] : params,');
  lines.push('    },');
  lines.push('    get: () => undefined,');
  lines.push('    set: () => undefined,');
  lines.push('  };');
  lines.push('}');
  lines.push('');

  lines.push('function __matchingRenderers(routePath) {');
  lines.push('  const renderers = [];');
  for (const renderer of desc.renderers) {
    if (renderer.scope === '/') {
      lines.push(`  renderers.push(${renderer.varName}.default);`);
    } else {
      lines.push(
        `  if (routePath.toLowerCase() === ${
          jsStringLiteral(renderer.scope.toLowerCase())
        } || routePath.toLowerCase().startsWith(${
          jsStringLiteral(renderer.scope.toLowerCase() + '/')
        })) renderers.push(${renderer.varName}.default);`,
      );
    }
  }
  lines.push('  return renderers;');
  lines.push('}');
  lines.push('');

  // --- renderRoute ---
  lines.push('/**');
  lines.push(' * Render a route to structured output with diagnostics (ADR 0014, v0.15.3).');
  lines.push(
    ' * Returns { html, errors, hydrationHints, componentCount, renderTimeMs }.',
  );
  lines.push(
    ' * Caller can inspect errors/hints for observability or use .html for output.',
  );
  lines.push(' */');
  lines.push('export async function renderRoute(routePath, options = {}) {');
  lines.push('  const info = routeInfo.find(r => r.path === routePath);');
  lines.push(
    "  if (!info) throw new Error('[openElement] renderRoute: route not found: ' + routePath);",
  );
  lines.push(
    '  const { params = {}, locale, title, lang, headExtras } = options;',
  );
  lines.push('  const page = __pageDefinition(info.module);');
  lines.push('  const routeMeta = __routeMeta(info.module);');
  lines.push('  const loadContext = {');
  lines.push('    params,');
  lines.push('    request: options.request,');
  lines.push('    env: options.env || {},');
  lines.push('    platform: options.platform,');
  lines.push('    route: { path: routePath, filePath: info.filePath },');
  lines.push('  };');
  lines.push('  let data;');
  lines.push('  try {');
  lines.push(
    '    data = typeof info.module.loader === "function" ? await info.module.loader(loadContext) : undefined;',
  );
  lines.push('  } catch (error) {');
  lines.push('    if (__isOpenElementRedirect(error)) {');
  lines.push(
    '      const html = wrapInDocument(__statusHtml("Redirect", "Redirecting to " + error.location), {',
  );
  lines.push('        title: "Redirect",');
  lines.push('        lang: lang || locale || "en",');
  lines.push(
    '        headExtras: headExtras !== undefined ? headExtras : (typeof __headExtras !== "undefined" ? __headExtras : ""),',
  );
  lines.push(
    `        allowHeadExtrasScripts: ${JSON.stringify(desc.document.allowHeadExtrasScripts)},`,
  );
  lines.push('      });');
  lines.push(
    '      return { html, status: error.status, redirect: { location: error.location, status: error.status }, errors: [], hydrationHints: [], componentCount: 0, renderTimeMs: 0 };',
  );
  lines.push('    }');
  lines.push('    if (__isOpenElementNotFound(error)) {');
  lines.push(
    '      const html = wrapInDocument(__statusHtml("404 Not Found", error.message || "Not Found"), {',
  );
  lines.push('        title: "404 Not Found",');
  lines.push('        lang: lang || locale || "en",');
  lines.push(
    '        headExtras: headExtras !== undefined ? headExtras : (typeof __headExtras !== "undefined" ? __headExtras : ""),',
  );
  lines.push(
    `        allowHeadExtrasScripts: ${JSON.stringify(desc.document.allowHeadExtrasScripts)},`,
  );
  lines.push('      });');
  lines.push(
    '      return { html, status: 404, notFound: true, errors: [], hydrationHints: [], componentCount: 0, renderTimeMs: 0 };',
  );
  lines.push('    }');
  lines.push('    throw error;');
  lines.push('  }');
  lines.push(
    '  const props = { ...params, data, __openElementActionData: undefined, __openElementParams: params, __openElementRequest: options.request, __openElementRoute: loadContext.route, __openElementMeta: routeMeta };',
  );
  lines.push('  if (locale) props.locale = locale;');
  lines.push('  const startTime = typeof performance !== "undefined" ? performance.now() : 0;');
  lines.push('  let node = jsx(info.tagName, props);');
  lines.push('  for (const renderer of __matchingRenderers(routePath)) {');
  lines.push(
    '    node = await renderer.wrap(node, __rendererContext(routePath, params));',
  );
  lines.push('  }');
  lines.push('  const content = await __renderAppShell(node, routePath, { locale, routeMeta });');
  lines.push(
    '  const renderTimeMs = typeof performance !== "undefined" ? performance.now() - startTime : 0;',
  );
  lines.push(
    '  const componentCount = (content.match(/<template shadowrootmode="open"/g) || []).length;',
  );
  lines.push('  const fullHtml = wrapInDocument(content, {');
  lines.push('    title: title || page.head?.title || "openElement",');
  lines.push('    lang: lang || locale || "en",');
  lines.push('    meta: { description: page.head?.description, tags: page.head?.meta },');
  lines.push(
    '    headExtras: headExtras !== undefined ? headExtras : (typeof __headExtras !== "undefined" ? __headExtras : ""),',
  );
  lines.push('    dangerouslyHeadFragments: page.head?.dangerouslyHeadFragments || [],');
  lines.push(
    `    allowHeadExtrasScripts: ${JSON.stringify(desc.document.allowHeadExtrasScripts)},`,
  );
  lines.push('  });');
  lines.push('  return {');
  lines.push('    html: fullHtml,');
  lines.push('    errors: [],');
  lines.push('    hydrationHints: [],');
  lines.push('    componentCount,');
  lines.push('    renderTimeMs,');
  lines.push('  };');
  lines.push('}');
  lines.push('');

  // --- getStaticPaths ---
  lines.push('/**');
  lines.push(' * Get static paths for a dynamic route (ADR 0014).');
  lines.push(' * Returns [] for non-dynamic routes.');
  lines.push(' */');
  lines.push('export async function getStaticPaths(routePath) {');
  lines.push('  const info = routeInfo.find(r => r.path === routePath);');
  lines.push('  if (!info || !info.isDynamic) return [];');
  const dynamicRoutes = desc.pageRoutes.filter((r) => r.isDynamic);
  if (dynamicRoutes.length > 0) {
    lines.push("  // Dispatch to the route module's getStaticPaths()");
    for (const r of dynamicRoutes) {
      lines.push(`  if (routePath === ${jsStringLiteral(r.path)}) {`);
      lines.push(
        `    if (typeof ${r.varName}.getStaticPaths === 'function') {`,
      );
      lines.push(`      return await ${r.varName}.getStaticPaths();`);
      lines.push(`    }`);
      lines.push(`    return [];`);
      lines.push(`  }`);
    }
  }
  lines.push('  return [];');
  lines.push('}');

  return lines.join('\n');
}
