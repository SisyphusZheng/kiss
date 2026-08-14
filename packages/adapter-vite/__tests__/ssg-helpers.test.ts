import { assertEquals, assertStringIncludes, assertThrows } from '@std/assert';
import {
  renderRequestTimeServerModule,
  renderStandaloneServerModule,
  resolveDynamicRoutePath,
  routePatternToURLPatternPath,
} from '../src/internal/ssg/ssg-helpers.ts';
import { parseRouteFilePath } from '../src/internal/ssg/route-scanner.ts';
import { contentTypeFor } from '../src/internal/static-serve.ts';

Deno.test('resolveDynamicRoutePath encodes # ? & % and spaces', () => {
  const path = resolveDynamicRoutePath('/blog/:slug', ['slug'], {
    slug: 'a#b?c&d%e f',
  });
  assertEquals(path, '/blog/a%23b%3Fc%26d%25e%20f');
});

Deno.test('resolveDynamicRoutePath preserves @ in values', () => {
  const path = resolveDynamicRoutePath('/pkg/:name', ['name'], {
    name: '@user',
  });
  assertEquals(path, '/pkg/@user');
});

Deno.test('resolveDynamicRoutePath rejects path traversal', () => {
  assertThrows(() => resolveDynamicRoutePath('/x/:p', ['p'], { p: '../etc' }));
});

Deno.test('routePatternToURLPatternPath covers exact, param and catch-all patterns (#556, #856)', () => {
  // Exact and plain param segments are already valid URLPattern pathnames.
  assertEquals(routePatternToURLPatternPath('/form'), '/form');
  assertEquals(routePatternToURLPatternPath('/item/:id'), '/item/:id');
  // The Hono-style `:name{regex}` catch-all rewrites to URLPattern `:name(regex)`.
  assertEquals(routePatternToURLPatternPath('/docs/:path{.+}'), '/docs/:path(.+)');
});

Deno.test('parseRouteFilePath maps a catch-all segment to a named Hono regex param (#556)', () => {
  assertEquals(parseRouteFilePath('docs/[...path].ts'), '/docs/:path{.+}');
  assertEquals(parseRouteFilePath('item/[id].ts'), '/item/:id');
});

Deno.test('renderRequestTimeServerModule mounts the entry openElementHandler (#858)', () => {
  const code = renderRequestTimeServerModule([{ path: '/live', paramNames: [] }]);
  // The generated server entry delegates to the entry's openElementHandler
  // export, which carries the composed middleware.use chain when configured —
  // no direct app.fetch bypass.
  assertStringIncludes(code, "import { openElementHandler } from './entry.js';");
  assertStringIncludes(code, 'handler: openElementHandler,');
  assertEquals(code.includes('app.fetch'), false);
});

Deno.test('renderStandaloneServerModule fails fast below the URLPattern floor (#969)', () => {
  const code = renderStandaloneServerModule();
  // The generated route table in ./index.js builds WHATWG URLPattern objects
  // at module scope; Node.js only gained the global in v24 (node:url export
  // in v23.8). serve.mjs must check the floor and exit with guidance before
  // importing ./index.js — not die with a raw ReferenceError.
  assertStringIncludes(code, "typeof globalThis.URLPattern === 'undefined'");
  assertStringIncludes(code, "await import('node:url')");
  assertStringIncludes(code, 'Node.js >= 24');
  assertStringIncludes(code, "await import('./index.js')");
  // The dynamic import is load-bearing: a static import would evaluate
  // ./index.js (and its URLPattern constructions) before the floor check.
  assertEquals(code.includes("from './index.js'"), false);
});

Deno.test('renderStandaloneServerModule MIME table matches static-serve.ts (#732-class drift guard)', () => {
  const code = renderStandaloneServerModule();
  // serve.mjs is self-contained and cannot import the shared table, so pin
  // every value instead — a drift here once served CSS without a charset.
  for (
    const ext of [
      '.html',
      '.js',
      '.mjs',
      '.css',
      '.json',
      '.svg',
      '.png',
      '.jpg',
      '.jpeg',
      '.webp',
      '.ico',
      '.xml',
      '.woff2',
      '.txt',
    ]
  ) {
    assertStringIncludes(code, `'${ext}': '${contentTypeFor(`x${ext}`)}'`);
  }
});
