import { assertEquals } from '@std/assert';
import { createPreactEngine } from '../../src/internal/signal/preact-engine.ts';
import { createTestEngine } from '../../src/internal/signal/test-engine.ts';
import type { SignalEngine } from '../../src/internal/protocol/signal.ts';

function exerciseEngine(engine: SignalEngine, batched: boolean): string[] {
  const source = engine.signal(1);
  const doubled = engine.computed(() => source.value * 2);
  const events: string[] = [];
  const dispose = engine.effect(() => {
    events.push(`run:${doubled.value}`);
    return () => events.push('cleanup');
  });

  if (batched) {
    (engine as SignalEngine & { batch(run: () => void): void }).batch(() => {
      source.value = 2;
      source.value = 3;
    });
  } else {
    source.value = 2;
    source.value = 3;
  }
  dispose();
  return events;
}

Deno.test('alternate SignalEngine preserves computed ordering, batching, and cleanup', () => {
  assertEquals(exerciseEngine(createTestEngine(), true), [
    'run:2',
    'cleanup',
    'run:6',
    'cleanup',
  ]);
});

Deno.test('default and alternate engines expose the same non-batched effect contract', () => {
  assertEquals(exerciseEngine(createTestEngine(), false), [
    'run:2',
    'cleanup',
    'run:4',
    'cleanup',
    'run:6',
    'cleanup',
  ]);
  assertEquals(exerciseEngine(createPreactEngine(), false), [
    'run:2',
    'cleanup',
    'run:4',
    'cleanup',
    'run:6',
    'cleanup',
  ]);
});
