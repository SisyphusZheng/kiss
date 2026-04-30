/**
 * @kissjs/core - Entry Renderer
 *
 * Pure function: EntryDescriptor → string (virtual module code).
 *
 * KISS Architecture (v0.3.0):
 * - API routes use Hono standard app.route() (not app.all + fetch transform)
 * - Hydration is handled by the client entry (built by Vite in Phase 2),
 *   which uses Lit's hydrate() from @lit-labs/ssr-client.
 *   No inline script in SSG HTML — the client entry is a Vite-built module
 *   referenced via <script type="module" src="...">.
 * - HTML document wrapping delegates to wrapInDocument from ssr-handler.ts
 *   (imported at runtime — single source of truth, no duplicate HTML logic)
 * - NO stripLitComments: <!--lit-part--> markers are ESSENTIAL for Lit hydration.
 *   Removing them breaks hydrate()'s ability to re-associate template
 *   expressions with DOM nodes, forcing client-render (destroying SSR output).
 */

import type {
  ApiRouteDecl,
  CorsOriginConfig,
  EntryDescriptor,
  ImportDecl,
  MiddlewareDecl,
  // MiddlewareScopeDecl,
  PageRouteDecl,
  RendererDecl,
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
        // v0.3.0: Tightened default — only allow localhost.
        // Production deployments MUST explicitly configure corsOrigin.
        // Returning '*' with credentials:true violates the Fetch spec.
        b.push("app.use('*', cors({ origin: (origin) => {");
        b.push(
          '  if (origin && /^https?:\\/\\/(localhost|127\\.0\\.0\\.1)(:\\d+)?$/.test(origin)) return origin',
        );
        b.push('  // In production, set middleware.corsOrigin explicitly');
        b.push('  return undefined');
        b.push(`}, ${CORS_ALLOW} }))`);
      }
      break;
    }

    case 'securityHeaders':
      b.push("app.use('*', secureHeaders())");
      break;

    case 'csp': {
      const cspConfig = mw.config?.csp;
      if (cspConfig) {
        const headerName = cspConfig.reportOnly
          ? 'Content-Security-Policy-Report-Only'
          : 'Content-Security-Policy';
        if (cspConfig.nonce) {
          // Build a policy template that uses NONCE_PLACEHOLDER, then at
          // runtime replace it with the actual nonce value.
          // This avoids the three bugs in the old string-concatenation approach:
          //   1. Missing closing quote on nonce value ('nonce-abc vs 'nonce-abc')
          //   2. Duplicate script-src directive (CSP ignores the second one)
          //   3. Resulting silent security bypass (nonce never takes effect)
          const basePolicy: string = cspConfig.policy || '';
          const hasScriptSrc = /script-src/i.test(basePolicy);
          const policyTemplate = hasScriptSrc
            ? basePolicy.replace(
              /script-src\s+([^;]*)/i,
              "script-src 'nonce-NONCE_PLACEHOLDER' $1",
            )
            : basePolicy + "; script-src 'nonce-NONCE_PLACEHOLDER'";
          b.push(
            `// CSP with auto-nonce: generates a per-request nonce and adds it to script tags`,
          );
          b.push(`app.use('*', async (c, next) => {`);
          b.push(`  const nonce = crypto.randomUUID().replace(/-/g, '')`);
          b.push(`  c.set('cspNonce', nonce)`);
          b.push(
            `  const policy = ${
              JSON.stringify(policyTemplate)
            }.replace('NONCE_PLACEHOLDER', nonce)`,
          );
          b.push(`  await next()`);
          b.push(`  c.header('${headerName}', policy)`);
          b.push(`})`);
        } else {
          b.push(`app.use('*', async (c, next) => {`);
          b.push(`  await next()`);
          b.push(`  c.header('${headerName}', ${JSON.stringify(cspConfig.policy)})`);
          b.push(`})`);
        }
      }
      break;
    }
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
  docConfig: { title: string; lang: string; headExtras: string },
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
  // NOTE: DO NOT strip <!--lit-part--> comments!
  // They are essential for Lit's hydrate() to re-associate template
  // expressions with DOM nodes. Removing them breaks hydration and
  // forces client-render (destroying SSR HTML and losing first-paint perf).
  b.push(`    const html = raw`);
  b.blank();

  // Wrap with renderers from outer to inner (v0.3.0)
  if (matchingRenderers.length > 0) {
    b.push(`    // Renderer wrapping (outer → inner)`);
    b.push(`    let wrapped = html`);
    for (const renderer of matchingRenderers) {
      b.push(`    wrapped = ${renderer.varName}.default.wrap(wrapped, c)`);
    }
    b.push(`    return c.html(wrapInDocument(wrapped, {`);
    b.push(`      title: ${JSON.stringify(docConfig.title)},`);
    b.push(`      lang: ${JSON.stringify(docConfig.lang)},`);
    b.push(`      headExtras: ${JSON.stringify(docConfig.headExtras)},`);
    b.push(`      cspNonce: c.get('cspNonce'),`);
    b.push(`    }))`);
  } else {
    b.push(`    return c.html(wrapInDocument(html, {`);
    b.push(`      title: ${JSON.stringify(docConfig.title)},`);
    b.push(`      lang: ${JSON.stringify(docConfig.lang)},`);
    b.push(`      headExtras: ${JSON.stringify(docConfig.headExtras)},`);
    b.push(`      cspNonce: c.get('cspNonce'),`);
    b.push(`    }))`);
  }

  b.push(`  } catch (err) {`);
  // Use import.meta.env.PROD for runtime environment detection.
  // process.env.NODE_ENV was previously evaluated at code-generation time
  // (build machine), which meant CI without NODE_ENV=production would leak
  // stack traces in production.
  b.push(`    if (import.meta.env.PROD) {`);
  b.push(`      return c.html('<h1>500 Internal Server Error</h1>', 500)`);
  b.push(`    } else {`);
  b.push(
    `      const safeErr = String(err.stack || err).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')`,
  );
  b.push(`      return c.html('<h1>500</h1><pre>' + safeErr + '</pre>', 500)`);
  b.push(`    }`);
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
 * v0.3.0: Hydration is handled by the Vite-built client entry (Phase 2),
 * not by inline scripts in SSG HTML. The client entry:
 *   1. Imports and registers all island custom elements
 *   2. Imports hydrate() from @lit-labs/ssr-client (bundled by Vite)
 *   3. Waits for customElements.whenDefined()
 *   4. Calls hydrate(el) on elements with defer-hydration
 *   5. Removes defer-hydration attribute
 *
 * SSR output preserves <!--lit-part--> comments for hydration.
 * No inline scripts, no bare module imports — browser-safe.
 *
 * The client script <script> tag is injected by build-ssg.ts (Phase 3)
 * after reading the Vite client build manifest.
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

  // --- Island hydration (build-time known list) ---
  // This map is used by the SSR helper to know which custom elements
  // to render. The CLIENT-SIDE hydration is handled by the client entry
  // (built separately by Vite in Phase 2).
  const islandLookup: Record<string, string> = {};
  for (const island of desc.islands) {
    islandLookup[island.tagName] = island.modulePath;
  }

  b.push(`// Known islands (determined at build time by scanning islandsDir)`);
  b.push(`const __islandMap = ${JSON.stringify(islandLookup)}`);
  b.blank();

  // --- Document wrapper ---
  // Uses wrapInDocument from ssr-handler.ts (single source of truth).
  // Import via @kissjs/core — during SSR build, Vite resolves this to
  // the local source via resolve.alias.
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

  // --- Register page components in SSR customElements registry ---
  // This is essential for Lit SSR's renderValue to find and render Shadow DOM.
  // Without registration, <unsafeHTML> produces bare tags without DSD content.
  // Each SSR route module exports { default: ComponentClass, tagName: string }.
  for (const route of desc.pageRoutes) {
    const tag = `\${${route.varName}.tagName || '${route.defaultTagName}'}`;
    b.push(`if (!customElements.get(${route.varName}.tagName || '${route.defaultTagName}')) {`);
    b.push(
      `  customElements.define(${route.varName}.tagName || '${route.defaultTagName}', ${route.varName}.default)`,
    );
    b.push(`}`);
  }
  b.blank();

  // --- SSR helper ---
  // unsafeHTML must be in expression position (NOT in element position <${...}>),
  // otherwise Lit throws "Unexpected final partIndex" error.
  // tag validation: only hyphenated Custom Element names are valid.
  // defer-hydration: marks SSR output for Lit hydration (handled by client entry).
  //
  // Components MUST be registered via customElements.define() before SSR rendering,
  // otherwise Lit SSR's renderValue treats them as plain HTML (no Shadow DOM output).
  // Registration is done above for all page route components.
  //
  // IMPORTANT: The SSR output includes <!--lit-part--> comments.
  // DO NOT strip them — they are essential for Lit's hydrate() to work.
  const BACKTICK = '\x60'; // backtick: `
  const DOLLAR_BRACE = '\x24{'; // ${
  const CLOSE_BRACE = '}'; // }
  b.push('// SSR helper: render a custom element tag to HTML string');
  b.push('// Outputs <tag defer-hydration> with Shadow DOM for the client to hydrate');
  b.push('async function __ssr(tag) {');
  b.push('  // Validate tag name — must be a valid Custom Element (contains hyphen)');
  b.push('  if (!tag || !tag.includes("-")) {');
  b.push(
    '    throw new Error("[KISS] Invalid custom element tag: " + String(tag) + ". Must contain a hyphen.")',
  );
  b.push('  }');
  b.push(
    '  const tpl = html' + BACKTICK + DOLLAR_BRACE + 'unsafeHTML(' + BACKTICK + '<' + DOLLAR_BRACE +
      'tag' + CLOSE_BRACE +
      ' defer-hydration></' + DOLLAR_BRACE +
      'tag' + CLOSE_BRACE + '>' + BACKTICK + ')' + CLOSE_BRACE + BACKTICK,
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
  };
  for (const route of desc.pageRoutes) {
    renderPageRoute(b, route, desc.renderers, docConfig);
  }

  // --- Export ---
  b.push('export default app');

  return b.toString();
}
