import { assertEquals, assertStringIncludes, assertThrows } from '@std/assert';
import {
  renderRequestTimeServerModule,
  resolveDynamicRoutePath,
  routePatternToURLPatternPath,
} from '../src/internal/ssg/ssg-helpers.ts';
import { parseRouteFilePath } from '../src/internal/ssg/route-scanner.ts';

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
