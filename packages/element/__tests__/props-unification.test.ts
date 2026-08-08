import { assertEquals } from '@std/assert';
import { collectPublicProps, normalizePublicProps } from '../src/internal/core/props-utils.ts';
import { collectPropBindings } from '../src/internal/core/jsx-render-dom.ts';
import { isDangerousKey } from '../src/internal/core/security.ts';
import type { BindingDescriptor } from '../src/internal/core/binding-descriptor.ts';

// #903: SSR and CSR prop-collection paths must filter the same key set, so a
// security fix cannot land on one path and be missed on the other.

const DANGEROUS = ['__proto__', 'constructor', 'toString', 'hasOwnProperty', 'valueOf'];
const INTERNAL = ['__openElementState', '__openElementHmr'];
const SAFE = ['class', 'style', 'aria-label'];

const FIXTURE: Record<string, unknown> = Object.fromEntries([
  ...DANGEROUS.map((k) => [k, 'x'] as [string, unknown]),
  ...INTERNAL.map((k) => [k, 1] as [string, unknown]),
  ...SAFE.map((k) => [k, 'v'] as [string, unknown]),
]);

Deno.test('isDangerousKey covers the prototype-pollution key set', () => {
  for (const key of DANGEROUS) {
    assertEquals(isDangerousKey(key), true, `expected ${key} to be dangerous`);
  }
  assertEquals(isDangerousKey('class'), false);
  assertEquals(isDangerousKey('onclick'), false);
});

Deno.test('normalizePublicProps strips dangerous + internal keys, keeps the rest', () => {
  const clean = normalizePublicProps(FIXTURE);
  assertEquals(Object.keys(clean).sort(), [...SAFE].sort());
});

Deno.test('SSR path (collectPublicProps) filters identically to the shared core', () => {
  const host = { ...FIXTURE } as unknown as object;
  assertEquals(Object.keys(collectPublicProps(host)).sort(), [...SAFE].sort());
});

Deno.test('CSR path (collectPropBindings) skips dangerous + internal keys', () => {
  const el = { localName: 'div', setAttribute: () => {} } as unknown as Element;
  const descriptors = collectPropBindings(el, FIXTURE);
  for (const desc of descriptors as BindingDescriptor[]) {
    const key = (desc as { attrName?: string }).attrName ?? '';
    assertEquals(DANGEROUS.includes(key), false, `dangerous key ${key} was bound`);
  }
  const bound = descriptors.map((d) => (d as { attrName?: string }).attrName);
  assertEquals(bound, ['class', 'style', 'aria-label']);
});
