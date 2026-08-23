import { assertEquals, assertStringIncludes } from '@std/assert';
import { insertBeforeBodyClose, normalizeRoutePatternForURLPattern } from '../src/build-utils.ts';

Deno.test('shared route normalizer preserves params and converts Hono catch-alls (#1103)', () => {
  assertEquals(normalizeRoutePatternForURLPattern('/item/:id'), '/item/:id');
  assertEquals(
    normalizeRoutePatternForURLPattern('/docs/:path{.+}'),
    '/docs/:path(.+)',
  );
  assertEquals(
    normalizeRoutePatternForURLPattern('/org/:org/repo/:path{.*}'),
    '/org/:org/repo/:path(.*)',
  );
});

Deno.test('shared body injector handles tolerant close tags and missing body (#1103)', () => {
  const tag = '<script type="module" src="/client.js"></script>';
  const spaced = insertBeforeBodyClose('<html><body>x</body ></html>', tag);
  assertEquals(spaced, `<html><body>x${tag}\n</body ></html>`);

  const uppercase = insertBeforeBodyClose('<BODY>x</BODY>', tag);
  assertEquals(uppercase, `<BODY>x${tag}\n</BODY>`);

  assertStringIncludes(insertBeforeBodyClose('<main>x</main>', tag), tag);
});
