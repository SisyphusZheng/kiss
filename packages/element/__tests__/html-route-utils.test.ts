import { assertEquals, assertStringIncludes } from '@std/assert';
import { insertBeforeBodyClose } from '../src/build-utils.ts';

Deno.test('shared body injector handles tolerant close tags and missing body (#1103)', () => {
  const tag = '<script type="module" src="/client.js"></script>';
  const spaced = insertBeforeBodyClose('<html><body>x</body ></html>', tag);
  assertEquals(spaced, `<html><body>x${tag}\n</body ></html>`);

  const uppercase = insertBeforeBodyClose('<BODY>x</BODY>', tag);
  assertEquals(uppercase, `<BODY>x${tag}\n</BODY>`);

  assertStringIncludes(insertBeforeBodyClose('<main>x</main>', tag), tag);
});
