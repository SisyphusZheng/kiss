/**
 * entry-render-runtime.ts - Runtime helper code generation
 *
 * Generates the JavaScript/TypeScript code for runtime helper functions
 * that are embedded in the generated Hono entry module.
 *
 * These helpers provide SSR rendering (the compiled Part Program serializer
 * via renderDsd), nested-host expansion, locale resolution, lifecycle
 * control (redirect/not-found detection is imported from @openelement/app),
 * status page HTML, document wrapping, app shell rendering, and canonical
 * page-definition extraction shared by the Hono handlers and the SSG render
 * pipeline.
 *
 * v0.44 (ADR-0143): __ssr renders one compiled element class to deterministic
 * HTML through the SYNC compiled renderDsd(); page markup arrives as HTML
 * (there is no runtime VNode path). Nested custom-element hosts inside a
 * compiled page program serialize as empty shells; __ssr expands the shells
 * of SSR-admitted islands recursively (fail closed on an unknown or
 * unregistered OpenElement host; client-only and foreign tags pass through
 * per the admission plan).
 */

import type { AppShellPlan } from '../protocol/ssg.ts';
import { quoteGeneratedJavaScriptValue } from './codegen-literals.ts';

/**
 * Render all runtime helper function definitions as a single code block.
 *
 * Generated functions:
 *   - __ssr       — render a registered compiled element to HTML (with nested expansion)
 *   - __expandNestedHosts / __propsFromAttrs — per-render nested island composition
 *   - __pageProps / __pageErrorProps — page descriptor projector seams
 *   - wrapInDocument — document wrapper (codegen-owned since 0.44; the element
 *     package no longer exports a runtime document wrapper)
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
  lines.push('function __ssr(tag, props = {}, sourceInfo = {}, __depth = 0) {');
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
  lines.push('  const out = renderDsd(tag, { componentClass: Cls, props, sourceInfo })');
  lines.push('  return __expandNestedHosts(out.html, sourceInfo, __depth)');
  lines.push('}');
  lines.push('');

  // Nested-host expansion: compiled page programs serialize nested
  // custom-element hosts as `<tag ...>children</tag>` shells. For each
  // SSR-admitted island tag (build-time list from the admission plan) the
  // shells are expanded per render through the island's own compiled class
  // (fail closed on an unknown or unregistered OpenElement host; client-only
  // and foreign tags pass through per the admission plan). The shell's light
  // children are preserved after the island's DSD template — slot projection
  // is platform behavior (alpha.8). Same-tag nesting is outside this contract
  // (the shell pattern pairs the first closing tag).
  // Attribute values were escaped by the compiled serializer (`>` cannot
  // appear raw inside a quoted value), so the shell pattern is exact.
  lines.push(
    `const __ssrRenderableTags = ${quoteGeneratedJavaScriptValue([...ssrRenderableTags])};`,
  );
  lines.push('const __nestedShells = __ssrRenderableTags.map((tag) => [tag, new RegExp(');
  lines.push(
    '  "<" + tag + "((?: [A-Za-z_:][-A-Za-z0-9_.:]*(?:=\\"[^\\"]*\\")?)*)>([\\s\\S]*?)</" + tag + ">", "g"',
  );
  lines.push(')]);');
  lines.push('function __unescapeAttr(value) {');
  lines.push('  return value');
  lines.push('    .replaceAll("&#39;", "\'")');
  lines.push('    .replaceAll("&quot;", \'"\')');
  lines.push('    .replaceAll("&lt;", "<")');
  lines.push('    .replaceAll("&gt;", ">")');
  lines.push('    .replaceAll("&amp;", "&");');
  lines.push('}');
  lines.push("// Map a serialized shell's attributes onto the island's compiled");
  lines.push('// properties (attribute name -> property record). An attribute that');
  lines.push('// is not a compiled property of the island fails closed: dropping it');
  lines.push('// silently would desync the client claim from the server render.');
  lines.push('function __propsFromAttrs(tag, attrText) {');
  lines.push('  const Cls = customElements.get(tag)');
  lines.push('  const records = (Cls && Cls.__compiledProperties) || []');
  lines.push('  const props = {}');
  lines.push('  const attrRe = /([A-Za-z_:][-A-Za-z0-9_.:]*)(?:="([^"]*)")?/g');
  lines.push('  let match');
  lines.push('  while ((match = attrRe.exec(attrText)) !== null) {');
  lines.push('    const record = records.find((candidate) => candidate.attribute === match[1])');
  lines.push('    if (!record) {');
  lines.push(
    '      throw new Error("[openElement] <" + tag + "> SSR expansion received attribute \\"" + match[1] + "\\" that is not a compiled property of the island. Move per-instance data into @property fields or mark the island client-only.")',
  );
  lines.push('    }');
  lines.push('    props[record.name] = match[2] === undefined');
  lines.push('      ? (record.converter === "boolean" ? true : "")');
  lines.push('      : __unescapeAttr(match[2])');
  lines.push('  }');
  lines.push('  return props');
  lines.push('}');
  lines.push('function __expandNestedHosts(html, sourceInfo, __depth) {');
  lines.push('  let out = html');
  lines.push('  for (const entry of __nestedShells) {');
  lines.push('    out = out.replace(entry[1], (_match, attrText, inner) => {');
  lines.push(
    '      const rendered = __ssr(entry[0], __propsFromAttrs(entry[0], attrText || ""), sourceInfo, __depth + 1);',
  );
  lines.push('      const closing = "</" + entry[0] + ">";');
  lines.push('      if (!rendered.endsWith(closing)) {');
  lines.push(
    '        throw new Error("[openElement] nested expansion of <" + entry[0] + "> did not produce a host document; the island must render its own host tag.")',
  );
  lines.push('      }');
  lines.push('      if (!inner) return rendered;');
  lines.push('      return rendered.slice(0, -closing.length) + inner + closing;');
  lines.push('    });');
  lines.push('  }');
  lines.push('  return out');
  lines.push('}');
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

  // Document wrapper. The element package's runtime wrapInDocument was removed
  // in 0.44; the generated entry owns its document template (single emitted
  // copy per entry). The head-extras sanitization (script stripping unless
  // allowHeadExtrasScripts, on* handler stripping, comment-balance warning)
  // mirrors the removed helper exactly.
  lines.push('// Document wrapper (codegen-owned): DOCTYPE, head (title/meta/headExtras), body.');
  lines.push('function __escapeAttrValue(value) {');
  lines.push('  if (value === null || value === undefined) return "";');
  lines.push('  return escapeHtml(String(value));');
  lines.push('}');
  lines.push('function wrapInDocument(html, options = {}) {');
  lines.push('  const {');
  lines.push('    title = "openElement",');
  lines.push('    lang = "en",');
  lines.push('    clientScript = "",');
  lines.push('    meta,');
  lines.push('    devScripts = "",');
  lines.push('    headExtras = "",');
  lines.push('    dangerouslyHeadFragments = [],');
  lines.push('    allowHeadExtrasScripts = false,');
  lines.push('    cspNonce,');
  lines.push('  } = options;');
  lines.push('  let safeHeadExtras = headExtras;');
  lines.push('  if (!allowHeadExtrasScripts && safeHeadExtras) {');
  lines.push('    const stripped = safeHeadExtras');
  lines.push('      .replace(/<script[\\s>/][\\s\\S]*?<\\/script\\s*>/gi, "")');
  lines.push('      .replace(/<script[\\s>/][\\s\\S]*$/gi, "");');
  lines.push('    if (stripped !== safeHeadExtras) {');
  lines.push(
    '      log.warn("headExtras contained <script> tags which were stripped for security. Use inject.scripts for safe script injection, or set allowHeadExtrasScripts: true.");',
  );
  lines.push('      safeHeadExtras = stripped;');
  lines.push('    }');
  lines.push('    if (/\\s+on\\w+\\s*=/i.test(safeHeadExtras)) {');
  lines.push(
    '      safeHeadExtras = safeHeadExtras.replace(/\\s+on\\w+\\s*=\\s*(?:"[^"]*"|\'[^\']*\'|[^\\s>]+)/gi, "");',
  );
  lines.push(
    '      log.warn("headExtras contained on* event handler attributes which were stripped for security.");',
  );
  lines.push('    }');
  lines.push('  }');
  lines.push('  if (safeHeadExtras) {');
  lines.push('    const commentOpens = (safeHeadExtras.match(/<!--/g) || []).length;');
  lines.push('    const commentCloses = (safeHeadExtras.match(/-->/g) || []).length;');
  lines.push('    if (commentOpens !== commentCloses) {');
  lines.push(
    '      log.warn("headExtras has unbalanced HTML comments (<!-- vs -->). This may cause HTML parsing issues.");',
  );
  lines.push('    }');
  lines.push('  }');
  lines.push('  // v0.14.5: CSP nonce format validation per CSP spec (base64 value)');
  lines.push('  const NONCE_RE = /^[A-Za-z0-9+/=_-]+$/;');
  lines.push('  const validNonce = cspNonce && NONCE_RE.test(cspNonce) ? cspNonce : undefined;');
  lines.push('  if (cspNonce && !validNonce) {');
  lines.push(
    "    log.warn('Invalid CSP nonce format: \"' + cspNonce + '\". Nonce should be a base64-encoded value.');",
  );
  lines.push('  }');
  lines.push('  const metaTags = [];');
  lines.push('  if (meta && meta.description) {');
  lines.push(
    '    metaTags.push(\'  <meta name="description" content="\' + __escapeAttrValue(meta.description) + \'">\');',
  );
  lines.push('  }');
  lines.push('  if (meta && Array.isArray(meta.tags)) {');
  lines.push('    for (const tag of meta.tags) {');
  lines.push('      const attrs = Object.entries(tag)');
  lines.push(
    "        .map(([key, value]) => escapeHtml(String(key)) + '=\"' + __escapeAttrValue(value) + '\"')",
  );
  lines.push('        .join(" ")');
  lines.push('      if (attrs) metaTags.push("  <meta " + attrs + ">");');
  lines.push('    }');
  lines.push('  }');
  lines.push(
    '  const metaBlock = metaTags.length > 0 ? "\\n" + metaTags.join("\\n") + "\\n" : "";',
  );
  lines.push('  const dangerousHeadBlock = dangerouslyHeadFragments.length > 0');
  lines.push('    ? "\\n  " + dangerouslyHeadFragments.join("\\n  ")');
  lines.push('    : "";');
  lines.push('  const safeTitle = escapeHtml(String(title));');
  lines.push('  const safeLang = escapeHtml(String(lang));');
  lines.push(
    "  return '<!DOCTYPE html>\\n<html lang=\"' + safeLang + '\">\\n<head>\\n" +
      '  <meta charset="UTF-8">\\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\\n' +
      "  <title>' + safeTitle + '</title>' + metaBlock + '\\n  ' + safeHeadExtras + dangerousHeadBlock + '\\n</head>\\n<body>\\n  ' + html + '\\n  ' + clientScript + devScripts + '\\n</body>\\n</html>';",
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
  // layout contract: the page renders as its own host element and the shell
  // renders around it (<shell-tag><page-tag/></shell-tag> composition) — the
  // page HTML is injected before the shell's closing tag. Both sides render
  // through __ssr, so nested admitted islands inside either expand
  // deterministically.
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
  lines.push('    headerNav: __headerNav,');
  lines.push('    home: isHome || undefined,');
  lines.push('    routeMeta,');
  lines.push('    ...(shell.props || {}),');
  lines.push('  };');
  lines.push('  const layoutHtml = __ssr(shell.tagName, layoutProps, { route: routePath });');
  lines.push('  const closingTag = "</" + shell.tagName + ">";');
  lines.push('  const index = layoutHtml.lastIndexOf(closingTag);');
  lines.push('  if (index === -1) return layoutHtml + content;');
  lines.push('  return layoutHtml.slice(0, index) + content + layoutHtml.slice(index);');
  lines.push('}');

  return lines.join('\n');
}
