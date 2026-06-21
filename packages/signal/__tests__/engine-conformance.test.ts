import { assertEquals } from 'jsr:@std/assert@^1.0.0';
import { createPreactEngine } from '../src/preact-engine.ts';
import type { SignalEngine } from '../src/types.ts';

const engines: Array<[string, () => SignalEngine]> = [
  ['preact', createPreactEngine],
];

function waitForEffects(ms = 20): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

for (const [name, createEngine] of engines) {
  Deno.test(`SignalEngine conformance: ${name} signal read/write and subscribe`, async () => {
    const engine = createEngine();
    const count = engine.signal(1);
    const values: number[] = [];
    const unsubscribe = count.subscribe((value) => values.push(value));

    assertEquals(count.value, 1);
    count.value = 2;
    await waitForEffects();
    assertEquals(count.value, 2);
    assertEquals(values.includes(1), true);
    assertEquals(values.includes(2), true);

    unsubscribe();
    count.value = 3;
    await waitForEffects();
    assertEquals(values.includes(3), false);
  });

  Deno.test(`SignalEngine conformance: ${name} computed tracks dependencies`, () => {
    const engine = createEngine();
    const count = engine.signal(2);
    const doubled = engine.computed(() => count.value * 2);

    assertEquals(doubled.value, 4);
    count.value = 5;
    assertEquals(doubled.value, 10);
  });

  Deno.test(`SignalEngine conformance: ${name} effect cleanup and dispose`, async () => {
    const engine = createEngine();
    const count = engine.signal(0);
    const observed: number[] = [];
    const cleanups: number[] = [];

    const dispose = engine.effect(() => {
      const value = count.value;
      observed.push(value);
      return () => cleanups.push(value);
    });

    count.value = 1;
    await waitForEffects();
    dispose();
    count.value = 2;
    await waitForEffects();

    assertEquals(observed.includes(0), true);
    assertEquals(observed.includes(1), true);
    assertEquals(observed.includes(2), false);
    assertEquals(cleanups.includes(0), true);
    assertEquals(cleanups.includes(1), true);
  });
}

// ─── Default engine tests ───────────────────────────────────────

Deno.test('Default engine is @preact/signals-core', () => {
  const { signal: s, computed: c } = createPreactEngine();
  const count = s(2);
  const doubled = c(() => count.value * 2);
  assertEquals(doubled.value, 4);
  count.value = 10;
  assertEquals(doubled.value, 20);
});
