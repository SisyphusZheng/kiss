/**
 * @kissjs/core - Entry Renderer
 *
 * Pure function: EntryDescriptor → string (virtual module code).
 *
 * KISS Architecture (v0.3.0):
 * - API routes use Hono standard app.route() (not app.all + fetch transform)
 * - Hydration uses generateHydrationScript from island-transform.ts
 *   (single source of truth — self-contained, no bare module imports)
 * - HTML document wrapping delegates to wrapInDocument from ssr-handler.ts
 *   (imported at runtime — single source of truth, no duplicate HTML logic)
 * - No duplicate implementations — single source of truth
 */

import type {
  ApiRouteDecl,
  CorsOriginConfig,
  EntryDescriptor,
  ImportDecl,
  MiddlewareDecl,
  MiddlewareScopeDecl,
  PageRouteDecl,
  RendererDecl,
} from './entry-descriptor.js';
import { generateHydrationScript } from './island-transform.js';

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
        // v0.3.0: Tightened default — only allow localhost.
        // Production deployments MUST explicitly configure corsOrigin.
        // Returning '*' with credentials:true violates the Fetch spec.
        b.push("app.use('*', cors({ origin: (origin) => {");
        b.push('  if (origin && /^http:\\/\\/localhost(:\\d+)?$/.test(origin)) return origin');
        b.push('  // In production, set middleware.corsOrigin explicitly');
        b.push('  return undefined');
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

function renderPageRoute(
  b: CodeBuilder,
  route: PageRouteDecl,
  renderers: RendererDecl[],
  docConfig: { title: string; lang: string; headExtras: string; hydrateScriptVar: string },
): void {
  // Find renderers whose scope matches this route's path prefix
  const matchingRenderers = renderers.filter((r) => {
    if (r.scope === '/') return true;
    return route.path === r.scope || route.path.startsWith(r.scope + '/');
  });

  b.push(`// Page: ${route.path} (${route.filePath})`);
  b.push(`app.get('${route.path}', async (c) => {`);
  b.push(`  try {`);
  b.push(`    const tag = ${route.varName}.tagName || '${route.defaultTagName}'`);
  b.push(`    const raw = await __ssr(tag)`);
  b.push(`    const clean = stripLitComments(raw)`);

  // Wrap with renderers from outer to inner (v0.3.0)
  if (matchingRenderers.length > 0) {
    b.push(`    // Renderer wrapping (outer → inner)`);
    b.push(`    let wrapped = clean`);
    for (const renderer of matchingRenderers) {
      b.push(`    wrapped = ${renderer.varName}.default.wrap(wrapped, c)`);
    }
    b.push(`    return c.html(wrapInDocument(wrapped, {`);
    b.push(`      title: ${JSON.stringify(docConfig.title)},`);
    b.push(`      lang: ${JSON.stringify(docConfig.lang)},`);
    b.push(`      hydrateScript: ${docConfig.hydrateScriptVar},`);
    b.push(`      headExtras: ${JSON.stringify(docConfig.headExtras)},`);
    b.push(`    }))`);
  } else {
    b.push(`    return c.html(wrapInDocument(clean, {`);
    b.push(`      title: ${JSON.stringify(docConfig.title)},`);
    b.push(`      lang: ${JSON.stringify(docConfig.lang)},`);
    b.push(`      hydrateScript: ${docConfig.hydrateScriptVar},`);
    b.push(`      headExtras: ${JSON.stringify(docConfig.headExtras)},`);
    b.push(`    }))`);
  }

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
 * delegates to wrapInDocument (ssr-handler.ts) — single source of truth.
 *
 * Hydration lifecycle:
 *   1. SSR outputs `<tag defer-hydration>` (see __ssr helper)
 *   2. Client hydration script processes DSD templates inline
 *   3. Then removes defer-hydration attribute
 *   This creates a closed loop: defer → hydrate → removeAttribute
 *   No external module imports — browser-safe out of the box.
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

  // --- Hydration script ---
  // Single source of truth: generateHydrationScript from island-transform.ts
  // This function produces a complete <script> tag that:
  // 1. Contains inline hydrate() — no external module imports (browser-safe)
  // 2. Loads island modules via dynamic import()
  // 3. Waits for customElements.whenDefined()
  // 4. Hydrates SSR output (DSD template processing + removeAttribute)
  // 5. Applies the configured strategy (eager/lazy/idle/visible)
  const hydrationScript = generateHydrationScript(
    desc.islands,
    desc.hydrationStrategy || 'lazy',
  );
  b.push(`// Hydration script — generated by generateHydrationScript() in island-transform.ts`);
  b.push(`// Self-contained: inline hydrate(), no bare module imports, works in browsers`);
  b.push(`const __hydrationScript = ${JSON.stringify(hydrationScript)}`);
  b.blank();

  // --- Document wrapper ---
  // Uses wrapInDocument from ssr-handler.ts (single source of truth).
  // Import via @kissjs/core — during SSR build, Vite resolves this to
  // the local source via resolve.alias (see index.ts ssgPlugin).
  // This eliminates the duplicate HTML wrapping that was previously inlined.
  b.push(`import { wrapInDocument } from '@kissjs/core';`);
  b.blank();

  // --- Route module imports ---
  for (const route of [...desc.apiRoutes, ...desc.pageRoutes]) {
    b.push(`import * as ${route.varName} from '${route.importPath}'`);
  }
  // Import special file modules (v0.3.0)
  for (const renderer of desc.renderers) {
    b.push(`import * as ${renderer.varName} from '${renderer.importPath}'`);
  }
  for (const mwScope of desc.middlewareScopes) {
    b.push(`import * as ${mwScope.varName} from '${mwScope.importPath}'`);
  }
  b.blank();

  // --- SSR helper ---
  // unsafeHTML must be in expression position (NOT in element position <${...}>),
  // otherwise Lit throws "Unexpected final partIndex" error.
  // tag validation: only hyphenated Custom Element names are valid.
  // defer-hydration: marks SSR output for Lit hydration (see hydration script above).
  const BT = '\x60'; // backtick: `
  const DI = '\x24{'; // ${
  const DC = '}'; // }
  b.push('// SSR helper: render a custom element tag to HTML string');
  b.push('// Outputs <tag defer-hydration> so the hydration script can find and hydrate it');
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

  // --- Middleware scopes (v0.3.0: _middleware.ts files) ---
  for (const mwScope of desc.middlewareScopes) {
    b.push(`// Middleware scope: ${mwScope.scope} (${mwScope.importPath})`);
    b.push(`app.use('${mwScope.scope}/*', ${mwScope.varName}.default)`);
    b.blank();
  }

  // --- API routes ---
  for (const route of desc.apiRoutes) {
    renderApiRoute(b, route);
  }

  // --- Page routes ---
  const docConfig = {
    title: desc.document.title,
    lang: desc.document.lang,
    headExtras: desc.document.headExtras,
    hydrateScriptVar: '__hydrationScript',
  };
  for (const route of desc.pageRoutes) {
    renderPageRoute(b, route, desc.renderers, docConfig);
  }

  // --- Export ---
  b.push('export default app');

  return b.toString();
}
