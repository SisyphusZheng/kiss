/**
 * ./index.ts - Entry renderer helper functions
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
} from '../protocol/ssg.ts';
import { quoteGeneratedJavaScriptStringLiteral } from './codegen-literals.ts';

export function renderImport(imp: ImportDecl): string {
  const names = imp.alias ? `${imp.names[0]} as ${imp.alias}` : imp.names.join(', ');
  return `import { ${names} } from '${imp.from}'`;
}

export function routeTagNameExpr(varNameOrFallback: string, fallback?: string): string {
  const tagName = fallback ?? varNameOrFallback;
  return jsStringLiteral(tagName);
}

export function pageDefinitionExpr(varName: string): string {
  return `__pageDefinition(${varName})`;
}

export function routeMetaExpr(varName: string): string {
  return `__routeMeta(${varName})`;
}

export function routeRevalidateExpr(varName: string): string {
  const pageDef = pageDefinitionExpr(varName);
  return `(${pageDef}.renderIntent?.revalidate ?? false)`;
}

export function jsStringLiteral(value: string): string {
  return quoteGeneratedJavaScriptStringLiteral(value);
}

/**
 * Renderer scope matching, case-sensitive (URL paths are case-sensitive and
 * Hono routes match case-sensitively). Used at codegen time by
 * renderRouteHandler; the runtime __matchingRenderers function emitted by
 * renderMatchingRenderersFn() must mirror these semantics exactly.
 */
export function rendererScopeMatches(routePath: string, scope: string): boolean {
  if (scope === '/') return true;
  return routePath === scope || routePath.startsWith(scope + '/');
}

/**
 * Emit the runtime __matchingRenderers(routePath) function for the SSG
 * renderRoute. Semantics mirror rendererScopeMatches() — keep them in sync.
 */
export function renderMatchingRenderersFn(lines: string[], renderers: RendererDecl[]): void {
  lines.push('function __matchingRenderers(routePath) {');
  lines.push('  const renderers = [];');
  for (const renderer of renderers) {
    if (renderer.scope === '/') {
      lines.push(`  renderers.push(${renderer.varName}.default);`);
    } else {
      lines.push(
        `  if (routePath === ${jsStringLiteral(renderer.scope)} || routePath.startsWith(${
          jsStringLiteral(renderer.scope + '/')
        })) renderers.push(${renderer.varName}.default);`,
      );
    }
  }
  lines.push('  return renderers;');
  lines.push('}');
}

/** Props object passed to the page jsx() call (page GET, action POST and SSG renderRoute). */
export function pagePropsExpr(options: {
  paramsExpr: string;
  dataExpr: string;
  actionDataExpr: string;
  requestExpr: string;
  routeExpr: string;
  metaExpr: string;
}): string {
  const { paramsExpr, dataExpr, actionDataExpr, requestExpr, routeExpr, metaExpr } = options;
  return `{ ...${paramsExpr}, data: ${dataExpr}, __openElementActionData: ${actionDataExpr}, __openElementParams: ${paramsExpr}, __openElementRequest: ${requestExpr}, __openElementRoute: ${routeExpr}, __openElementMeta: ${metaExpr} }`;
}

/** wrapInDocument() options object shared by page handlers and the SSG renderRoute. */
export function documentWrapOptionsLines(options: {
  /** Expression yielding the page definition (head source), e.g. `__page`. */
  pageExpr: string;
  titleExpr: string;
  langExpr: string;
  headExtrasExpr: string;
  allowHeadExtrasScripts: boolean;
  /** Emit the per-request CSP nonce line (Hono handlers only). */
  cspNonce?: boolean;
}): string[] {
  const lines = [
    `title: ${options.titleExpr},`,
    `lang: ${options.langExpr},`,
    `meta: { description: ${options.pageExpr}.head?.description, tags: ${options.pageExpr}.head?.meta },`,
    `headExtras: ${options.headExtrasExpr},`,
    `dangerouslyHeadFragments: ${options.pageExpr}.head?.dangerouslyHeadFragments || [],`,
    `allowHeadExtrasScripts: ${JSON.stringify(options.allowHeadExtrasScripts)},`,
  ];
  if (options.cspNonce) lines.push(`cspNonce: c.get('cspNonce'),`);
  return lines;
}

export interface RouteHandlerDocConfig {
  title: string;
  lang: string;
  headExtras: string;
  allowHeadExtrasScripts: boolean;
}

export interface RenderRouteHandlerOptions {
  method: 'get' | 'post';
  route: PageRouteDecl;
  renderers: RendererDecl[];
  docConfig: RouteHandlerDocConfig;
  isSSG: boolean;
}

/** Generate a Hono route handler for a page route (GET) or its action (POST). */
export function renderRouteHandler(
  lines: string[],
  { method, route, renderers, docConfig, isSSG }: RenderRouteHandlerOptions,
): void {
  const matchingRenderers = renderers.filter((r) => rendererScopeMatches(route.path, r.scope));

  const pathLiteral = jsStringLiteral(route.path);
  const tagNameExpr = routeTagNameExpr(route.tagName);
  const pageDefExpr = pageDefinitionExpr(route.varName);
  const routeMeta = routeMetaExpr(route.varName);
  const routeContext = `{ path: ${jsStringLiteral(route.path)}, filePath: ${
    jsStringLiteral(route.filePath)
  } }`;
  const headExtrasExpr = isSSG ? '__headExtras' : jsStringLiteral(docConfig.headExtras);
  const isAction = method === 'post';

  lines.push(`// ${isAction ? 'Action POST' : 'Page'}: ${route.path} (${route.filePath})`);
  if (!isAction) {
    lines.push('// GET handler - renders the page with loader data');
  }
  if (isAction) {
    // ADR-0121 (#568): conservative default body limit on action POSTs;
    // larger uploads belong on API routes with explicit limits.
    lines.push(
      `app.post(${pathLiteral}, __bodyLimit({ maxSize: 10 * 1024 * 1024, onError: (c) => { c.header('Cache-Control', 'no-store'); c.header('Vary', __actionFetchHeader); return c.text('Payload Too Large', 413); } }), async (c) => {`,
    );
  } else {
    lines.push(`app.get(${pathLiteral}, async (c) => {`);
  }
  lines.push(`  let __tag = ${tagNameExpr}`);
  lines.push(`  let __page = ${pageDefExpr}`);
  lines.push(`  let __params = {}`);
  lines.push(`  let __routeMetaValue = ${routeMeta}`);
  lines.push(`  const __routeContext = ${routeContext}`);
  // ADR-0121 section 6 (#550): request-time responses are never cacheable;
  // the POST endpoint is negotiated by the framework action header.
  lines.push(`  c.header('Cache-Control', 'no-store');`);
  if (isAction) {
    lines.push(`  c.header('Vary', __actionFetchHeader);`);
  }
  if (isAction) {
    // Declared outside try so the catch can branch on the fetch path without
    // hitting a TDZ error when the action block never ran.
    lines.push(`  let __isFetch = false;`);
  }
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
  if (!isAction) {
    lines.push(
      `    const __data = typeof ${route.varName}.loader === "function" ? await ${route.varName}.loader(__loadContext) : undefined`,
    );
  }

  if (isAction) {
    // ADR-0120 action protocol (0.42.0-alpha.2), hardened by ADR-0121:
    // - named actions: ?/name selects module.actions[name] (SvelteKit shape),
    //   with an own-key lookup so prototype members are never callable;
    // - the action runs BEFORE the loader so a mutation never renders stale
    //   data (revalidation invariant);
    // - fail() returns take the 422 re-render channel with the failure data
    //   echoed; everything else succeeds;
    // - a successful non-GET action never answers 200 with a rendered page:
    //   303 back to the route (PRG, action marker stripped), or an
    //   ActionResult for fetch callers; a returned Response is a contract
    //   violation, not a response.
    lines.push(`    const __url = new URL(c.req.url);`);
    lines.push(
      `    const __actionName = (() => { for (const key of __url.searchParams.keys()) { if (key.startsWith('/')) return key.slice(1); } return undefined; })();`,
    );
    lines.push(
      `    const __namedActions = (typeof ${route.varName}.actions === 'object' && ${route.varName}.actions !== null) ? ${route.varName}.actions : {};`,
    );
    // ADR-0121 (#542): own-key lookup — ?/constructor and other prototype
    // members are never callable as actions.
    lines.push(
      `    const __actionFn = __actionName !== undefined ? (Object.prototype.hasOwnProperty.call(__namedActions, __actionName) ? __namedActions[__actionName] : undefined) : (typeof ${route.varName}.action === 'function' ? ${route.varName}.action : undefined);`,
    );
    // ADR-0121 section 1 (#540): one header, two values — 'true' selects the
    // ActionResult JSON channel; 'enhance' marks the built-in morph client
    // (HTML responses identical to the no-JS path).
    lines.push(`    const __actionHeader = c.req.header(__actionFetchHeader);`);
    lines.push(`    __isFetch = __actionHeader === 'true';`);
    // #611 / ADR-0121 §12 (amended): default same-origin CSRF floor for
    // browser POSTs. Non-browser clients that omit Origin and Sec-Fetch-Site
    // are allowed. Opt out via runtime env on the request context:
    // c.env.OPEN_ELEMENT_DISABLE_CSRF === '1' (Workers/Node bindings).
    lines.push(`    {`);
    lines.push(
      `      const __csrfOff = __loadContext.env && __loadContext.env.OPEN_ELEMENT_DISABLE_CSRF === '1';`,
    );
    lines.push(`      if (!__csrfOff) {`);
    lines.push(`        const __origin = c.req.header('origin');`);
    lines.push(`        const __sfs = (c.req.header('sec-fetch-site') || '').toLowerCase();`);
    lines.push(`        let __cross = __sfs === 'cross-site';`);
    lines.push(
      `        if (!__cross && __origin) { try { __cross = new URL(__origin).origin !== new URL(c.req.url).origin; } catch { __cross = true; } }`,
    );
    lines.push(`        if (__cross) {`);
    lines.push(
      `          if (__isFetch) return c.json({ type: 'error', status: 403, error: { message: 'Cross-site form submission rejected' } }, 403);`,
    );
    lines.push(`          return c.text('Forbidden', 403);`);
    lines.push(`        }`);
    lines.push(`      }`);
    lines.push(`    }`);
    lines.push(`    if (typeof __actionFn !== 'function') {`);
    lines.push(
      `      const __noActionMessage = __actionName !== undefined ? 'No action named "' + __actionName + '" on this route.' : 'This route does not accept submissions.';`,
    );
    // ADR-0121 section 5 (#549): fetch callers always receive ActionResult
    // JSON — the two channels never diverge in shape.
    lines.push(`      if (__isFetch) {`);
    lines.push(
      `        return c.json({ type: 'error', status: 404, error: { message: __noActionMessage } }, 404);`,
    );
    lines.push(`      }`);
    lines.push(
      `      return c.html(wrapInDocument(__statusHtml('404 Not Found', __noActionMessage), { title: '404 Not Found', lang: ${
        jsStringLiteral(docConfig.lang)
      }, headExtras: ${headExtrasExpr}, allowHeadExtrasScripts: ${
        JSON.stringify(docConfig.allowHeadExtrasScripts)
      }, cspNonce: c.get('cspNonce') }), 404);`,
    );
    lines.push(`    }`);
    lines.push(`    let __formData;`);
    // ADR-0121 (#581): an unparseable body is a client error, not a 500.
    lines.push(`    try {`);
    lines.push(`      __formData = await c.req.raw.formData();`);
    lines.push(`    } catch {`);
    lines.push(`      if (__isFetch) {`);
    lines.push(
      `        return c.json({ type: 'error', status: 400, error: { message: 'Could not parse the form body.' } }, 400);`,
    );
    lines.push(`      }`);
    lines.push(
      `      return c.html(wrapInDocument(__statusHtml('400 Bad Request', 'Could not parse the form body.'), { title: '400 Bad Request', lang: ${
        jsStringLiteral(docConfig.lang)
      }, headExtras: ${headExtrasExpr}, allowHeadExtrasScripts: ${
        JSON.stringify(docConfig.allowHeadExtrasScripts)
      }, cspNonce: c.get('cspNonce') }), 400);`,
    );
    lines.push(`    }`);
    lines.push(
      `    const __actionResult = await __actionFn({ ...__loadContext, formData: __formData });`,
    );
    // ADR-0121 section 2 (#541): actions must not return a Response — the
    // return channel is data or fail(), the redirect channel is redirect().
    // A returned Response used to bypass every status rule; it is now a
    // contract violation on both channels.
    lines.push(`    if (__actionResult instanceof Response) {`);
    lines.push(
      `      throw new Error('[openElement] Actions must not return a Response object; return data, fail(status, data), or throw redirect() (ADR-0121).');`,
    );
    lines.push(`    }`);
    // ADR-0121 section 4 (#548): the default PRG target strips the ?/name
    // action marker; all other query parameters are preserved.
    lines.push(`    const __prgParams = new URLSearchParams(__url.search);`);
    lines.push(
      `    for (const key of [...__prgParams.keys()]) { if (key.startsWith('/')) __prgParams.delete(key); }`,
    );
    lines.push(`    const __prgSearch = __prgParams.toString();`);
    lines.push(
      `    const __prgTarget = __url.pathname + (__prgSearch ? '?' + __prgSearch : '');`,
    );
    lines.push(`    if (__isFetch) {`);
    lines.push(`      if (__isActionFailure(__actionResult)) {`);
    lines.push(
      `        return c.json({ type: 'failure', status: __actionResult.status, data: __actionResult.data }, __actionResult.status);`,
    );
    lines.push(`      }`);
    // ADR-0121 section 3: HTTP 200 carrying a data message, not an HTTP
    // redirect (fetch would follow a 3xx and the JSON would be unreadable).
    lines.push(
      `      return c.json({ type: 'redirect', status: 303, location: __prgTarget });`,
    );
    lines.push(`    }`);
    lines.push(`    if (!__isActionFailure(__actionResult)) {`);
    lines.push(`      return c.redirect(__prgTarget, 303);`);
    lines.push(`    }`);
    lines.push(
      `    const __data = typeof ${route.varName}.loader === "function" ? await ${route.varName}.loader(__loadContext) : undefined;`,
    );
    lines.push(`    const __actionData = __actionResult.data;`);
    lines.push(`    const __actionStatus = __actionResult.status;`);
  }
  lines.push(
    `    let node = jsx(__tag, ${
      pagePropsExpr({
        paramsExpr: '__params',
        dataExpr: '__data',
        actionDataExpr: isAction ? '__actionData' : 'undefined',
        requestExpr: 'c.req.raw',
        routeExpr: '__routeContext',
        metaExpr: '__routeMetaValue',
      })
    })`,
  );
  lines.push('');

  if (matchingRenderers.length > 0) {
    lines.push(`    // Renderer tree wrapping (outer -> inner)`);
    for (const renderer of matchingRenderers) {
      lines.push(`    node = await ${renderer.varName}.default.wrap(node, c)`);
    }
  }
  lines.push(
    `    const content = await __renderAppShell(node, c.req.path || ${pathLiteral}, { routeMeta: __routeMetaValue })`,
  );
  lines.push(`    return c.html(wrapInDocument(content, {`);
  for (
    const optionLine of documentWrapOptionsLines({
      pageExpr: '__page',
      titleExpr: `__page.head?.title || ${jsStringLiteral(docConfig.title)}`,
      langExpr: jsStringLiteral(docConfig.lang),
      headExtrasExpr,
      allowHeadExtrasScripts: docConfig.allowHeadExtrasScripts,
      cspNonce: true,
    })
  ) {
    lines.push(`      ${optionLine}`);
  }
  lines.push(`    })${isAction ? ', __actionStatus' : ''})`);

  lines.push(`  } catch (err) {`);
  lines.push(`    if (__isOpenElementRedirect(err)) {`);
  if (isAction) {
    // ADR-0121 section 3 (#547): in the POST action context every 3xx is
    // coerced to 303 (PRG must be method-safe and non-cacheable); GET
    // handlers keep the author's status.
    lines.push(
      `      const __redirectStatus = 303;`,
    );
    lines.push(
      `      if (__isFetch) return c.json({ type: 'redirect', status: __redirectStatus, location: err.location });`,
    );
    lines.push(`      return c.redirect(err.location, __redirectStatus)`);
  } else {
    lines.push(`      return c.redirect(err.location, err.status)`);
  }
  lines.push(`    }`);
  lines.push(`    if (__isOpenElementNotFound(err)) {`);
  lines.push(
    `      return c.html(wrapInDocument(__statusHtml("404 Not Found", err.message || "Not Found"), {`,
  );
  lines.push(`        title: "404 Not Found",`);
  lines.push(`        lang: ${jsStringLiteral(docConfig.lang)},`);
  lines.push(`        headExtras: ${headExtrasExpr},`);
  lines.push(
    `        allowHeadExtrasScripts: ${JSON.stringify(docConfig.allowHeadExtrasScripts)},`,
  );
  lines.push(`        cspNonce: c.get('cspNonce'),`);
  lines.push(`      }), 404)`);
  lines.push(`    }`);

  // ADR-0121 (#558): the JSON error channel scrubs internals in production,
  // matching the HTML channel. Fetch callers get ActionResult JSON, never
  // the boundary page.
  if (isAction) {
    lines.push(`    if (__isFetch) {`);
    lines.push(
      `      console.error('[openElement] Action POST failed for ' + ${pathLiteral} + ':', err)`,
    );
    lines.push(
      `      return c.json({ type: 'error', status: 500, error: { message: import.meta.env.PROD ? 'Internal Server Error' : String(err && err.message ? err.message : err) } }, 500);`,
    );
    lines.push(`    }`);
  }
  // ADR-0121 section 7 (#551): POST takes the same nearest-error-boundary
  // channel as GET — the page's error component renders with status 500.
  {
    lines.push(`    if (typeof __page.error === "function") {`);
    lines.push(`      try {`);
    lines.push(
      `        const errorNode = jsx(__tag, { ...__params, __openElementParams: __params, __openElementError: err, __openElementRequest: c.req.raw, __openElementRoute: __routeContext, __openElementMeta: __routeMetaValue })`,
    );
    lines.push(
      `        const errorContent = await __renderAppShell(errorNode, c.req.path || ${pathLiteral}, { routeMeta: __routeMetaValue })`,
    );
    lines.push(`        return c.html(wrapInDocument(errorContent, {`);
    for (
      const optionLine of documentWrapOptionsLines({
        pageExpr: '__page',
        titleExpr: `__page.head?.title || ${jsStringLiteral(docConfig.title)}`,
        langExpr: jsStringLiteral(docConfig.lang),
        headExtrasExpr,
        allowHeadExtrasScripts: docConfig.allowHeadExtrasScripts,
        cspNonce: true,
      })
    ) {
      lines.push(`          ${optionLine}`);
    }
    lines.push(`        }), 500)`);
    lines.push(`      } catch (errorRenderFailure) {`);
    lines.push(
      `        console.error('[openElement] Route error renderer failed for ' + ${pathLiteral} + ':', errorRenderFailure)`,
    );
    lines.push(`      }`);
    lines.push(`    }`);
  }

  const failureLabel = isAction ? 'Action POST failed' : 'Route render failed';
  lines.push(
    `    console.error('[openElement] ${failureLabel} for ' + ${pathLiteral} + ':', err)`,
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

/** Compatibility-facing focused entry points used by the entry orchestrator. */
export function renderPageRoute(
  lines: string[],
  route: PageRouteDecl,
  renderers: RendererDecl[],
  docConfig: RouteHandlerDocConfig,
  isSSG: boolean,
): void {
  renderRouteHandler(lines, { method: 'get', route, renderers, docConfig, isSSG });
}

export function renderActionRoute(
  lines: string[],
  route: PageRouteDecl,
  renderers: RendererDecl[],
  docConfig: RouteHandlerDocConfig,
  isSSG: boolean,
): void {
  renderRouteHandler(lines, { method: 'post', route, renderers, docConfig, isSSG });
  // ADR-0121 (#572): only GET/POST are defined for page routes — other
  // methods get a defined 405 instead of the server fallback 404. The
  // method-specific handlers above are registered first and win for
  // GET/POST/HEAD. no-store/Vary apply to the 405 as well (#586).
  lines.push(
    `app.all(${
      jsStringLiteral(route.path)
    }, (c) => { c.header('Cache-Control', 'no-store'); c.header('Vary', __actionFetchHeader); return c.text('Method Not Allowed', 405, { Allow: 'GET, POST' }); });`,
  );
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
    lines.push(`  ${jsStringLiteral(r.path)}: ${r.varName},`);
  }
  lines.push('};');
  lines.push('');
}

/** Generate the /_data GET endpoint for SPA navigation data fetching. */
export function renderDataEndpoint(lines: string[]): void {
  lines.push('// /_data endpoint - returns JSON loader data for SPA navigation');
  lines.push(`app.get(${jsStringLiteral('/_data')}, async (c) => {`);
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
  lines.push(
    `    return c.json({ error: import.meta.env.PROD ? 'Internal Server Error' : String(err) }, 500);`,
  );
  lines.push(`  }`);
  lines.push(`})`);
  lines.push('');
}

function renderCorsOrigin(origin: CorsOriginConfig): string {
  if (typeof origin === 'object' && !Array.isArray(origin)) return origin.body;
  if (Array.isArray(origin)) {
    return `[${origin.map((o) => jsStringLiteral(o)).join(', ')}]`;
  }
  return jsStringLiteral(origin);
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
        console.warn(
          '[openElement] middleware.corsOrigin is not configured. The generated server only ' +
            'reflects localhost origins; configure middleware.corsOrigin in openElement() before ' +
            'production deployment to avoid unintended cross-origin access.',
        );
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
              jsStringLiteral(policyTemplate)
            }.replace('NONCE_PLACEHOLDER', nonce)`,
          );
          lines.push(`  await next()`);
          lines.push(`  c.header('${headerName}', policy)`);
          lines.push(`})`);
        } else {
          lines.push(`app.use('*', async (c, next) => {`);
          lines.push(`  await next()`);
          lines.push(
            `  c.header('${headerName}', ${jsStringLiteral(cspConfig.policy ?? '')})`,
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
  const pathLiteral = jsStringLiteral(route.path);
  lines.push(`// API: ${route.path} (${route.filePath})`);
  lines.push(
    `if (${route.varName}.default && typeof ${route.varName}.default.fetch === 'function') {`,
  );
  lines.push(`  app.route(${pathLiteral}, ${route.varName}.default)`);
  lines.push(`} else if (typeof ${route.varName}.default === 'function') {`);
  lines.push(`  app.all(${pathLiteral}, async (c) => {`);
  lines.push(`    return await ${route.varName}.default({`);
  lines.push(`      request: c.req.raw,`);
  lines.push(`      params: c.req.param() || {},`);
  lines.push(`      env: c.env || {},`);
  lines.push(
    `      platform: (() => { try { return c.executionCtx } catch { return undefined } })(),`,
  );
  lines.push(`    })`);
  lines.push(`  })`);
  lines.push(`} else {`);
  lines.push(
    `  throw new Error('API route ' + ${pathLiteral} + ' must default-export a Hono app or a function (ctx) => Response')`,
  );
  lines.push(`}`);
  lines.push('');
}
