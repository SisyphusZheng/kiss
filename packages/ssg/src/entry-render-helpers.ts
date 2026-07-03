/**
 * @openelement/ssg - Entry renderer helper functions
 *
 * Shared code-generation helper functions used by entry-renderer.ts
 * and its sub-modules (entry-render-runtime.ts, entry-render-ssg.ts).
 *
 * Each function generates a fragment of the virtual Hono entry module.
 */

import type {
  ApiRouteDecl,
  CorsOriginConfig,
  ImportDecl,
  MiddlewareDecl,
  PageRouteDecl,
  RendererDecl,
} from '@openelement/protocol/ssg';
import { quoteGeneratedJavaScriptStringLiteral } from './codegen-literals.ts';

export function renderImport(imp: ImportDecl): string {
  const names = imp.alias ? `${imp.names[0]} as ${imp.alias}` : imp.names.join(', ');
  return `import { ${names} } from '${imp.from}'`;
}

export function routeTagNameExpr(varName: string, fallback: string): string {
  void varName;
  return JSON.stringify(fallback);
}

export function pageDefinitionExpr(varName: string): string {
  return `(${varName}.default?.openElementPage || {})`;
}

export function routeMetaExpr(varName: string): string {
  const pageDef = pageDefinitionExpr(varName);
  return `({ ...(${pageDef}.route !== undefined ? { route: ${pageDef}.route } : {}), ...(${pageDef}.head?.title !== undefined ? { title: ${pageDef}.head.title } : {}), ...(${pageDef}.head?.description !== undefined ? { description: ${pageDef}.head.description } : {}) })`;
}

export function routeRevalidateExpr(varName: string): string {
  const pageDef = pageDefinitionExpr(varName);
  return `(${pageDef}.renderIntent?.revalidate ?? false)`;
}

export function jsStringLiteral(value: string): string {
  return quoteGeneratedJavaScriptStringLiteral(value);
}

/** Generate a POST handler for a page route (form action handling). */
export function renderActionRoute(
  lines: string[],
  route: PageRouteDecl,
  renderers: RendererDecl[],
  docConfig: {
    title: string;
    lang: string;
    headExtras: string;
    allowHeadExtrasScripts: boolean;
  },
  isSSG: boolean,
): void {
  const matchingRenderers = renderers.filter((r) => {
    if (r.scope === '/') return true;
    return route.path === r.scope || route.path.startsWith(r.scope + '/');
  });

  const pathLiteral = jsStringLiteral(route.path);
  const tagNameExpr = routeTagNameExpr(route.varName, route.tagName);
  const pageDefExpr = pageDefinitionExpr(route.varName);
  const routeMeta = routeMetaExpr(route.varName);
  const routeContext = `{ path: ${JSON.stringify(route.path)}, filePath: ${
    JSON.stringify(route.filePath)
  } }`;
  const headExtrasExpr = isSSG ? '__headExtras' : JSON.stringify(docConfig.headExtras);

  lines.push(`// Action POST: ${route.path} (${route.filePath})`);
  lines.push(`app.post(${pathLiteral}, async (c) => {`);
  lines.push(`  let __tag = ${tagNameExpr}`);
  lines.push(`  let __page = ${pageDefExpr}`);
  lines.push(`  let __params = {}`);
  lines.push(`  let __routeMeta = ${routeMeta}`);
  lines.push(`  const __routeContext = ${routeContext}`);
  lines.push(`  try {`);
  lines.push(`    __params = c.req.param() || {}`);
  lines.push(`    const __loadContext = {`);
  lines.push(`      params: __params,`);
  lines.push(`      request: c.req.raw,`);
  lines.push(`      env: c.env || {},`);
  lines.push(
    `      platform: (() => { try { return c.executionCtx } catch { return undefined } })(),`,
  );
  lines.push(`      route: __routeContext,`);
  lines.push(`    }`);
  lines.push(
    `    const __data = typeof ${route.varName}.loader === "function" ? await ${route.varName}.loader(__loadContext) : undefined`,
  );
  lines.push(`    const __formData = await c.req.parseBody()`);
  lines.push(`    const __actionCtx = { ...__loadContext, formData: __formData }`);
  lines.push(
    `    const __actionData = typeof ${route.varName}.action === "function" ? await ${route.varName}.action(__actionCtx) : undefined`,
  );
  lines.push(
    `    let node = jsx(__tag, { ...__params, data: __data, __openElementActionData: __actionData, __openElementParams: __params, __openElementRequest: c.req.raw, __openElementRoute: __routeContext, __openElementMeta: __routeMeta })`,
  );
  lines.push(``);

  if (matchingRenderers.length > 0) {
    lines.push(`    // Renderer tree wrapping (outer -> inner)`);
    for (const renderer of matchingRenderers) {
      lines.push(`    node = await ${renderer.varName}.default.wrap(node, c)`);
    }
  }
  lines.push(
    `    const content = await __renderAppShell(node, c.req.path || ${
      JSON.stringify(route.path)
    }, { routeMeta: __routeMeta })`,
  );
  lines.push(`    return c.html(wrapInDocument(content, {`);
  lines.push(`      title: __page.head?.title || ${JSON.stringify(docConfig.title)},`);
  lines.push(`      lang: ${JSON.stringify(docConfig.lang)},`);
  lines.push(`      meta: { description: __page.head?.description, tags: __page.head?.meta },`);
  lines.push(`      headExtras: ${headExtrasExpr},`);
  lines.push(`      dangerouslyHeadFragments: __page.head?.dangerouslyHeadFragments || [],`);
  lines.push(`      allowHeadExtrasScripts: ${JSON.stringify(docConfig.allowHeadExtrasScripts)},`);
  lines.push(`      cspNonce: c.get('cspNonce'),`);
  lines.push(`    }))`);
  lines.push(`  } catch (err) {`);
  lines.push(`    if (__isOpenElementRedirect(err)) {`);
  lines.push(`      return c.redirect(err.location, err.status)`);
  lines.push(`    }`);
  lines.push(`    if (__isOpenElementNotFound(err)) {`);
  lines.push(
    `      return c.html(wrapInDocument(__statusHtml("404 Not Found", err.message || "Not Found"), {`,
  );
  lines.push(`        title: "404 Not Found",`);
  lines.push(`        lang: ${JSON.stringify(docConfig.lang)},`);
  lines.push(`        headExtras: ${headExtrasExpr},`);
  lines.push(
    `        allowHeadExtrasScripts: ${JSON.stringify(docConfig.allowHeadExtrasScripts)},`,
  );
  lines.push(`        cspNonce: c.get('cspNonce'),`);
  lines.push(`      }), 404)`);
  lines.push(`    }`);
  lines.push(
    `    console.error('[openElement] Action POST failed for ' + ${pathLiteral} + ':', err)`,
  );
  lines.push(`    if (import.meta.env.PROD) {`);
  lines.push(`      return c.html('<h1>500 Internal Server Error</h1>', 500)`);
  lines.push(`    } else {`);
  lines.push(`      const safeErr = escapeHtml(String(err.stack || err))`);
  lines.push(`      return c.html('<h1>500</h1><pre>' + safeErr + '</pre>', 500)`);
  lines.push(`    }`);
  lines.push(`  }`);
  lines.push(`})`);
  lines.push('');
}

/** Generate the route-to-module map for /_data endpoint. */
export function renderDataRouteMap(
  lines: string[],
  pageRoutes: PageRouteDecl[],
): void {
  lines.push('// Route-to-module map for /_data endpoint (SPA client navigation)');
  lines.push('const __dataRouteMap = {');
  for (const r of pageRoutes) {
    lines.push(`  ${JSON.stringify(r.path)}: ${r.varName},`);
  }
  lines.push('};');
  lines.push('');
}

/** Generate the /_data GET endpoint for SPA navigation data fetching. */
export function renderDataEndpoint(lines: string[]): void {
  lines.push('// /_data endpoint - returns JSON loader data for SPA navigation');
  lines.push(`app.get('/_data', async (c) => {`);
  lines.push(`  const routePath = c.req.query('route');`);
  lines.push(`  if (!routePath) return c.json({ error: 'Missing route query' }, 400);`);
  lines.push(`  const mod = __dataRouteMap[routePath];`);
  lines.push(`  if (!mod) return c.json({ error: 'Route not found' }, 404);`);
  lines.push(`  if (typeof mod.loader !== 'function') return c.json({ data: null });`);
  lines.push(`  try {`);
  lines.push(`    const loadContext = {`);
  lines.push(`      params: {},`);
  lines.push(`      request: c.req.raw,`);
  lines.push(`      env: c.env || {},`);
  lines.push(`      platform: undefined,`);
  lines.push(`      route: { path: routePath, filePath: '' },`);
  lines.push(`    };`);
  lines.push(`    const data = await mod.loader(loadContext);`);
  lines.push(`    return c.json({ data });`);
  lines.push(`  } catch (err) {`);
  lines.push(`    return c.json({ error: String(err) }, 500);`);
  lines.push(`  }`);
  lines.push(`})`);
  lines.push('');
}

function renderCorsOrigin(origin: CorsOriginConfig): string {
  if (typeof origin === 'object' && !Array.isArray(origin)) return origin.body;
  return JSON.stringify(origin);
}

const CORS_ALLOW =
  "allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], allowHeaders: ['Content-Type', 'Authorization'], credentials: true, maxAge: 86400";

export function renderMiddleware(lines: string[], mw: MiddlewareDecl): void {
  if (mw.comment) {
    lines.push(`// ${mw.comment}`);
  }

  switch (mw.kind) {
    case 'requestId':
      lines.push("app.use('*', requestId())");
      break;

    case 'logger':
      lines.push("app.use('*', honoLogger())");
      break;

    case 'cors': {
      const corsOrigin = mw.config?.corsOrigin;
      if (corsOrigin === '*' || (Array.isArray(corsOrigin) && corsOrigin.includes('*'))) {
        throw new Error(
          'CORS misconfiguration: origin "*" with credentials: true is invalid. ' +
            'Specify explicit origin(s) or set credentials: false.',
        );
      }
      if (corsOrigin !== undefined) {
        const originStr = renderCorsOrigin(corsOrigin);
        lines.push(
          `app.use('*', cors({ origin: ${originStr}, ${CORS_ALLOW} }))`,
        );
      } else {
        lines.push("app.use('*', cors({ origin: (origin) => {");
        lines.push(
          '  if (origin && /^https?:\\/\\/(localhost|127\\.0\\.0\\.1)(:\\d+)?$/.test(origin)) return origin',
        );
        lines.push('  // In production, set middleware.corsOrigin explicitly');
        lines.push('  return undefined');
        lines.push(`}, ${CORS_ALLOW} }))`);
      }
      break;
    }

    case 'securityHeaders':
      lines.push("app.use('*', secureHeaders())");
      break;

    case 'csp': {
      const cspConfig = mw.config?.csp;
      if (cspConfig) {
        const headerName = cspConfig.reportOnly
          ? 'Content-Security-Policy-Report-Only'
          : 'Content-Security-Policy';
        if (cspConfig.nonce) {
          const basePolicy: string = cspConfig.policy || '';
          const hasScriptSrc = /script-src/i.test(basePolicy);
          const policyTemplate = hasScriptSrc
            ? basePolicy.replace(
              /script-src\s+([^;]*)/i,
              "script-src 'nonce-NONCE_PLACEHOLDER' $1",
            )
            : basePolicy + "; script-src 'nonce-NONCE_PLACEHOLDER'";
          lines.push(
            `// CSP with auto-nonce: generates a per-request nonce and adds it to script tags`,
          );
          lines.push(`app.use('*', async (c, next) => {`);
          lines.push(`  const nonce = crypto.randomUUID().replace(/-/g, '')`);
          lines.push(`  c.set('cspNonce', nonce)`);
          lines.push(
            `  const policy = ${
              JSON.stringify(policyTemplate)
            }.replace('NONCE_PLACEHOLDER', nonce)`,
          );
          lines.push(`  await next()`);
          lines.push(`  c.header('${headerName}', policy)`);
          lines.push(`})`);
        } else {
          lines.push(`app.use('*', async (c, next) => {`);
          lines.push(`  await next()`);
          lines.push(
            `  c.header('${headerName}', ${JSON.stringify(cspConfig.policy)})`,
          );
          lines.push(`})`);
        }
      }
      break;
    }
  }

  lines.push('');
}

/**
 * Render an API route using Hono's standard app.route().
 */
export function renderApiRoute(lines: string[], route: ApiRouteDecl): void {
  lines.push(`// API: ${route.path} (${route.filePath})`);
  lines.push(
    `if (${route.varName}.default && typeof ${route.varName}.default.fetch === 'function') {`,
  );
  lines.push(`  app.route('${route.path}', ${route.varName}.default)`);
  lines.push(`} else if (typeof ${route.varName}.default === 'function') {`);
  lines.push(`  app.all('${route.path}', async (c) => {`);
  lines.push(`    return await ${route.varName}.default({`);
  lines.push(`      request: c.req.raw,`);
  lines.push(`      params: c.req.param() || {},`);
  lines.push(`      env: c.env || {},`);
  lines.push(`      platform: c.executionCtx,`);
  lines.push(`    })`);
  lines.push(`  })`);
  lines.push(`} else {`);
  lines.push(
    `  throw new Error('API route ${route.path} must default-export a Hono app or a function (ctx) => Response')`,
  );
  lines.push(`}`);
  lines.push('');
}

export function renderPageRoute(
  lines: string[],
  route: PageRouteDecl,
  renderers: RendererDecl[],
  docConfig: {
    title: string;
    lang: string;
    headExtras: string;
    allowHeadExtrasScripts: boolean;
  },
  isSSG: boolean,
): void {
  const matchingRenderers = renderers.filter((r) => {
    if (r.scope === '/') return true;
    return route.path === r.scope || route.path.startsWith(r.scope + '/');
  });

  lines.push(`// Page: ${route.path} (${route.filePath})`);
  const pathLiteral = jsStringLiteral(route.path);
  const tagNameExpr = routeTagNameExpr(route.varName, route.tagName);
  const pageDefExpr = pageDefinitionExpr(route.varName);
  const routeMeta = routeMetaExpr(route.varName);
  const routeContext = `{ path: ${JSON.stringify(route.path)}, filePath: ${
    JSON.stringify(route.filePath)
  } }`;
  lines.push(`// GET handler - renders the page with loader data`);
  lines.push(`app.get(${pathLiteral}, async (c) => {`);
  lines.push(`  let __tag = ${tagNameExpr}`);
  lines.push(`  let __page = ${pageDefExpr}`);
  lines.push(`  let __params = {}`);
  lines.push(`  let __routeMeta = ${routeMeta}`);
  lines.push(`  const __routeContext = ${routeContext}`);
  lines.push(`  try {`);
  lines.push(`    __params = c.req.param() || {}`);
  lines.push(`    const __loadContext = {`);
  lines.push(`      params: __params,`);
  lines.push(`      request: c.req.raw,`);
  lines.push(`      env: c.env || {},`);
  lines.push(
    `      platform: (() => { try { return c.executionCtx } catch { return undefined } })(),`,
  );
  lines.push(`      route: __routeContext,`);
  lines.push(`    }`);
  lines.push(
    `    const __data = typeof ${route.varName}.loader === "function" ? await ${route.varName}.loader(__loadContext) : undefined`,
  );
  lines.push(
    `    let node = jsx(__tag, { ...__params, data: __data, __openElementActionData: undefined, __openElementParams: __params, __openElementRequest: c.req.raw, __openElementRoute: __routeContext, __openElementMeta: __routeMeta })`,
  );
  lines.push('');

  const headExtrasExpr = isSSG ? '__headExtras' : JSON.stringify(docConfig.headExtras);

  if (matchingRenderers.length > 0) {
    lines.push(`    // Renderer tree wrapping (outer -> inner)`);
    for (const renderer of matchingRenderers) {
      lines.push(`    node = await ${renderer.varName}.default.wrap(node, c)`);
    }
  }
  lines.push(
    `    const content = await __renderAppShell(node, c.req.path || ${
      JSON.stringify(route.path)
    }, { routeMeta: __routeMeta })`,
  );
  lines.push(`    return c.html(wrapInDocument(content, {`);
  lines.push(`      title: __page.head?.title || ${JSON.stringify(docConfig.title)},`);
  lines.push(`      lang: ${JSON.stringify(docConfig.lang)},`);
  lines.push(`      meta: { description: __page.head?.description, tags: __page.head?.meta },`);
  lines.push(`      headExtras: ${headExtrasExpr},`);
  lines.push(`      dangerouslyHeadFragments: __page.head?.dangerouslyHeadFragments || [],`);
  lines.push(
    `      allowHeadExtrasScripts: ${JSON.stringify(docConfig.allowHeadExtrasScripts)},`,
  );
  lines.push(`      cspNonce: c.get('cspNonce'),`);
  lines.push(`    }))`);

  lines.push(`  } catch (err) {`);
  lines.push(`    if (__isOpenElementRedirect(err)) {`);
  lines.push(`      return c.redirect(err.location, err.status)`);
  lines.push(`    }`);
  lines.push(`    if (__isOpenElementNotFound(err)) {`);
  lines.push(
    `      return c.html(wrapInDocument(__statusHtml("404 Not Found", err.message || "Not Found"), {`,
  );
  lines.push(`        title: "404 Not Found",`);
  lines.push(`        lang: ${JSON.stringify(docConfig.lang)},`);
  lines.push(`        headExtras: ${headExtrasExpr},`);
  lines.push(
    `        allowHeadExtrasScripts: ${JSON.stringify(docConfig.allowHeadExtrasScripts)},`,
  );
  lines.push(`        cspNonce: c.get('cspNonce'),`);
  lines.push(`      }), 404)`);
  lines.push(`    }`);
  lines.push(`    if (typeof __page.error === "function") {`);
  lines.push(`      try {`);
  lines.push(
    `        const errorNode = jsx(__tag, { ...__params, __openElementParams: __params, __openElementError: err, __openElementRequest: c.req.raw, __openElementRoute: __routeContext, __openElementMeta: __routeMeta })`,
  );
  lines.push(
    `        const errorContent = await __renderAppShell(errorNode, c.req.path || ${
      JSON.stringify(route.path)
    }, { routeMeta: __routeMeta })`,
  );
  lines.push(`        return c.html(wrapInDocument(errorContent, {`);
  lines.push(`          title: __page.head?.title || ${JSON.stringify(docConfig.title)},`);
  lines.push(`          lang: ${JSON.stringify(docConfig.lang)},`);
  lines.push(`          meta: { description: __page.head?.description, tags: __page.head?.meta },`);
  lines.push(`          headExtras: ${headExtrasExpr},`);
  lines.push(`          dangerouslyHeadFragments: __page.head?.dangerouslyHeadFragments || [],`);
  lines.push(
    `          allowHeadExtrasScripts: ${JSON.stringify(docConfig.allowHeadExtrasScripts)},`,
  );
  lines.push(`          cspNonce: c.get('cspNonce'),`);
  lines.push(`        }), 500)`);
  lines.push(`      } catch (errorRenderFailure) {`);
  lines.push(
    `        console.error('[openElement] Route error renderer failed for ' + ${pathLiteral} + ':', errorRenderFailure)`,
  );
  lines.push(`      }`);
  lines.push(`    }`);
  lines.push(
    `    console.error('[openElement] Route render failed for ' + ${pathLiteral} + ':', err)`,
  );
  lines.push(`    if (import.meta.env.PROD) {`);
  lines.push(`      return c.html('<h1>500 Internal Server Error</h1>', 500)`);
  lines.push(`    } else {`);
  lines.push(`      const safeErr = escapeHtml(String(err.stack || err))`);
  lines.push(
    `      return c.html('<h1>500</h1><pre>' + safeErr + '</pre>', 500)`,
  );
  lines.push(`    }`);
  lines.push(`  }`);
  lines.push(`})`);
  lines.push('');
}
