/**
 * @kissjs/core - Entry Renderer
 *
 * Pure function: EntryDescriptor → string (virtual module code).
 *
 * KISS Architecture changes:
 * - Island detection uses build-time scanned list (no regex)
 * - Removed detectIslands() regex function from generated code
 * - Islands are determined at build time by scanning islandsDir
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

function renderApiRoute(b: CodeBuilder, route: ApiRouteDecl): void {
  b.push(`// API: ${route.path} (${route.filePath})`);
  b.push(`app.all('${route.path}', async (c) => {`);
  b.push(`  const subApp = ${route.varName}.default`);
  b.push(`  if (subApp && typeof subApp.fetch === 'function') {`);
  b.push(`    const subPath = c.req.path.slice(${route.path.length}) || '/'`);
  b.push(`    const url = new URL(c.req.url)`);
  b.push(`    url.pathname = subPath`);
  b.push(`    return subApp.fetch(new Request(url.toString(), c.req.raw))`);
  b.push(`  }`);
  b.push(`  return c.json({ error: 'Invalid API route module' }, 500)`);
  b.push(`})`);
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
  b.push(`    return c.html(wrapDocument(clean))`);
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
 * KISS Architecture: Island detection uses build-time scanned list, not runtime regex.
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

  // --- Utility functions (always included) ---
  b.push(
    `function stripLitComments(html) { return html.replace(/<!--\\/?(?:lit-part|lit-node)[^>]*-->/g, '') }`,
  );

  // --- Island hydration (build-time known list, no regex) ---
  const islandLookup: Record<string, string> = {};
  for (const island of desc.islands) {
    islandLookup[island.tagName] = island.modulePath;
  }

  b.push(`// Known islands (determined at build time by scanning islandsDir)`);
  b.push(`const __islandMap = ${JSON.stringify(islandLookup)}`);
  b.blank();

  // Hydration script generator — uses build-time island map
  b.push(`function generateHydrationScript() {`);
  b.push(`  const islands = Object.keys(__islandMap)`);
  b.push(`  if (islands.length === 0) return ''`);
  b.push(`  const loaders = islands.map(tag => {`);
  b.push(`    const modPath = __islandMap[tag]`);
  b.push(`    return '\\'' + tag + '\\': () => import(\\'' + modPath + '\\')'`);
  b.push(`  }).join(',\\n    ')`);
  b.push(`  return '<script type="module" data-kiss-hydrate>\\n' +`);
  b.push(`    '(function() {\\n' +`);
  b.push(`    '  const loaders = {\\n    ' + loaders + '\\n  };\\n' +`);
  b.push(`    '  async function hydrate(tag, loader) {\\n' +`);
  b.push(
    `    '    try { const m = await loader(); if (m.default && !customElements.get(tag)) customElements.define(tag, m.default); }\\n' +`,
  );
  b.push(
    `    '    catch(e) { console.warn("[KISS] Island <"+tag+"> hydration failed:", e); }\\n' +`,
  );
  b.push(`    '  }\\n' +`);
  b.push(
    `    '  if ("requestIdleCallback" in window) requestIdleCallback(() => { for (const [t,l] of Object.entries(loaders)) hydrate(t,l); });\\n' +`,
  );
  b.push(
    `    '  else setTimeout(() => { for (const [t,l] of Object.entries(loaders)) hydrate(t,l); }, 200);\\n' +`,
  );
  b.push(`    '})();\\n' +`);
  b.push(`    '</script>'`);
  b.push(`}`);

  // Document wrapper
  b.push(`function wrapDocument(body) {`);
  b.push(`  const hydrate = generateHydrationScript()`);
  b.push(`  const headExtras = ${JSON.stringify(desc.document.headExtras)}`);
  b.push(
    `  return '<!DOCTYPE html>\\n<html lang="${desc.document.lang}">\\n<head>\\n  <meta charset="UTF-8">\\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\\n  <title>${desc.document.title}</title>\\n' + headExtras + '\\n</head>\\n<body>\\n' + body + '\\n' + hydrate + '\\n</body>\\n</html>'`,
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
  const BT = '\x60'; // backtick: `
  const DI = '\x24{'; // ${
  const DC = '}'; // }
  b.push('// SSR helper: render a custom element tag to HTML string');
  b.push('async function __ssr(tag) {');
  b.push(
    '  const tpl = html' + BT + DI + 'unsafeHTML(' + BT + '<' + DI + 'tag' + DC + '></' + DI +
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
