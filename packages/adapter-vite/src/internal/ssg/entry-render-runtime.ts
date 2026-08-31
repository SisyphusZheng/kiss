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
  lines.push('  return __expandNestedHosts(out.html, sourceInfo, __depth, tag)');
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
  lines.push('function __nestedShellPattern(tag) { return new RegExp(');
  lines.push(
    '  "<" + tag + "((?: [A-Za-z_:][-A-Za-z0-9_.:]*(?:=\\"[^\\"]*\\")?)*)>([\\\\s\\\\S]*?)</" + tag + ">", "g"',
  );
  lines.push(')}');
  lines.push('function __unescapeAttr(value) {');
  lines.push('  return value');
  lines.push('    .replaceAll("&#39;", "\'")');
  lines.push('    .replaceAll("&quot;", \'"\')');
  lines.push('    .replaceAll("&lt;", "<")');
  lines.push('    .replaceAll("&gt;", ">")');
  lines.push('    .replaceAll("&amp;", "&");');
  lines.push('}');
  lines.push('function __coerceNestedProp(tag, record, raw) {');
  lines.push('  if (record.converter === "boolean") return raw === "" || raw === "true"');
  lines.push('  if (record.converter === "number") {');
  lines.push('    const value = Number(raw);');
  lines.push('    return Number.isNaN(value) ? 0 : value;');
  lines.push('  }');
  lines.push('  if (record.converter === "array" || record.converter === "object") {');
  lines.push('    try { return JSON.parse(raw); } catch {');
  lines.push(
    '      throw new Error("[openElement] <" + tag + "> property \\"" + record.name + "\\" is not valid JSON");',
  );
  lines.push('    }');
  lines.push('  }');
  lines.push('  return raw');
  lines.push('}');
  lines.push("// Map a serialized shell's attributes onto the component's compiled");
  lines.push('// properties (attribute name -> property record). An attribute that');
  lines.push('// is not a compiled property of the component fails closed: dropping it');
  lines.push('// silently would desync the client claim from the server render.');
  lines.push('function __propsFromAttrs(tag, attrText) {');
  lines.push('  const Cls = customElements.get(tag)');
  lines.push('  const records = (Cls && Cls.__compiledProperties) || []');
  lines.push('  const props = {}');
  lines.push('  const attrRe = /([A-Za-z_:][-A-Za-z0-9_.:]*)(?:="([^"]*)")?/g');
  lines.push('  let match');
  lines.push('  while ((match = attrRe.exec(attrText)) !== null) {');
  lines.push(
    '    const record = records.find((candidate) => !candidate.computed && (candidate.name === match[1] || candidate.attribute === match[1]))',
  );
  lines.push('    if (!record) {');
  lines.push(
    '      throw new Error("[openElement] <" + tag + "> SSR expansion received attribute \\"" + match[1] + "\\" that is not a compiled property of the component. Move per-instance data into @property fields or mark the component client-only.")',
  );
  lines.push('    }');
  lines.push('    const raw = match[2] === undefined ? "" : __unescapeAttr(match[2])');
  lines.push('    props[record.name] = __coerceNestedProp(tag, record, raw)');
  lines.push('  }');
  lines.push('  return props');
  lines.push('}');
  // A compiled light-root component uses <slot> as its explicit projection
  // boundary, but native slot assignment only exists in shadow roots. Split
  // the serialized direct children and place them inside the matching slot
  // elements so static nested components preserve the same visible tree and
  // claim boundary as the top-level app shell.
  lines.push('function __lightChildNodes(html) {');
  lines.push('  const nodes = []');
  lines.push('  let start = 0');
  lines.push('  let index = 0');
  lines.push('  let depth = 0');
  lines.push('  while (index < html.length) {');
  lines.push('    const open = html.indexOf("<", index)');
  lines.push('    if (open === -1) break');
  lines.push(
    '    if (depth === 0 && open > start) { nodes.push(html.slice(start, open)); start = open; }',
  );
  lines.push('    if (html.startsWith("<!--", open)) {');
  lines.push('      const end = html.indexOf("-->", open + 4)');
  lines.push(
    '      if (end === -1) throw new Error("[openElement] unterminated comment in nested light content")',
  );
  lines.push('      index = end + 3');
  lines.push('      if (depth === 0) { nodes.push(html.slice(start, index)); start = index; }');
  lines.push('      continue');
  lines.push('    }');
  lines.push('    let end = open + 1');
  lines.push('    let quote = ""');
  lines.push('    for (; end < html.length; end++) {');
  lines.push('      const char = html[end]');
  lines.push('      if (quote) { if (char === quote) quote = ""; continue; }');
  lines.push('      if (char === "\\"" || char === "\u0027") { quote = char; continue; }');
  lines.push('      if (char === ">") break');
  lines.push('    }');
  lines.push(
    '    if (end >= html.length) throw new Error("[openElement] unterminated tag in nested light content")',
  );
  lines.push('    const token = html.slice(open, end + 1)');
  lines.push('    const closing = /^<\\//.test(token)');
  lines.push('    const declaration = /^<!|^<\\?/.test(token)');
  lines.push(
    '    const voidTag = /^<(?:area|base|br|col|embed|hr|img|input|link|meta|source|track|wbr)(?: |\\/?>)/i.test(token)',
  );
  lines.push('    const selfClosing = /\\/>$/.test(token)');
  lines.push('    if (closing) depth = Math.max(0, depth - 1)');
  lines.push('    else if (!declaration && !voidTag && !selfClosing) depth++');
  lines.push('    index = end + 1');
  lines.push('    if (depth === 0) { nodes.push(html.slice(start, index)); start = index; }');
  lines.push('  }');
  lines.push('  if (start < html.length) nodes.push(html.slice(start))');
  lines.push('  return nodes');
  lines.push('}');
  lines.push('function __lightChildSlot(node) {');
  lines.push('  if (!node.startsWith("<") || node.startsWith("<!--")) return ""');
  lines.push('  const end = node.indexOf(">")');
  lines.push('  if (end === -1) return ""');
  lines.push('  const match = /(?:^|\\s)slot="([^"]*)"/.exec(node.slice(0, end + 1))');
  lines.push('  return match ? __unescapeAttr(match[1]) : ""');
  lines.push('}');
  lines.push('function __projectLightChildren(rendered, closing, inner) {');
  lines.push('  const assigned = new Map()');
  lines.push('  for (const node of __lightChildNodes(inner)) {');
  lines.push('    const name = __lightChildSlot(node)');
  lines.push('    assigned.set(name, (assigned.get(name) || "") + node)');
  lines.push('  }');
  lines.push('  const consumed = new Set()');
  lines.push('  const body = rendered.slice(0, -closing.length).replace(');
  lines.push('    /<slot((?: [A-Za-z_:][-A-Za-z0-9_.:]*(?:="[^"]*")?)*)>([\\s\\S]*?)<\\/slot>/g,');
  lines.push('    (_slot, attrs, fallback) => {');
  lines.push('      const match = /(?:^|\\s)name="([^"]*)"/.exec(attrs || "")');
  lines.push('      const name = match ? __unescapeAttr(match[1]) : ""');
  lines.push('      const projected = consumed.has(name) ? "" : assigned.get(name)');
  lines.push('      consumed.add(name)');
  lines.push(
    '      return "<slot" + attrs + ">" + (projected === undefined ? fallback : projected) + "</slot>"',
  );
  lines.push('    },');
  lines.push('  )');
  lines.push('  for (const [name, value] of assigned) {');
  lines.push('    if (!consumed.has(name) && (name || value.trim())) {');
  lines.push(
    '      throw new Error("[openElement] nested light content targets missing slot " + JSON.stringify(name || "default"))',
  );
  lines.push('    }');
  lines.push('  }');
  lines.push('  return body + closing');
  lines.push('}');
  lines.push('function __expandNestedContent(html, sourceInfo, __depth) {');
  lines.push('  let out = html');
  lines.push('  for (const tag of __ssrRenderableTags) {');
  lines.push('    out = out.replace(__nestedShellPattern(tag), (_match, attrText, inner) => {');
  lines.push(
    '      if (/(?:^| )data-oe-light(?:=| |$)/.test(attrText || "") || inner.trimStart().startsWith("<template shadowrootmode=")) return _match',
  );
  lines.push(
    '      const rendered = __ssr(tag, __propsFromAttrs(tag, attrText || ""), sourceInfo, __depth + 1);',
  );
  lines.push('      const closing = "</" + tag + ">";');
  lines.push('      if (!rendered.endsWith(closing)) {');
  lines.push(
    '        throw new Error("[openElement] nested expansion of <" + tag + "> did not produce a host document; the component must render its own host tag.")',
  );
  lines.push('      }');
  lines.push('      if (!inner) return rendered;');
  lines.push(
    '      if (/(?:^| )data-oe-light(?:=| |>|$)/.test(rendered.slice(0, rendered.indexOf(">") + 1))) return __projectLightChildren(rendered, closing, inner);',
  );
  lines.push('      return rendered.slice(0, -closing.length) + inner + closing;');
  lines.push('    });');
  lines.push('  }');
  lines.push('  return out');
  lines.push('}');
  lines.push('function __expandNestedHosts(html, sourceInfo, __depth, rootTag) {');
  lines.push('  const closing = "</" + rootTag + ">"');
  lines.push('  const openEnd = html.indexOf(">")');
  lines.push('  if (!html.startsWith("<" + rootTag) || openEnd < 0 || !html.endsWith(closing)) {');
  lines.push(
    '    throw new Error("[openElement] SSR output for <" + rootTag + "> is not a complete host document")',
  );
  lines.push('  }');
  lines.push('  const inner = html.slice(openEnd + 1, -closing.length)');
  lines.push(
    '  return html.slice(0, openEnd + 1) + __expandNestedContent(inner, sourceInfo, __depth) + closing',
  );
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
  // layout contract: the page renders as its own host element and is projected
  // into the shell's first empty <slot>. This keeps light-root shells honest:
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
  lines.push('  const layoutHtml = __ssr(shell.tagName, layoutProps, { route: routePath });');
  lines.push('  const slot = "<slot></slot>";');
  lines.push('  const index = layoutHtml.indexOf(slot);');
  lines.push('  if (index === -1) {');
  lines.push(
    '    throw new Error("[adapter-vite:ssg] app shell <" + shell.tagName + "> must render an empty <slot></slot>");',
  );
  lines.push('  }');
  lines.push(
    '  return layoutHtml.slice(0, index) + "<slot>" + content + "</slot>" + layoutHtml.slice(index + slot.length);',
  );
  lines.push('}');

  return lines.join('\n');
}
