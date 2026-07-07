/**
 * @openelement/ssg - Runtime helper code generation
 *
 * Generates the JavaScript/TypeScript code for runtime helper functions
 * that are embedded in the generated Hono entry module.
 *
 * These helpers provide SSR rendering, locale resolution, lifecycle
 * control (redirect/not-found detection is imported from @openelement/app),
 * status page HTML, app shell rendering, and canonical page-definition
 * extraction shared by the Hono handlers and the SSG render pipeline.
 */

import type { AppShellPlan } from '@openelement/protocol/ssg';
import { quoteGeneratedJavaScriptValue } from './codegen-literals.ts';

/**
 * Render all runtime helper function definitions as a single code block.
 *
 * Generated functions:
 *   - __ssr       — render a registered custom element to DSD HTML
 *   - __localeFromPath — extract locale from a URL path
 *   - __statusHtml — render a simple status page HTML string
 *   - __resolveAppShell — resolve app shell from route meta
 *   - __renderAppShell — render route content inside the app shell layout
 *   - __pageDefinition — canonical extractor for a route module's page descriptor
 *   - __routeMeta — canonical route metadata derived from a route module
 */
export function renderRuntimeHelpers(appShell: AppShellPlan): string {
  const lines: string[] = [];

  lines.push('// SSR helper: render a registered custom element to DSD HTML');
  lines.push('// Outputs standard DSD; no client render markers needed');
  lines.push('async function __ssr(tag, props = {}, sourceInfo = {}) {');
  lines.push(
    '  // Validate tag name - must be a valid Custom Element (contains hyphen)',
  );
  lines.push('  if (!tag || !tag.includes("-")) {');
  lines.push(
    '    throw new Error("[openElement] Invalid custom element tag: " + String(tag) + ". Must contain a hyphen.")',
  );
  lines.push('  }');
  lines.push('  const Cls = customElements.get(tag)');
  lines.push('  if (!Cls) {');
  lines.push('    log.warn("<" + tag + "> not registered - rendering empty")');
  lines.push('    return "<" + tag + "></" + tag + ">"');
  lines.push('  }');
  lines.push('  const out = await renderDsd(tag, { componentClass: Cls, props, sourceInfo })');
  lines.push('  return out.html');
  lines.push('}');
  lines.push('');

  lines.push('function __localeFromPath(path, fallback) {');
  lines.push('  const first = String(path || "/").split("/").filter(Boolean)[0];');
  lines.push('  return __locales.includes(first) ? first : fallback;');
  lines.push('}');
  lines.push('');

  lines.push('function __pageDefinition(module) {');
  lines.push('  return module?.default?.openElementPage || {};');
  lines.push('}');
  lines.push('');

  lines.push('function __routeMeta(module) {');
  lines.push('  const page = __pageDefinition(module);');
  lines.push('  return {');
  lines.push('    ...(page.route !== undefined ? { route: page.route } : {}),');
  lines.push('    ...(page.head?.title !== undefined ? { title: page.head.title } : {}),');
  lines.push(
    '    ...(page.head?.description !== undefined ? { description: page.head.description } : {}),',
  );
  lines.push('  };');
  lines.push('}');
  lines.push('');

  lines.push('function __statusHtml(title, message) {');
  lines.push(
    '  return "<main><h1>" + escapeHtml(String(title)) + "</h1><p>" + escapeHtml(String(message)) + "</p></main>";',
  );
  lines.push('}');
  lines.push('');

  lines.push(`const __appShellPlan = ${quoteGeneratedJavaScriptValue(appShell, 2)};`);
  lines.push('');

  lines.push('function __resolveAppShell(routeMeta = {}) {');
  lines.push(
    '  const layout = Object.prototype.hasOwnProperty.call(routeMeta, "layout") ? routeMeta.layout : undefined;',
  );
  lines.push('  if (layout === false) return false;');
  lines.push(
    '  if (typeof layout === "string") return __appShellPlan.layouts[layout] ?? __appShellPlan.default;',
  );
  lines.push('  return __appShellPlan.default;');
  lines.push('}');
  lines.push('');

  lines.push('async function __renderAppShell(routeNode, routePath, options = {}) {');
  lines.push('  const defaultLocale = __getDefaultLocale();');
  lines.push('  const locale = options.locale || __localeFromPath(routePath, defaultLocale);');
  lines.push('  const routeMeta = options.routeMeta || {};');
  lines.push('  const shell = __resolveAppShell(routeMeta);');
  lines.push('  const isHome = routePath === "/";');
  lines.push('  // routeNode may be a VNode (jsx output) or HTML string. Render VNodes.');
  lines.push('  const pageHtml = typeof routeNode === "object" && routeNode !== null');
  lines.push('    ? await renderDsdTree(routeNode)');
  lines.push('    : String(routeNode);');
  lines.push('  if (!shell) return pageHtml;');
  lines.push('  const layoutProps = {');
  lines.push('    currentPath: routePath,');
  lines.push('    locale,');
  lines.push('    locales: __locales,');
  lines.push('    navItems: __navSections,');
  lines.push('    headerNav: __headerNav,');
  lines.push('    home: isHome || undefined,');
  lines.push('    routeMeta,');
  lines.push('    ...(shell.props || {}),');
  lines.push('  };');
  lines.push('  const layoutResult = await renderDsd(shell.tagName, { props: layoutProps });');
  lines.push('  const closingTag = "</" + shell.tagName + ">";');
  lines.push('  const index = layoutResult.html.lastIndexOf(closingTag);');
  lines.push('  if (index === -1) return layoutResult.html + pageHtml;');
  lines.push(
    '  return layoutResult.html.slice(0, index) + pageHtml + layoutResult.html.slice(index);',
  );
  lines.push('}');

  return lines.join('\n');
}
