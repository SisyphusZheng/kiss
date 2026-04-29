/**
 * @kissjs/core - Entry renderer snapshot tests (Deno)
 *
 * Snapshot tests for renderEntry output covering:
 * - CSP middleware (with/without nonce)
 * - _renderer.ts / _middleware.ts special routes
 * - Hydration strategies (eager/lazy/idle/visible)
 * - Package islands
 * - Full code structure validation
 */

import {
  assertEquals,
  assertExists,
  assertFalse,
  assertStringIncludes,
} from 'jsr:@std/assert@^1.0.0';
import { buildEntryDescriptor, generateHonoEntryCode, renderEntry } from '../src/hono-entry.ts';
import type { RouteEntry } from '../src/types.ts';

// ─── Fixtures ──────────────────────────────────────────────────

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

// ─── CSP Tests ───────────────────────────────────────────────

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
  // No nonce when not configured
  assertEquals(code.includes('crypto.randomUUID()'), false);
  assertEquals(code.includes('cspNonce'), false);
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

// ─── Renderer / Middleware Special Routes ───────────────────

Deno.test('renderEntry: _renderer.ts generates wrap call', () => {
  const desc = buildEntryDescriptor(withSpecialRoutes);
  const code = renderEntry(desc);

  // Renderers should appear in descriptor
  assertEquals(desc.renderers.length >= 2, true);
  // Generated code should reference renderer variable names
  assertStringIncludes(code, '$specialRenderer');
  assertStringIncludes(code, '$guideRenderer');
  // Renderer wrap call uses c (Hono context)
  assertStringIncludes(code, '.default.wrap(wrapped, c)');
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

  // Special routes should NOT be in apiRoutes or pageRoutes — they go to renderers/middlewareScopes
  assertEquals(desc.apiRoutes.length > 0, true);
  assertEquals(desc.pageRoutes.length > 0, true);

  // They should appear as renderers and middlewareScopes instead
  assertEquals(desc.renderers.length + desc.middlewareScopes.length >= 3, true); // _renderer ×2 + _middleware ×1
});

// ─── Hydration Strategy Tests ──────────────────────────────

Deno.test('buildEntryDescriptor: hydrationStrategy is recorded (eager)', () => {
  const desc = buildEntryDescriptor(basicRoutes, {
    islandTagNames: ['my-counter'],
    hydrationStrategy: 'eager',
  });

  assertEquals(desc.hydrationStrategy, 'eager');
});

Deno.test('buildEntryDescriptor: hydrationStrategy is recorded (visible)', () => {
  const desc = buildEntryDescriptor(basicRoutes, {
    islandTagNames: ['lazy-image'],
    hydrationStrategy: 'visible',
  });

  assertEquals(desc.hydrationStrategy, 'visible');
});

Deno.test('buildEntryDescriptor: default hydrationStrategy is lazy', () => {
  const desc = buildEntryDescriptor(basicRoutes, {
    islandTagNames: ['my-counter'],
  });

  // Default should be 'lazy'
  assertEquals(desc.hydrationStrategy, 'lazy');
});

// ─── Package Islands ───────────────────────────────────────

Deno.test('renderEntry: package islands are included in hydration', () => {
  const desc = buildEntryDescriptor(basicRoutes, {
    packageIslands: [
      { tagName: 'kiss-layout', modulePath: '@kissjs/ui/kiss-layout' },
      { tagName: 'kiss-button', modulePath: '@kissjs/ui/kiss-button' },
    ],
  });
  const code = renderEntry(desc);

  assertStringIncludes(code, 'kiss-layout');
  assertStringIncludes(code, 'kiss-button');
  assertStringIncludes(code, '@kissjs/ui');
});

// ─── Code Structure Validation ──────────────────────────────

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

Deno.test('renderEntry: app.route for API routes (not app.all)', () => {
  const desc = buildEntryDescriptor(basicRoutes);
  const code = renderEntry(desc);

  assertStringIncludes(code, "app.route('/api/hello'");
  assertEquals(code.includes("app.all('/api/hello'"), false);
  assertEquals(code.includes("app.get('/api/hello'"), false);
});

Deno.test('renderEntry: exports default app', () => {
  const desc = buildEntryDescriptor(basicRoutes);
  const code = renderEntry(desc);

  assertStringIncludes(code, 'export default app');
});

Deno.test('renderEntry: imports Hono and SSR dependencies', () => {
  const desc = buildEntryDescriptor(basicRoutes);
  const code = renderEntry(desc);

  assertStringIncludes(code, "import { Hono } from 'hono'");
  assertStringIncludes(code, '@lit-labs/ssr');
});

Deno.test('renderEntry: SSG mode includes DOM shim', () => {
  const desc = buildEntryDescriptor(basicRoutes, { ssg: true });
  const code = renderEntry(desc);

  assertStringIncludes(code, 'install-global-dom-shim');
});

// ─── Integration: Full Pipeline ────────────────────────────

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
    packageIslands: [
      { tagName: 'kiss-layout', modulePath: '@kissjs/ui/kiss-layout' },
    ],
    html: { lang: 'zh-CN', title: 'KISS 文档' },
    headExtras: '<link rel="stylesheet" href="/styles.css" />',
    hydrationStrategy: 'lazy',
  });

  // All features present
  assertStringIncludes(code, 'Content-Security-Policy');
  assertStringIncludes(code, 'crypto.randomUUID()');
  assertStringIncludes(code, '"https://example.com"');
  assertStringIncludes(code, '_renderer');
  assertStringIncludes(code, '_middleware');
  assertStringIncludes(code, 'kiss-layout');
  assertStringIncludes(code, 'lang: "zh-CN"');
  assertStringIncludes(code, 'KISS 文档');
  assertStringIncludes(code, '/styles.css');
  // No process.env
  const codeLines = code.split('\n').filter((l) => !l.trimStart().startsWith('//'));
  assertFalse(codeLines.some((l) => l.includes('process.env')));
});
