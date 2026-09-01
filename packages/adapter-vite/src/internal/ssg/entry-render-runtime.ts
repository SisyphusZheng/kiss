/**
 * entry-render-runtime.ts - Runtime helper code generation
 *
 * Generates the JavaScript/TypeScript code for runtime helper functions
 * that are embedded in the generated Hono entry module.
 *
 * These helpers provide SSR rendering (the compiled Part Program serializer
 * via renderDsd), locale resolution, lifecycle
 * control (redirect/not-found detection is imported from @openelement/app),
 * status page HTML, app shell wiring, and canonical
 * page-definition extraction shared by the Hono handlers and the SSG render
 * pipeline.
 *
 * v0.44 (ADR-0143): __ssr renders one compiled element class to deterministic
 * HTML through the SYNC compiled renderDsd(); page markup arrives as HTML
 * (there is no runtime VNode path). Nested custom-element hosts inside a
 * compiled page programs are composed by Element's canonical server
 * serializer. This adapter contributes only the SSR-admitted tag list.
 */

import type { AppShellPlan } from '../protocol/ssg.ts';
import { quoteGeneratedJavaScriptValue } from './codegen-literals.ts';

/**
 * Render all runtime helper function definitions as a single code block.
 *
 * Generated functions:
 *   - __ssr       — render a registered compiled element through Element composition
 *   - __pageProps / __pageErrorProps — page descriptor projector seams
 *   - __localeFromPath — extract locale from a URL path
 *   - __statusHtml — render a simple status page HTML string
 *   - __resolveAppShell — resolve app shell from route meta
 *   - __renderAppShell — render route content inside the app shell layout
 *   - __pageDefinition — canonical extractor for a route module's page descriptor
 *   - __routeMeta — canonical route metadata derived from a route module
 */
export function renderRuntimeHelpers(
  appShell: AppShellPlan,
  ssrRenderableTags: readonly string[] = [],
): string {
  const lines: string[] = [];

  lines.push('// SSR helper: render a registered compiled element class to HTML.');
  lines.push('// renderDsd is the sync compiled serializer; it fails closed');
  lines.push('// (OE_PROGRAM_MISSING) for unregistered or uncompiled classes.');
  lines.push(
    'function __ssr(tag, props = {}, sourceInfo = {}, __depth = 0, projectedChildren) {',
  );
  lines.push(
    '  // Validate tag name - must be a valid Custom Element (contains hyphen)',
  );
  lines.push('  if (!tag || !tag.includes("-")) {');
  lines.push(
    '    throw new Error("[openElement] Invalid custom element tag: " + String(tag) + ". Must contain a hyphen.")',
  );
  lines.push('  }');
  lines.push('  if (__depth > 8) {');
  lines.push(
    '    throw new Error("[openElement] Nested element expansion exceeded the depth bound at <" + tag + ">; cyclic island nesting is not renderable.")',
  );
  lines.push('  }');
  lines.push('  const Cls = customElements.get(tag)');
  lines.push('  if (!Cls) {');
  lines.push(
    '    throw new Error("[openElement] <" + tag + "> is not registered in the SSR registry. Generated entries register every admitted route/island class explicitly; an unknown OpenElement host cannot be server-rendered (client-only and foreign tags pass through per the admission plan).")',
  );
  lines.push('  }');
  lines.push(
    '  return renderDsd(tag, { componentClass: Cls, props, sourceInfo, ssrRenderableTags: __ssrRenderableTags, projectedChildren }).html',
  );
  lines.push('}');
  lines.push('');

  lines.push('function __localizeShellHref(href, locale, defaultLocale) {');
  lines.push(
    '  if (typeof href !== "string" || locale === defaultLocale || !href.startsWith("/") || href.startsWith("//")) return href',
  );
  lines.push('  if (href === "/" + locale || href.startsWith("/" + locale + "/")) return href');
  lines.push('  return "/" + locale + (href === "/" ? "" : href)');
  lines.push('}');
  lines.push('');

  // Element owns nested component composition. The adapter contributes only
  // the admission result as an immutable generated tag list.
  lines.push(
    `const __ssrRenderableTags = ${quoteGeneratedJavaScriptValue([...ssrRenderableTags])};`,
  );
  lines.push('');

  // Page props projection: the page descriptor's props projector is the only
  // channel that maps request-scoped data onto the compiled page properties.
  lines.push('function __defaultPageProps(context) {');
  lines.push('  const props = {}');
  lines.push('  const params = context.params || {}');
  lines.push('  for (const key of Object.keys(params)) props[key] = params[key]');
  lines.push('  const data = context.data');
  lines.push('  if (data && typeof data === "object" && !Array.isArray(data)) {');
  lines.push('    for (const key of Object.keys(data)) props[key] = data[key]');
  lines.push('  }');
  lines.push('  return props');
  lines.push('}');
  lines.push('function __pageProps(routeModule, context) {');
  lines.push(
    '  const page = routeModule && routeModule.default && routeModule.default.openElementPage',
  );
  lines.push('  if (page && typeof page.props === "function") {');
  lines.push('    const projected = page.props(context)');
  lines.push('    return projected && typeof projected === "object" ? projected : {}');
  lines.push('  }');
  lines.push('  return __defaultPageProps(context)');
  lines.push('}');
  lines.push('function __pageErrorProps(routeModule, error, context) {');
  lines.push(
    '  const page = routeModule && routeModule.default && routeModule.default.openElementPage',
  );
  lines.push(
    '  const projected = page && typeof page.error === "function" ? page.error(error, context) : {}',
  );
  lines.push('  return projected && typeof projected === "object" ? projected : {}');
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

  // ADR-0129: merge the loader/action response-header channel into the
  // response. Channel entries are appended; framework protocol headers
  // always win when already set — the channel cannot override the protocol.
  lines.push(
    `const __PROTOCOL_HEADERS = new Set(['location', 'content-type', 'cache-control', 'vary', 'x-openelement-action']);`,
  );
  lines.push('function __mergeChannelHeaders(resp, channel) {');
  lines.push('  let needsMerge = false;');
  lines.push('  channel.forEach(() => { needsMerge = true; });');
  lines.push('  if (!needsMerge) return resp;');
  lines.push('  const merged = new Headers(resp.headers);');
  lines.push('  channel.forEach((value, key) => {');
  lines.push('    if (__PROTOCOL_HEADERS.has(key.toLowerCase()) && merged.has(key)) return;');
  lines.push('    merged.append(key, value);');
  lines.push('  });');
  lines.push(
    '  return new Response(resp.body, { status: resp.status, statusText: resp.statusText, headers: merged });',
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

  // The app-shell composition renders nested custom-element hosts per the
  // layout contract: the page renders as its own host element and is projected
  // into the shell's default slot through Element's canonical serializer:
  // route content remains inside the declared layout-main boundary, while the
  // slot is the explicit external-content claim boundary. Both sides render
  // through __ssr, so nested admitted islands expand deterministically.
  lines.push('function __renderAppShell(pageHtml, routePath, options = {}) {');
  lines.push('  const defaultLocale = __getDefaultLocale();');
  lines.push('  const locale = options.locale || __localeFromPath(routePath, defaultLocale);');
  lines.push('  const routeMeta = options.routeMeta || {};');
  lines.push('  const shell = __resolveAppShell(routeMeta);');
  lines.push('  const isHome = routePath === "/";');
  lines.push('  const content = String(pageHtml);');
  lines.push('  if (!shell) return content;');
  lines.push('  const layoutProps = {');
  lines.push('    currentPath: routePath,');
  lines.push('    locale,');
  lines.push('    locales: __locales,');
  lines.push('    navItems: __navSections,');
  lines.push(
    '    headerNav: __headerNav.map((link) => ({ ...link, href: __localizeShellHref(link.href, locale, defaultLocale) })),',
  );
  lines.push('    homeHref: __localizeShellHref("/", locale, defaultLocale),');
  lines.push('    home: isHome || undefined,');
  lines.push('    routeMeta,');
  lines.push('    ...(shell.props || {}),');
  lines.push('  };');
  lines.push(
    '  return __ssr(shell.tagName, layoutProps, { route: routePath }, 0, new Map([["", trustedHtml(content)]]));',
  );
  lines.push('}');

  return lines.join('\n');
}
