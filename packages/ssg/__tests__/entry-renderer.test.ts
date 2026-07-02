/**
 * @openelement/ssg - Entry renderer tests
 *
 * Tests for generateHonoEntryCode and renderEntry focused on:
 * - Loader handler generation
 * - Action POST handler generation
 * - /_data endpoint generation
 * - SSG renderRoute using `data` prop (not `__openElementData`)
 */

import { assertEquals, assertFalse, assertStringIncludes } from 'jsr:@std/assert@^1.0.0';
import { buildEntryDescriptor, generateHonoEntryCode, renderEntry } from '@openelement/ssg';
import type { RouteEntry } from '@openelement/core';

// ─── Fixtures ──────────────────────────────────────────────────

const basicRoutes: RouteEntry[] = [
  { path: '/', filePath: 'index.ts', type: 'page', varName: 'pageIndex' },
  { path: '/about', filePath: 'about.ts', type: 'page', varName: 'pageAbout' },
  { path: '/api/hello', filePath: 'api/hello.ts', type: 'api', varName: 'apiHello' },
];

const dynamicRoutes: RouteEntry[] = [
  ...basicRoutes,
  {
    path: '/blog/:slug',
    filePath: 'blog/[slug].ts',
    type: 'page',
    varName: 'pageBlogSlug',
    params: ['slug'],
  },
];

// ─── Loader handler tests ──────────────────────────────────────

Deno.test('renderEntry: page GET handler calls module.loader when present', () => {
  const desc = buildEntryDescriptor(basicRoutes, { ssg: true });
  const code = renderEntry(desc);

  // Verify loader call pattern
  assertStringIncludes(
    code,
    'const __data = typeof $pageIndex.loader === "function" ? await $pageIndex.loader(__loadContext) : undefined',
  );
});

Deno.test('renderEntry: page GET handler passes data prop to jsx', () => {
  const desc = buildEntryDescriptor(basicRoutes, { ssg: true });
  const code = renderEntry(desc);

  // Verify data is passed as prop (not __openElementData)
  assertStringIncludes(code, 'data: __data');
  // __openElementData should NOT appear as a prop name
  // (it existed in older v0.39 codegen)
  assertFalse(
    code.includes('__openElementData: __data'),
    'renderEntry should NOT use __openElementData prop name - use "data" instead',
  );
});

Deno.test('renderEntry: SSG renderRoute uses `data` prop', () => {
  const desc = buildEntryDescriptor(basicRoutes, { ssg: true });
  const code = renderEntry(desc);

  // The SSG renderRoute function should use 'data' prop, not __openElementData
  assertStringIncludes(code, 'const props = { ...params, data,');
});

Deno.test('renderEntry: SSG renderRoute calls module.loader', () => {
  const desc = buildEntryDescriptor(basicRoutes, { ssg: true });
  const code = renderEntry(desc);

  // SSG renderRoute must call module.loader, not page.load
  assertStringIncludes(
    code,
    'data = typeof info.module.loader === "function" ? await info.module.loader(loadContext) : undefined;',
  );
});

// ─── Action POST handler tests ─────────────────────────────────

Deno.test('renderEntry: action POST handler uses app.post', () => {
  const desc = buildEntryDescriptor(basicRoutes, { ssg: true });
  const code = renderEntry(desc);

  // Verify action POST routes
  assertStringIncludes(code, 'app.post("/",');
  assertStringIncludes(code, 'app.post("/about"');
});

Deno.test('renderEntry: action POST handler calls module.loader', () => {
  const desc = buildEntryDescriptor(basicRoutes, { ssg: true });
  const code = renderEntry(desc);

  assertStringIncludes(
    code,
    'const __data = typeof $pageIndex.loader === "function" ? await $pageIndex.loader(__loadContext) : undefined',
  );
});

Deno.test('renderEntry: action POST handler calls module.action', () => {
  const desc = buildEntryDescriptor(basicRoutes, { ssg: true });
  const code = renderEntry(desc);

  assertStringIncludes(
    code,
    'const __actionData = typeof $pageIndex.action === "function" ? await $pageIndex.action(__actionCtx) : undefined',
  );
});

Deno.test('renderEntry: action POST handler passes actionData to jsx', () => {
  const desc = buildEntryDescriptor(basicRoutes, { ssg: true });
  const code = renderEntry(desc);

  assertStringIncludes(code, '__openElementActionData: __actionData');
});

Deno.test('renderEntry: action POST handler parses form data', () => {
  const desc = buildEntryDescriptor(basicRoutes, { ssg: true });
  const code = renderEntry(desc);

  assertStringIncludes(code, 'const __formData = await c.req.parseBody()');
  assertStringIncludes(code, 'const __actionCtx = { ...__loadContext, formData: __formData }');
});

// ─── /_data endpoint tests ─────────────────────────────────────

Deno.test('renderEntry: generates /_data route map', () => {
  const desc = buildEntryDescriptor(basicRoutes, { ssg: true });
  const code = renderEntry(desc);

  assertStringIncludes(code, 'const __dataRouteMap = {');
  assertStringIncludes(code, '"/": $pageIndex,');
  assertStringIncludes(code, '"/about": $pageAbout,');
});

Deno.test('renderEntry: generates /_data GET endpoint', () => {
  const desc = buildEntryDescriptor(basicRoutes, { ssg: true });
  const code = renderEntry(desc);

  assertStringIncludes(code, "app.get('/_data'");
  assertStringIncludes(code, "const routePath = c.req.query('route')");
  assertStringIncludes(code, "typeof mod.loader !== 'function'");
  assertStringIncludes(code, 'const data = await mod.loader(loadContext)');
  assertStringIncludes(code, 'return c.json({ data })');
});

Deno.test('renderEntry: /_data handles missing route param', () => {
  const desc = buildEntryDescriptor(basicRoutes, { ssg: true });
  const code = renderEntry(desc);

  assertStringIncludes(code, "return c.json({ error: 'Missing route query' }, 400)");
  assertStringIncludes(code, "return c.json({ error: 'Route not found' }, 404)");
});

Deno.test('renderEntry: /_data handles routes without loader', () => {
  const desc = buildEntryDescriptor(basicRoutes, { ssg: true });
  const code = renderEntry(desc);

  assertStringIncludes(
    code,
    "if (typeof mod.loader !== 'function') return c.json({ data: null });",
  );
});

// ─── SSG section tests ─────────────────────────────────────────

Deno.test('renderEntry: SSG mode exports routeInfo and renderRoute', () => {
  const desc = buildEntryDescriptor(basicRoutes, { ssg: true });
  const code = renderEntry(desc);

  assertStringIncludes(code, 'export const routeInfo = [');
  assertStringIncludes(code, 'export async function renderRoute(routePath, options = {})');
  assertStringIncludes(code, 'export async function getStaticPaths(routePath)');
});

Deno.test('renderEntry: SSG mode exports SSG utilities', () => {
  const desc = buildEntryDescriptor(basicRoutes, { ssg: true });
  const code = renderEntry(desc);

  assertStringIncludes(code, 'renderDsd');
  assertStringIncludes(code, 'renderDsdTree');
  assertStringIncludes(code, 'wrapInDocument');
});

Deno.test('renderEntry: non-SSG mode does not have SSG sections', () => {
  const desc = buildEntryDescriptor(basicRoutes, { ssg: false });
  const code = renderEntry(desc);

  assertFalse(code.includes('export const routeInfo'));
  assertFalse(code.includes('export async function renderRoute'));
});

// ─── Dynamic route handling ────────────────────────────────────

Deno.test('renderEntry: SSG routeInfo marks dynamic routes', () => {
  const desc = buildEntryDescriptor(dynamicRoutes, { ssg: true });
  const code = renderEntry(desc);

  assertStringIncludes(code, 'blog/:slug');
  assertStringIncludes(code, 'isDynamic: true');
});

Deno.test('renderEntry: SSG routeInfo includes paramNames', () => {
  const desc = buildEntryDescriptor(dynamicRoutes, { ssg: true });
  const code = renderEntry(desc);

  assertStringIncludes(code, 'paramNames: ["slug"]');
});

Deno.test('renderEntry: getStaticPaths dispatches to dynamic route modules', () => {
  const desc = buildEntryDescriptor(dynamicRoutes, { ssg: true });
  const code = renderEntry(desc);

  assertStringIncludes(code, 'if (routePath === "/blog/:slug")');
  assertStringIncludes(code, '$pageBlogSlug.getStaticPaths');
});

Deno.test('renderEntry: route paths are emitted as structured JS string literals', () => {
  const desc = buildEntryDescriptor([
    {
      path: "/docs/'quoted-\\\\path",
      filePath: "docs/'quoted-\\\\path.ts",
      type: 'page',
      varName: 'pageQuotedPath',
    },
  ], { ssg: true });
  const code = renderEntry(desc);

  assertStringIncludes(code, `app.get("/docs/'quoted-\\\\\\\\path"`);
  assertStringIncludes(code, `app.post("/docs/'quoted-\\\\\\\\path"`);
  assertEquals(code.includes(`app.get('/docs/\\'quoted-`), false);
});

// ─── head handling ─────────────────────────────────────────────

Deno.test('renderEntry: SSG headExtras uses __headExtras variable', () => {
  const desc = buildEntryDescriptor(basicRoutes, {
    ssg: true,
    headExtras: '<link rel="stylesheet" href="/styles.css" />',
  });
  const code = renderEntry(desc);

  assertStringIncludes(code, 'headExtras: __headExtras');
});

Deno.test('renderEntry: non-SSG headExtras is inlined', () => {
  const desc = buildEntryDescriptor(basicRoutes, {
    ssg: false,
    headExtras: '<link rel="stylesheet" href="/styles.css" />',
  });
  const code = renderEntry(desc);

  // The headExtras should be inlined as a JSON-stringified value (not __headExtras variable)
  assertStringIncludes(code, 'headExtras:');
  assertStringIncludes(code, 'styles.css');
  assertFalse(
    code.includes('headExtras: __headExtras'),
    'headExtras should be inlined, not variable',
  );
});

Deno.test('renderEntry: wrapInDocument receives meta fields', () => {
  const desc = buildEntryDescriptor(basicRoutes, { ssg: true });
  const code = renderEntry(desc);

  assertStringIncludes(code, 'title: __page.head?.title || "openElement"');
  assertStringIncludes(
    code,
    'meta: { description: __page.head?.description, tags: __page.head?.meta }',
  );
});

// ─── generateHonoEntryCode ─────────────────────────────────────

Deno.test('generateHonoEntryCode: generates complete entry for basic routes', () => {
  const code = generateHonoEntryCode(basicRoutes, { ssg: true });

  assertStringIncludes(code, "import { Hono } from 'hono'");
  assertStringIncludes(code, 'const app = new Hono()');
  assertStringIncludes(code, 'export default app');
  assertStringIncludes(code, 'export const openElementHandler');
});

Deno.test('generateHonoEntryCode: generates action handlers for all routes', () => {
  const code = generateHonoEntryCode(basicRoutes, { ssg: true });

  // Each page route should have a POST handler
  assertStringIncludes(code, '// Action POST: / (index.ts)');
  assertStringIncludes(code, '// Action POST: /about (about.ts)');
});
