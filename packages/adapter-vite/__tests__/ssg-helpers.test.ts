import { assertEquals, assertThrows } from '@std/assert';
import {
  resolveDynamicRoutePath,
  routePatternToRegExpSource,
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

Deno.test('routePatternToRegExpSource covers exact, param and catch-all patterns (#556)', () => {
  assertEquals(routePatternToRegExpSource('/form'), '^/form$');
  assertEquals(routePatternToRegExpSource('/item/:id'), '^/item/([^/]+)$');
  assertEquals(routePatternToRegExpSource('/docs/:path{.+}'), '^/docs/(.+)$');
});

Deno.test('parseRouteFilePath maps a catch-all segment to a named Hono regex param (#556)', () => {
  assertEquals(parseRouteFilePath('docs/[...path].ts'), '/docs/:path{.+}');
  assertEquals(parseRouteFilePath('item/[id].ts'), '/item/:id');
});
