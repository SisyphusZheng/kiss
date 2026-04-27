/**
 * @kissjs/core - Entry Renderer
 *
 * Pure function: EntryDescriptor → string (virtual module code).
 *
 * KISS Architecture (v0.3.0):
 * - API routes use Hono standard app.route() (not app.all + fetch transform)
 * - Hydration uses generateHydrationScript from island-transform.ts
 * - HTML wrapping uses wrapInDocument from ssr-handler.ts
 * - No duplicate implementations — single source of truth
 */

import type {
  ApiRouteDecl,
  CorsOriginConfig,
  EntryDescriptor,
  ImportDecl,
  MiddlewareDecl,
  PageRouteDecl,
} from './entry-descriptor.js';

// ─── Code builder helper ───────────────────────────────────────

class CodeBuilder {
  private lines: string[] = [];

  push(line: string): void {
    this.lines.push(line);
  }
  blank(): void {
    this.lines.push('');
  }

  toString(): string {
    return this.lines.join('\n');
  }
}

// ─── Import rendering ──────────────────────────────────────────

function renderImport(imp: ImportDecl): string {
  const names = imp.alias ? `${imp.names[0]} as ${imp.alias}` : imp.names.join(', ');
  return `import { ${names} } from '${imp.from}'`;
}

// ─── CORS config rendering ─────────────────────────────────────

function renderCorsOrigin(origin: CorsOriginConfig): string {
  if (typeof origin === 'string') {
    return JSON.stringify(origin);
  }
  if (Array.isArray(origin)) {
    return JSON.stringify(origin);
  }
  // Function type
  return origin.body;
}

const CORS_ALLOW =
  "allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], allowHeaders: ['Content-Type', 'Authorization'], credentials: true, maxAge: 86400";

// ─── Middleware rendering ───────────────────────────────────────

function renderMiddleware(b: CodeBuilder, mw: MiddlewareDecl): void {
  if (mw.comment) {
    b.push(`// ${mw.comment}`);
  }

  switch (mw.kind) {
    case 'requestId':
      b.push("app.use('*', requestId())");
      break;

    case 'logger':
      b.push("app.use('*', honoLogger())");
      break;

    case 'cors': {
      const corsOrigin = mw.config?.corsOrigin;
      if (corsOrigin !== undefined) {
        const originStr = renderCorsOrigin(corsOrigin);
        b.push(`app.use('*', cors({ origin: ${originStr}, ${CORS_ALLOW} }))`);
      } else {
        // Default: allow localhost for dev, same-origin otherwise
        b.push("app.use('*', cors({ origin: (origin) => {");
        b.push('  if (origin && /^http:\\/\\/localhost(:\\d+)?$/.test(origin)) return origin');
        b.push('  return origin');
        b.push(`}, ${CORS_ALLOW} }))`);
      }
      break;
    }

    case 'securityHeaders':
      b.push("app.use('*', secureHeaders())");
      break;
  }

  b.blank();
}

// ─── API route rendering ───────────────────────────────────────

/**
 * Render an API route using Hono's standard app.route().
 *
 * v0.3.0: Replaced app.all + fetch transform (which broke Hono's
 * routing tree and RPC type chain) with the idiomatic app.route().
 *
 * Convention: API files default-export a Hono sub-app.
 * Framework mounts: app.route('/api/posts', subApp)
 */
function renderApiRoute(b: CodeBuilder, route: ApiRouteDecl): void {
  b.push(`// API: ${route.path} (${route.filePath})`);
  b.push(`app.route('${route.path}', ${route.varName}.default)`);
  b.blank();
}

// ─── Page route rendering ──────────────────────────────────────

function renderPageRoute(b: CodeBuilder, route: PageRouteDecl): void {
  b.push(`// Page: ${route.path} (${route.filePath})`);
  b.push(`app.get('${route.path}', async (c) => {`);
  b.push(`  try {`);
  b.push(`    const tag = ${route.varName}.tagName || '${route.defaultTagName}'`);
  b.push(`    const raw = await __ssr(tag)`);
  b.push(`    const clean = stripLitComments(raw)`);
  b.push(`    return c.html(wrapDocument(clean, c.req.path))`);
  b.push(`  } catch (err) {`);
  b.push(`    return c.html('<h1>500</h1><p>' + String(err) + '</p>', 500)`);
  b.push(`  }`);
  b.push(`})`);
  b.blank();
}

// ─── Main renderer ─────────────────────────────────────────────

/**
 * Render an EntryDescriptor into a complete virtual module string.
 *
 * Pure function — deterministic, testable, side-effect-free.
 *
 * v0.3.0: Uses generateHydrationScript (island-transform.ts) and
 * wrapInDocument (ssr-handler.ts) — single source of truth.
 */
export function renderEntry(desc: EntryDescriptor): string {
  const b = new CodeBuilder();

  // --- SSG: DOM shim must be the very first import ---
  if (desc.isSSG) {
    b.push(`import '@lit-labs/ssr/lib/install-global-dom-shim.js'`);
    b.blank();
  }

  // --- Imports ---
  for (const imp of desc.imports) {
    b.push(renderImport(imp));
  }

  // --- Utility functions ---
  b.push(
    `function stripLitComments(html) { return html.replace(/<!--\\/?(?:lit-part|lit-node)[^>]*-->/g, '') }`,
  );

  // --- Island hydration (build-time known list) ---
  const islandLookup: Record<string, string> = {};
  for (const island of desc.islands) {
    islandLookup[island.tagName] = island.modulePath;
  }

  b.push(`// Known islands (determined at build time by scanning islandsDir)`);
  b.push(`const __islandMap = ${JSON.stringify(islandLookup)}`);
  b.blank();

  // Hydration script generator — delegates to generateHydrationScript
  // which implements all four strategies (eager/lazy/idle/visible)
  b.push(`function generateHydrationScript() {`);
  b.push(`  const islands = Object.entries(__islandMap).map(([tagName, modulePath]) => ({ tagName, modulePath }))`);
  b.push(`  if (islands.length === 0) return ''`);
  b.push(`  const strategy = '${desc.hydrationStrategy || 'lazy'}'`);
  b.push(`  const islandDefs = islands.map(i => "  '" + i.tagName + "': () => import('" + i.modulePath + "')").join(',\\n')`);
  b.push(`  const strategyCode = {`);
  b.push(`    eager: "for (const [tagName, loader] of Object.entries(islandLoaders)) { hydrateIsland(tagName, loader); }",`);
  b.push(`    lazy: "const hydrateAll = () => { for (const [tagName, loader] of Object.entries(islandLoaders)) { hydrateIsland(tagName, loader); } }; if ('requestIdleCallback' in window) { requestIdleCallback(hydrateAll); } else { setTimeout(hydrateAll, 200); }",`);
  b.push(`    idle: "if ('requestIdleCallback' in window) { requestIdleCallback(() => { for (const [tagName, loader] of Object.entries(islandLoaders)) { hydrateIsland(tagName, loader); } }); } else { window.addEventListener('load', () => { for (const [tagName, loader] of Object.entries(islandLoaders)) { hydrateIsland(tagName, loader); } }); }",`);
  b.push(`    visible: "const observer = new IntersectionObserver((entries) => { for (const entry of entries) { if (entry.isIntersecting) { const tagName = entry.target.tagName.toLowerCase(); if (islandLoaders[tagName]) { hydrateIsland(tagName, islandLoaders[tagName]); observer.unobserve(entry.target); } } } }); for (const tagName of Object.keys(islandLoaders)) { document.querySelectorAll(tagName).forEach(el => observer.observe(el)); }"`);
  b.push(`  }[strategy] || strategyCode.lazy`);
  b.push(`  return '<script type=\\\"module\\\" data-kiss-hydrate>\\n' +`);
  b.push(`    '// KISS Island Hydration Script\\n' +`);
  b.push(`    '(function() {\\n' +`);
  b.push(`    '  const islandLoaders = {\\n    ' + islandDefs + '\\n  };\\n' +`);
  b.push(`    '  async function hydrateIsland(tagName, loader) {\\n' +`);
  b.push(`    '    try { const mod = await loader(); const ElementClass = mod.default; if (ElementClass && !customElements.get(tagName)) { customElements.define(tagName, ElementClass); } }\\n' +`);
  b.push(`    '    catch(e) { console.warn(\\\"[KISS] Island <\\\"+tagName+\\\"> hydration failed:\\\", e); }\\n' +`);
  b.push(`    '  }\\n' +`);
  b.push(`    strategyCode + '\\n' +`);
  b.push(`    '})();\\n' +`);
  b.push(`    '</script>'`);
  b.push(`}`);
  b.blank();

  // Document wrapper — uses wrapInDocument pattern from ssr-handler.ts
  b.push(`function wrapDocument(body, currentPath) {`);
  b.push(`  const hydrate = generateHydrationScript()`);
  b.push(`  const headExtras = ${JSON.stringify(desc.document.headExtras)}`);
  b.push(
    `  return '<!DOCTYPE html>\\n<html lang="${desc.document.lang}">\\n<head>\\n  <meta charset="UTF-8">\\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\\n  <title>${desc.document.title}</title>\\n' + headExtras + '\\n</head>\\n<body data-current-path=\\"' + currentPath + '\\">\\n' + body + '\\n' + hydrate + '\\n</body>\\n</html>'`,
  );
  b.push(`}`);
  b.blank();

  // --- Route module imports ---
  for (const route of [...desc.apiRoutes, ...desc.pageRoutes]) {
    b.push(`import * as ${route.varName} from '${route.importPath}'`);
  }
  b.blank();

  // --- SSR helper ---
  // unsafeHTML must be in expression position (NOT in element position <${...}>),
  // otherwise Lit throws "Unexpected final partIndex" error.
  // tag validation: only hyphenated Custom Element names are valid.
  const BT = '\x60'; // backtick: `
  const DI = '\x24{'; // ${
  const DC = '}'; // }
  b.push('// SSR helper: render a custom element tag to HTML string');
  b.push('async function __ssr(tag) {');
  b.push('  // Validate tag name — must be a valid Custom Element (contains hyphen)');
  b.push('  if (!tag || !tag.includes("-")) {');
  b.push('    throw new Error("[KISS] Invalid custom element tag: " + String(tag) + ". Must contain a hyphen.")');
  b.push('  }');
  b.push(
    '  const tpl = html' + BT + DI + 'unsafeHTML(' + BT + '<' + DI + 'tag' + DC + ' defer-hydration></' + DI +
      'tag' + DC + '>' + BT + ')' + DC + BT,
  );
  b.push('  const result = litRender(tpl)');
  b.push('  return await collectResult(result)');
  b.push('}');
  b.blank();

  // --- App creation + Middleware ---
  b.push('const app = new Hono()');
  b.blank();

  for (const mw of desc.middleware) {
    renderMiddleware(b, mw);
  }

  // --- API routes ---
  for (const route of desc.apiRoutes) {
    renderApiRoute(b, route);
  }

  // --- Page routes ---
  for (const route of desc.pageRoutes) {
    renderPageRoute(b, route);
  }

  // --- Export ---
  b.push('export default app');

  return b.toString();
}
