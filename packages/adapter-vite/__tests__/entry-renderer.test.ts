/**
 * @openelement/adapter-vite - Entry renderer snapshot tests (Deno)
 *
 * Snapshot tests for renderEntry output covering:
 * - CSP middleware (with/without nonce)
 * - _renderer.ts / _middleware.ts special routes
 * - Island upgrade strategies (load/idle/visible/only)
// Package islands
// Code structure validation
 */

import {
  assertEquals,
  assertExists,
  assertFalse,
  assertStringIncludes,
} from 'jsr:@std/assert@^1.0.0';
import {
  buildEntryDescriptor,
  generateHonoEntryCode,
  renderEntry,
} from '../src/internal/ssg/index.ts';
import type { RouteEntry } from '../src/internal/protocol/framework.ts';

// Fixtures

const basicRoutes: RouteEntry[] = [
  { path: '/', filePath: 'index.ts', type: 'page', varName: 'pageIndex' },
  { path: '/api/hello', filePath: 'api/hello.ts', type: 'api', varName: 'apiHello' },
];

const withSpecialRoutes: RouteEntry[] = [
  { path: '/', filePath: 'index.ts', type: 'page', varName: 'pageIndex' },
  { path: '/guide', filePath: 'guide/index.ts', type: 'page', varName: 'guideIndex' },
  {
    path: '/guide/getting-started',
    filePath: 'guide/getting-started.ts',
    type: 'page',
    varName: 'guideGettingStarted',
  },
  { path: '/api/data', filePath: 'api/data.ts', type: 'api', varName: 'apiData' },
  {
    path: '/_renderer',
    filePath: '_renderer.ts',
    type: 'special',
    special: 'renderer',
    varName: 'specialRenderer',
  },
  {
    path: '/guide/_renderer',
    filePath: 'guide/_renderer.ts',
    type: 'special',
    special: 'renderer',
    varName: 'guideRenderer',
  },
  {
    path: '/api/_middleware',
    filePath: 'api/_middleware.ts',
    type: 'special',
    special: 'middleware',
    varName: 'apiMiddleware',
  },
];

// Section

Deno.test('renderEntry: CSP without nonce generates header middleware', () => {
  const desc = buildEntryDescriptor(basicRoutes, {
    middleware: {
      csp: {
        policy: "default-src 'self'; script-src 'self'",
      },
    },
  });
  const code = renderEntry(desc);

  assertStringIncludes(code, 'Content-Security-Policy');
  assertStringIncludes(code, "default-src 'self'; script-src 'self'");
  // No nonce middleware when not configured - c.get('cspNonce') returns undefined
  assertEquals(code.includes('crypto.randomUUID()'), false);
  // cspNonce is always passed to wrapInDocument but will be undefined
  // when no CSP nonce middleware is configured
  assertStringIncludes(code, "cspNonce: c.get('cspNonce')");
});

Deno.test('renderEntry: CSP with nonce generates per-request nonce', () => {
  const desc = buildEntryDescriptor(basicRoutes, {
    middleware: {
      csp: {
        policy: "default-src 'self'",
        nonce: true,
      },
    },
  });
  const code = renderEntry(desc);

  assertStringIncludes(code, 'crypto.randomUUID()');
  assertStringIncludes(code, "c.set('cspNonce'");
  // v0.3.1: NONCE_PLACEHOLDER template approach (fixes missing closing quote bug)
  assertStringIncludes(code, 'NONCE_PLACEHOLDER');
  assertStringIncludes(code, ".replace('NONCE_PLACEHOLDER', nonce)");
});

Deno.test('renderEntry: CSP report-only mode', () => {
  const desc = buildEntryDescriptor(basicRoutes, {
    middleware: {
      csp: {
        policy: "default-src 'self'",
        reportOnly: true,
      },
    },
  });
  const code = renderEntry(desc);

  assertStringIncludes(code, 'Content-Security-Policy-Report-Only');
  assertEquals(code.includes('Content-Security-Policy"'), false);
});

Deno.test('buildEntryDescriptor: CSP config is serialized into descriptor', () => {
  const desc = buildEntryDescriptor(basicRoutes, {
    middleware: {
      csp: {
        policy: "default-src 'self'; script-src 'self'",
        nonce: true,
      },
    },
  });

  const cspMw = desc.middleware.find((m) => m.kind === 'csp');
  assertExists(cspMw);
  assertEquals(cspMw.config?.csp?.policy, "default-src 'self'; script-src 'self'");
  assertEquals(cspMw.config?.csp?.nonce, true);
});

// Section

Deno.test('renderEntry: _renderer.ts generates wrap call', () => {
  const desc = buildEntryDescriptor(withSpecialRoutes);
  const code = renderEntry(desc);

  // Renderers should appear in descriptor
  assertEquals(desc.renderers.length >= 2, true);
  // Generated code should reference renderer variable names
  assertStringIncludes(code, '$specialRenderer');
  assertStringIncludes(code, '$guideRenderer');
  // Renderer wrap call uses VNode input and c (Hono context)
  assertStringIncludes(code, '.default.wrap(node, c)');
});

Deno.test('renderEntry: _middleware.ts generates app.use scope', () => {
  const desc = buildEntryDescriptor(withSpecialRoutes);
  const code = renderEntry(desc);

  // Middleware scopes should appear in descriptor
  assertEquals(desc.middlewareScopes.length >= 1, true);
  // Generated code should reference middleware variable name
  assertStringIncludes(code, '$apiMiddleware');
  assertStringIncludes(code, 'app.use(');
});

Deno.test('buildEntryDescriptor: special routes are separated from page/api', () => {
  const desc = buildEntryDescriptor(withSpecialRoutes);

  // Special routes should NOT be in apiRoutes or pageRoutes; they go to renderers/middlewareScopes
  assertEquals(desc.apiRoutes.length > 0, true);
  assertEquals(desc.pageRoutes.length > 0, true);

  // They should appear as renderers and middlewareScopes instead
  assertEquals(desc.renderers.length + desc.middlewareScopes.length >= 3, true); // _renderer x2 + _middleware x1
});

// Island upgrade strategy tests

Deno.test('buildEntryDescriptor: upgradeStrategy is recorded (load)', () => {
  const desc = buildEntryDescriptor(basicRoutes, {
    islandTagNames: ['my-counter'],
    upgradeStrategy: 'load',
  });

  assertEquals(desc.upgradeStrategy, 'load');
});

Deno.test('buildEntryDescriptor: upgradeStrategy is recorded (visible)', () => {
  const desc = buildEntryDescriptor(basicRoutes, {
    islandTagNames: ['idle-image'],
    upgradeStrategy: 'visible',
  });

  assertEquals(desc.upgradeStrategy, 'visible');
});

Deno.test('buildEntryDescriptor: default upgradeStrategy is idle', () => {
  const desc = buildEntryDescriptor(basicRoutes, {
    islandTagNames: ['my-counter'],
  });

  // Default should be 'idle'
  assertEquals(desc.upgradeStrategy, 'idle');
});

// Package islands

// Package islands

Deno.test('renderEntry: package islands are included in island upgrade entry', () => {
  const desc = buildEntryDescriptor(basicRoutes, {
    packageManifests: [
      {
        schemaVersion: '1.0.0',
        packageName: '@openelement/ui',
        version: '0.17.0',
        declarations: [
          {
            tagName: 'open-layout',
            className: 'OpenLayout',
            openElement: { module: '@openelement/ui/open-layout', hydrate: 'load' },
          },
          {
            tagName: 'open-button',
            className: 'OpenButton',
            openElement: { module: '@openelement/ui/open-button', hydrate: 'idle' },
          },
        ],
      },
    ],
  });
  const code = renderEntry(desc);

  assertStringIncludes(code, 'open-layout');
  assertStringIncludes(code, 'open-button');
  assertStringIncludes(code, '@openelement/ui');
});

Deno.test('renderEntry: package islands are not imported by SSR entry', () => {
  const desc = buildEntryDescriptor(basicRoutes, {
    packageManifests: [
      {
        schemaVersion: '1.0.0',
        packageName: '@openelement/ui',
        version: '0.17.0',
        declarations: [
          {
            tagName: 'open-layout',
            className: 'OpenLayout',
            openElement: { module: '@openelement/ui/open-layout', hydrate: 'load' },
          },
          {
            tagName: 'open-button',
            className: 'OpenButton',
            openElement: { module: '@openelement/ui/open-button', hydrate: 'idle' },
          },
        ],
      },
    ],
  });
  const code = renderEntry(desc);

  assertStringIncludes(code, '"open-layout": "@openelement/ui/open-layout"');
  assertFalse(code.includes("import * as __island_kiss_layout from '@openelement/ui/open-layout'"));
  assertFalse(code.includes('__kiss_get_default_export'));
  assertFalse(code.includes("customElements.define('open-layout'"));
  assertFalse(code.includes('__island_kiss_layout.default'));
  assertFalse(code.includes('__island_kiss_button.default'));
});

// Code structure validation

Deno.test('renderEntry: no bare process.env references', () => {
  const desc = buildEntryDescriptor(basicRoutes, {
    middleware: { corsOrigin: 'https://example.com' },
  });
  const code = renderEntry(desc);

  const codeLines = code
    .split('\n')
    .filter((l) => !l.trimStart().startsWith('//') && !l.trimStart().startsWith('*'));
  assertFalse(
    codeLines.some((l) => l.includes('process.env')),
    'Generated code must not contain process.env calls',
  );
});

Deno.test('renderEntry: API routes support Hono apps and direct functions', () => {
  const desc = buildEntryDescriptor(basicRoutes);
  const code = renderEntry(desc);

  assertStringIncludes(code, 'app.route("/api/hello"');
  assertStringIncludes(code, 'app.all("/api/hello"');
  assertStringIncludes(code, 'request: c.req.raw');
  assertEquals(code.includes('app.get("/api/hello"'), false);
});

Deno.test('renderEntry: exports default app', () => {
  const desc = buildEntryDescriptor(basicRoutes);
  const code = renderEntry(desc);

  assertStringIncludes(code, 'export default app');
});

Deno.test('renderEntry: imports Hono and DSD renderer', () => {
  const desc = buildEntryDescriptor(basicRoutes);
  const code = renderEntry(desc);

  assertStringIncludes(code, "import { Hono } from 'hono'");
  // v0.5.0: DSD renderer replaces @lit-labs/ssr
  assertStringIncludes(code, 'renderDsd');
  assertStringIncludes(code, 'renderDsdTree');
  assertStringIncludes(code, "import { jsx } from '@openelement/element'");
});

Deno.test('renderEntry: app shell is built from VNode tree, not HTML replace', () => {
  const desc = buildEntryDescriptor(basicRoutes, { ssg: true });
  const code = renderEntry(desc);

  assertStringIncludes(code, 'async function __renderAppShell(routeNode, routePath');
  assertStringIncludes(code, '"tagName": "open-layout"');
  assertStringIncludes(code, 'import "@openelement/ui/open-layout";');
  assertStringIncludes(code, 'renderDsd(shell.tagName, { props: layoutProps })');
  assertStringIncludes(code, 'layoutResult.html.slice(0, index) + pageHtml');
});

Deno.test('renderEntry: appShell false renders route content without default layout import', () => {
  const desc = buildEntryDescriptor(basicRoutes, { ssg: true, appShell: false });
  const code = renderEntry(desc);

  assertFalse(code.includes('import "@openelement/ui/open-layout";'));
  assertStringIncludes(code, '"default": false');
  assertStringIncludes(code, 'if (!shell) return pageHtml;');
});

Deno.test('renderEntry: custom appShell import and props are generated from config', () => {
  const desc = buildEntryDescriptor(basicRoutes, {
    ssg: true,
    appShell: {
      tagName: 'blog-layout',
      import: './app/components/blog-layout.tsx',
      props: { siteName: 'Field Notes' },
    },
  });
  const code = renderEntry(desc);

  assertStringIncludes(code, 'import "/app/components/blog-layout.tsx";');
  assertStringIncludes(code, '"tagName": "blog-layout"');
  assertStringIncludes(code, '"siteName": "Field Notes"');
});

Deno.test('renderEntry: route meta layout can select named layouts', () => {
  const desc = buildEntryDescriptor(basicRoutes, {
    ssg: true,
    layouts: {
      default: false,
      post: {
        tagName: 'post-layout',
        import: './app/components/post-layout.tsx',
      },
    },
  });
  const code = renderEntry(desc);

  assertStringIncludes(code, 'import "/app/components/post-layout.tsx";');
  assertStringIncludes(
    code,
    'const layout = Object.prototype.hasOwnProperty.call(routeMeta, "layout")',
  );
  assertStringIncludes(code, '__appShellPlan.layouts[layout] ?? __appShellPlan.default');
  assertStringIncludes(code, 'module: $pageIndex');
});

Deno.test('renderEntry: definePage descriptor feeds load, metadata, and revalidate wiring', () => {
  const desc = buildEntryDescriptor(basicRoutes, { ssg: true });
  const code = renderEntry(desc);

  assertStringIncludes(code, 'let __page = __pageDefinition($pageIndex)');
  assertStringIncludes(
    code,
    'const __data = typeof $pageIndex.loader === "function" ? await $pageIndex.loader(__loadContext) : undefined',
  );
  assertStringIncludes(code, '__openElementParams: __params');
  assertStringIncludes(code, 'data: __data');
  assertFalse(
    code.includes('__openElementData: __data'),
    'Generated code should use `data` prop not `__openElementData`',
  );
  assertStringIncludes(code, '__openElementRoute: __routeContext');
  assertStringIncludes(code, '__openElementMeta: __routeMetaValue');
  assertEquals(code.includes('module?.meta'), false);
  assertEquals(code.includes('page.layout'), false);
  assertStringIncludes(code, 'title: __page.head?.title || "openElement"');
  assertStringIncludes(
    code,
    'meta: { description: __page.head?.description, tags: __page.head?.meta }',
  );
  assertStringIncludes(
    code,
    'dangerouslyHeadFragments: __page.head?.dangerouslyHeadFragments || []',
  );
  assertStringIncludes(code, 'function __pageDefinition(module) {');
  assertStringIncludes(
    code,
    "import { isOpenElementRedirect as __isOpenElementRedirect, isOpenElementNotFound as __isOpenElementNotFound } from '@openelement/app';",
  );
  assertFalse(code.includes('function __isOpenElementRedirect(error) {'));
  assertFalse(code.includes('function __isOpenElementNotFound(error) {'));
  assertStringIncludes(
    code,
    'data = typeof info.module.loader === "function" ? await info.module.loader(loadContext) : undefined;',
  );
  assertStringIncludes(code, '__openElementParams: params');
  assertStringIncludes(code, '__openElementRoute: loadContext.route');
  assertStringIncludes(code, 'filePath: "index.ts"');
  assertStringIncludes(
    code,
    'rendering: (__pageDefinition($pageIndex).renderIntent?.mode || "auto")',
  );
  assertStringIncludes(code, 'title: title || page.head?.title || "openElement"');
  assertStringIncludes(
    code,
    'revalidate: (__pageDefinition($pageIndex).renderIntent?.revalidate ?? false)',
  );
});

Deno.test('renderEntry: lifecycle control produces redirect and not-found responses', () => {
  const desc = buildEntryDescriptor(basicRoutes, { ssg: true });
  const code = renderEntry(desc);

  assertStringIncludes(code, 'return c.redirect(err.location, err.status)');
  assertStringIncludes(code, '__statusHtml("404 Not Found", err.message || "Not Found")');
  assertStringIncludes(
    code,
    'redirect: { location: error.location, status: error.status }',
  );
  assertStringIncludes(code, 'notFound: true');
  assertStringIncludes(code, '__openElementError: err');
});

Deno.test('renderEntry: SSG renderRoute renders the page error component on failure', () => {
  const desc = buildEntryDescriptor(basicRoutes, { ssg: true });
  const code = renderEntry(desc);

  // Parity with the dev/server route handler: a page declaring an error
  // component renders it with __openElementError inside the SSG renderRoute
  // catch, and the failure still surfaces as a 500 result carrying the
  // RenderError (no silent normal-page write).
  assertStringIncludes(code, 'if (typeof page.error === "function") {');
  assertStringIncludes(code, '__openElementError: error');
  assertStringIncludes(code, '__renderAppShell(errorNode, routePath');
  assertStringIncludes(
    code,
    'return { html: errorHtml, status: 500, errors: [renderError], componentCount: errorComponentCount, renderTimeMs };',
  );
  // A failing error renderer falls back to the plain 500 status page.
  assertStringIncludes(code, "'[openElement] Route error renderer failed for ' + routePath + ':'");
  assertStringIncludes(code, '__statusHtml("500 Internal Server Error", detail)');
  // The routeInfo emission no longer carries the dead streaming contract.
  assertFalse(code.includes('renderIntent?.streaming'));
});

Deno.test('renderEntry: uses descriptor SSR admission plan without recomputing it', () => {
  const desc = buildEntryDescriptor(basicRoutes, {
    ssg: true,
    islandTagNames: ['planned-widget'],
    islandFiles: ['planned-widget.ts'],
  });
  desc.ssrAdmissionPlan.renderableTags = [];
  desc.ssrAdmissionPlan.clientOnlyTags = ['planned-widget'];
  desc.ssrAdmissionPlan.reasons['planned-widget'] = 'test override';

  const code = renderEntry(desc);

  assertFalse(code.includes('import * as __island_planned_widget from'));
  assertFalse(code.includes("customElements.define('planned-widget'"));
  assertStringIncludes(code, '"clientOnlyTags": [\n    "planned-widget"\n  ]');
});

Deno.test('renderEntry: SSG mode includes no DOM shim (DSD renderer)', () => {
  const desc = buildEntryDescriptor(basicRoutes, { ssg: true });
  const code = renderEntry(desc);

  // v0.5.0: DSD renderer doesn't need DOM shim - pure string concatenation
  assertEquals(code.includes('install-global-dom-shim'), false);
});

// Section

Deno.test('generateHonoEntryCode: CSP flows through full pipeline', () => {
  const code = generateHonoEntryCode(basicRoutes, {
    middleware: {
      csp: {
        policy: "default-src 'self'; script-src 'self' 'unsafe-inline'",
        nonce: false,
      },
    },
  });

  assertStringIncludes(code, 'Content-Security-Policy');
  assertStringIncludes(code, "default-src 'self'");
  assertStringIncludes(code, 'export default app');
});

Deno.test('generateHonoEntryCode: complex scenario with all features', () => {
  const code = generateHonoEntryCode(withSpecialRoutes, {
    routesDir: 'app/routes',
    islandsDir: 'app/islands',
    middleware: {
      corsOrigin: 'https://example.com',
      csp: { policy: "default-src 'self'", nonce: true },
      securityHeaders: true,
    },
    islandTagNames: ['code-block', 'counter-island'],
    packageManifests: [
      {
        schemaVersion: '1.0.0',
        packageName: '@openelement/ui',
        version: '0.17.0',
        declarations: [
          {
            tagName: 'open-layout',
            className: 'OpenLayout',
            openElement: { module: '@openelement/ui/open-layout', hydrate: 'load' },
          },
        ],
      },
    ],
    html: { lang: 'zh-CN', title: 'openElement' },
    headExtras: '<link rel="stylesheet" href="/styles.css" />',
    upgradeStrategy: 'idle' as const,
  });

  // All features present
  assertStringIncludes(code, 'Content-Security-Policy');
  assertStringIncludes(code, 'crypto.randomUUID()');
  assertStringIncludes(code, '"https://example.com"');
  assertStringIncludes(code, '_renderer');
  assertStringIncludes(code, '_middleware');
  assertStringIncludes(code, 'open-layout');
  assertStringIncludes(code, 'lang: "zh-CN"');
  assertStringIncludes(code, 'openElement');
  assertStringIncludes(code, '/styles.css');
  // No process.env
  const codeLines = code.split('\n').filter((l) => !l.trimStart().startsWith('//'));
  assertFalse(codeLines.some((l) => l.includes('process.env')));
});

// Section

Deno.test('renderEntry: CSP nonce with existing script-src in policy', () => {
  const desc = buildEntryDescriptor(basicRoutes, {
    middleware: {
      csp: {
        policy: "default-src 'self'; script-src 'self' 'unsafe-inline'",
        nonce: true,
      },
    },
  });
  const code = renderEntry(desc);

  // When script-src already exists, nonce is injected into existing directive
  assertStringIncludes(code, 'NONCE_PLACEHOLDER');
  assertStringIncludes(code, "script-src 'nonce-NONCE_PLACEHOLDER'");
});

Deno.test('renderEntry: CSP nonce without existing script-src', () => {
  const desc = buildEntryDescriptor(basicRoutes, {
    middleware: {
      csp: {
        policy: "default-src 'self'",
        nonce: true,
      },
    },
  });
  const code = renderEntry(desc);

  // When no script-src, one is appended
  assertStringIncludes(code, 'NONCE_PLACEHOLDER');
  assertStringIncludes(code, "script-src 'nonce-NONCE_PLACEHOLDER'");
});

Deno.test('renderEntry: CORS with array origins', () => {
  const desc = buildEntryDescriptor(basicRoutes, {
    middleware: {
      corsOrigin: ['http://localhost:3000', 'http://localhost:3001'],
    },
  });
  const code = renderEntry(desc);

  assertStringIncludes(code, 'cors');
  assertStringIncludes(code, 'localhost:3000');
});

Deno.test('renderEntry: CORS default (no corsOrigin) generates localhost regex', () => {
  const desc = buildEntryDescriptor(basicRoutes, {
    middleware: {
      cors: true,
    },
  });
  const code = renderEntry(desc);

  assertStringIncludes(code, 'cors');
  assertStringIncludes(code, 'localhost');
});

Deno.test('renderEntry: default CORS warns with config entry and security impact', () => {
  const warnings: string[] = [];
  const originalWarn = console.warn;
  console.warn = (...values: unknown[]) => warnings.push(values.map(String).join(' '));
  try {
    const desc = buildEntryDescriptor(basicRoutes, { middleware: { cors: true } });
    renderEntry(desc);
  } finally {
    console.warn = originalWarn;
  }
  assertStringIncludes(warnings.join('\n'), 'middleware.corsOrigin');
  assertStringIncludes(warnings.join('\n'), 'production');
});

Deno.test('renderEntry: explicit CORS config is silent', () => {
  const warnings: string[] = [];
  const originalWarn = console.warn;
  console.warn = (...values: unknown[]) => warnings.push(values.map(String).join(' '));
  try {
    const desc = buildEntryDescriptor(basicRoutes, {
      middleware: { cors: true, corsOrigin: 'https://example.com' },
    });
    renderEntry(desc);
  } finally {
    console.warn = originalWarn;
  }
  assertEquals(warnings, []);
});

Deno.test('renderEntry: securityHeaders middleware', () => {
  const desc = buildEntryDescriptor(basicRoutes, {
    middleware: {
      securityHeaders: true,
    },
  });
  const code = renderEntry(desc);

  assertStringIncludes(code, 'secureHeaders');
});

Deno.test('renderEntry: requestId middleware', () => {
  const desc = buildEntryDescriptor(basicRoutes, {
    middleware: {
      requestId: true,
    },
  });
  const code = renderEntry(desc);

  assertStringIncludes(code, 'requestId');
});

Deno.test('renderEntry: logger middleware', () => {
  const desc = buildEntryDescriptor(basicRoutes, {
    middleware: {
      logger: true,
    },
  });
  const code = renderEntry(desc);

  assertStringIncludes(code, 'honoLogger');
});

Deno.test('renderEntry: no middleware generates clean app', () => {
  const desc = buildEntryDescriptor(basicRoutes, {
    middleware: {
      requestId: false,
      logger: false,
      cors: false,
      securityHeaders: false,
    },
  });
  const code = renderEntry(desc);

  assertEquals(code.includes('cors'), false);
  assertEquals(code.includes('secureHeaders'), false);
  assertEquals(code.includes('requestId'), false);
  assertEquals(code.includes('honoLogger'), false);
});

Deno.test('renderEntry: SSG mode disabled by default', () => {
  const desc = buildEntryDescriptor(basicRoutes);
  const code = renderEntry(desc);

  assertEquals(code.includes('install-global-dom-shim'), false);
});

// Section

Deno.test('renderEntry: local island with ssr===true is registered in SSR', () => {
  const desc = buildEntryDescriptor(basicRoutes, {
    ssg: true,
    islandTagNames: ['my-counter'],
    islandFiles: ['my-counter.ts'],
  });
  // Mark island as ssr: true
  desc.islands[0].ssr = true;
  const code = renderEntry(desc);

  // SSR registration should happen
  assertStringIncludes(code, 'customElements.define("my-counter"');
});

Deno.test('renderEntry: local island with ssr===false is excluded from SSR registration', () => {
  const desc = buildEntryDescriptor(basicRoutes, {
    ssg: true,
    islandTagNames: ['client-only-widget'],
    islandFiles: ['client-only-widget.ts'],
    islandMeta: {
      'client-only-widget': { ssr: false },
    },
  });
  const code = renderEntry(desc);

  // SSR registration should NOT happen for ssr:false islands
  assertFalse(code.includes('customElements.define("client-only-widget"'));
  assertFalse(code.includes('import * as __island_client_only_widget from'));
  // But it should still be in the island map for client-side upgrade
  assertStringIncludes(code, 'client-only-widget');
});

Deno.test('renderEntry: package island with ssr===false excluded from SSR but in island map', () => {
  const desc = buildEntryDescriptor(basicRoutes, {
    ssg: true,
    packageManifests: [
      {
        schemaVersion: '1.0.0',
        packageName: '@openelement/ui',
        version: '0.17.0',
        declarations: [
          {
            tagName: 'open-layout',
            className: 'OpenLayout',
            openElement: { module: '@openelement/ui/open-layout', hydrate: 'load', ssr: true },
          },
          {
            tagName: 'open-widget',
            className: 'OpenWidget',
            openElement: { module: '@openelement/ui/open-widget', hydrate: 'idle', ssr: false },
          },
        ],
      },
    ],
  });
  const code = renderEntry(desc);

  // v0.17.4: Package islands with ssr:true are now SSR-registered
  assertStringIncludes(code, 'customElements.define("open-layout"');
  // Package islands with ssr:false remain client-only
  assertFalse(code.includes('customElements.define("open-widget"'));
  // But both should be in the island map
  assertStringIncludes(code, '"open-layout": "@openelement/ui/open-layout"');
  assertStringIncludes(code, '"open-widget": "@openelement/ui/open-widget"');
});

Deno.test('buildEntryDescriptor: ssr field is extracted from manifest declarations', () => {
  const desc = buildEntryDescriptor(basicRoutes, {
    packageManifests: [
      {
        schemaVersion: '1.0.0',
        packageName: '@openelement/ui',
        version: '0.17.0',
        declarations: [
          {
            tagName: 'ssr-component',
            className: 'SsrComponent',
            openElement: { module: '@openelement/ui/ssr-component', ssr: true },
          },
          {
            tagName: 'client-only-component',
            className: 'ClientOnlyComponent',
            openElement: { module: '@openelement/ui/client-only-component', ssr: false },
          },
          {
            tagName: 'default-component',
            className: 'DefaultComponent',
            openElement: { module: '@openelement/ui/default-component' },
          },
        ],
      },
    ],
  });

  const ssrComp = desc.islands.find((i) => i.tagName === 'ssr-component');
  const clientOnly = desc.islands.find((i) => i.tagName === 'client-only-component');
  const defaultComp = desc.islands.find((i) => i.tagName === 'default-component');

  assertEquals(ssrComp?.ssr, true);
  assertEquals(clientOnly?.ssr, false);
  assertEquals(defaultComp?.ssr, undefined); // no ssr field in manifest -> undefined
});
