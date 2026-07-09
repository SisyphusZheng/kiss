import { assert, assertEquals } from '@std/assert';
import { DANGEROUS_KEYS, injectPropsSafe } from '../src/security.ts';

Deno.test('injectPropsSafe: sets normal props', () => {
  const target: Record<string, unknown> = {};
  injectPropsSafe(target, { a: 1, b: 'x' }, 'my-el');
  assertEquals(target.a, 1);
  assertEquals(target.b, 'x');
});

Deno.test('injectPropsSafe: skips dangerous prototype-pollution keys', () => {
  const target: Record<string, unknown> = {};
  // JSON.parse-style own "__proto__" key is the real attack vector (an object
  // literal `{ __proto__: ... }` would instead set the prototype, not a key).
  const props: Record<string, unknown> = { ok: 'yes' };
  Object.defineProperty(props, '__proto__', {
    value: { polluted: true },
    enumerable: true,
    configurable: true,
  });
  const warnings: string[] = [];
  const log = { warn: (m: string) => warnings.push(m), debug: () => {} };
  injectPropsSafe(target, props, 'my-el', log);

  // The dangerous key must never be assigned (would mutate Object.prototype).
  assert(!('polluted' in target));
  assertEquals(target.ok, 'yes');
  assert(warnings.some((w) => w.includes('__proto__')));
  assert(DANGEROUS_KEYS.has('__proto__'));
});

Deno.test('injectPropsSafe: tolerates read-only props without throwing', () => {
  const target: Record<string, unknown> = {};
  Object.defineProperty(target, 'frozen', {
    get() {
      return 1;
    },
    set() {
      throw new Error('read-only');
    },
    configurable: true,
  });
  const debugs: string[] = [];
  const log = { warn: () => {}, debug: (m: string) => debugs.push(m) };
  injectPropsSafe(target, { frozen: 2, ok: 'yes' }, 'my-el', log);

  assertEquals(target.ok, 'yes');
  assert(debugs.some((d) => d.includes('read-only')));
});
