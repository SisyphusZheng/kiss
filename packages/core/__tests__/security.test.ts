import { assertEquals } from 'jsr:@std/assert@^1.0.0';
import { DANGEROUS_KEYS, injectPropsSafe, trustRenderHtml } from '../src/security.ts';

Deno.test('DANGEROUS_KEYS covers prototype-polluting names', () => {
  for (const key of ['__proto__', 'constructor', 'prototype']) {
    assertEquals(DANGEROUS_KEYS.has(key), true);
  }
});

Deno.test('injectPropsSafe assigns normal props', () => {
  class Target {
    count = 0;
  }
  const target = new Target();
  injectPropsSafe(target, { count: 42 }, 'test');
  assertEquals(target.count, 42);
});

Deno.test('injectPropsSafe skips dangerous keys', () => {
  class Target {}
  const target = new Target() as Record<string, unknown>;
  injectPropsSafe(target, { __proto__: { polluted: true }, safe: 'ok' }, 'test');
  assertEquals(target.safe, 'ok');
  assertEquals((target as unknown as { polluted?: boolean }).polluted, undefined);
});

Deno.test('injectPropsSafe ignores read-only assignment errors', () => {
  const target = Object.defineProperty({}, 'locked', {
    value: 1,
    writable: false,
    configurable: true,
  }) as Record<string, unknown>;
  injectPropsSafe(target, { locked: 2, other: 'x' }, 'test');
  assertEquals(target.locked, 1);
  assertEquals(target.other, 'x');
});

Deno.test('trustRenderHtml returns input unchanged', () => {
  assertEquals(trustRenderHtml('<b>ok</b>'), '<b>ok</b>');
});
