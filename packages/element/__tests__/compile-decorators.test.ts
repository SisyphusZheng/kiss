/**
 * packages/element — #1209 (A10.1) dual-use contract for the canonical
 * compile-time-only decorator intrinsics.
 *
 * `element`/`property` are admitted by the compiler through binding
 * provenance (a runtime named import from '@openelement/element') and are
 * erased from generated code. At runtime they are inert no-ops so modules
 * evaluated WITHOUT the compiler (unit tests, config evaluation) still
 * instantiate safely.
 */

import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { element, property } from '../src/index.ts';

Deno.test('compile-time intrinsics: element/property are exported runtime no-ops', () => {
  assertEquals(typeof element, 'function');
  assertEquals(typeof property, 'function');
  // Applying them the way decorator evaluation would returns inert closures
  // that leave the target untouched and return nothing.
  const classDecorator = element('oe-noop', { root: 'shadow-open' });
  assertEquals(typeof classDecorator, 'function');
  class target {}
  assertEquals(classDecorator(target), undefined);
  const fieldDecorator = property({ reflect: true, attribute: 'x', type: String });
  assertEquals(typeof fieldDecorator, 'function');
  assertEquals(fieldDecorator(undefined, {}), undefined);
});

Deno.test('compile-time intrinsics: a decorated uncompiled class evaluates safely', () => {
  // Mirrors uncompiled consumption: decorators apply as no-ops, the class
  // body defines, and nothing records runtime semantics.
  @element('oe-uncompiled-dual-use')
  class DualUse {
    @property({ reflect: false })
    count = 0;
  }
  const instance = new DualUse();
  assertEquals(instance.count, 0);
  assert(
    !('__partProgram' in DualUse),
    'the no-op decorator must not masquerade as the compiler (no program statics)',
  );
});

Deno.test('compile-time intrinsics: index.ts stays a re-export seam and carries the experimental contract', async () => {
  const source = await Deno.readTextFile(new URL('../src/index.ts', import.meta.url));
  assertStringIncludes(source, "export { element, property } from './public-runtime.ts';");
  assertStringIncludes(source, '@experimental');
  const runtime = await Deno.readTextFile(new URL('../src/public-runtime.ts', import.meta.url));
  assertStringIncludes(
    runtime,
    "export { element, property } from './internal/core/compile-decorators.ts';",
  );
});
