/**
 * @openelement/router/data-context — render-scoped loader/action data stack.
 *
 * These are pure stack operations with no DOM dependency. We verify the
 * push/pop/peek contract, action-data association to the top frame, nested
 * render scoping, and the depth-warning guard.
 */

import { assert, assertEquals } from 'jsr:@std/assert@^1.0.0';
import {
  __internal_popData,
  __internal_pushActionData,
  __internal_pushLoaderData,
  useActionData,
  useLoaderData,
} from '../src/data-context.ts';

// Reset the module-scoped stack between tests so ordering does not leak.
function drainStack(): void {
  // Pop until empty — guarded by try since we cannot read length directly.
  for (let i = 0; i < 16; i++) {
    try {
      __internal_popData();
    } catch {
      break;
    }
  }
}

Deno.test('data-context: useLoaderData reads the top frame loader data', () => {
  drainStack();
  __internal_pushLoaderData({ message: 'hello' });
  try {
    assertEquals(useLoaderData<{ message: string }>(), { message: 'hello' });
  } finally {
    __internal_popData();
  }
});

Deno.test('data-context: useActionData is undefined before any action push', () => {
  drainStack();
  __internal_pushLoaderData({ id: 1 });
  try {
    assertEquals(useActionData(), undefined);
  } finally {
    __internal_popData();
  }
});

Deno.test('data-context: pushActionData associates with the top frame', () => {
  drainStack();
  __internal_pushLoaderData({ id: 1 });
  __internal_pushActionData({ ok: true });
  try {
    assertEquals(useLoaderData(), { id: 1 });
    assertEquals(useActionData(), { ok: true });
  } finally {
    __internal_popData();
  }
});

Deno.test('data-context: pop restores the previous frame', () => {
  drainStack();
  __internal_pushLoaderData('outer');
  __internal_pushLoaderData('inner');
  try {
    assertEquals(useLoaderData(), 'inner');
  } finally {
    __internal_popData();
  }
  assertEquals(useLoaderData(), 'outer');
  __internal_popData();
});

Deno.test('data-context: nested renders scope data independently', () => {
  drainStack();
  __internal_pushLoaderData('a');
  __internal_pushLoaderData('b');
  __internal_pushLoaderData('c');
  try {
    assertEquals(useLoaderData(), 'c');
  } finally {
    __internal_popData();
  }
  try {
    assertEquals(useLoaderData(), 'b');
  } finally {
    __internal_popData();
  }
  assertEquals(useLoaderData(), 'a');
  __internal_popData();
});

Deno.test('data-context: warns when stack depth exceeds 10', () => {
  drainStack();
  let warnCount = 0;
  const originalWarn = console.warn;
  console.warn = () => {
    warnCount++;
  };
  try {
    for (let i = 0; i < 12; i++) {
      __internal_pushLoaderData(i);
    }
    // Depth reaches 11 and 12, each triggering a warning.
    assert(warnCount >= 1, `expected a depth warning, got ${warnCount}`);
    assertEquals(warnCount, 2);
  } finally {
    console.warn = originalWarn;
    drainStack();
  }
});

Deno.test('data-context: empty stack returns undefined for both hooks', () => {
  drainStack();
  assertEquals(useLoaderData(), undefined);
  assertEquals(useActionData(), undefined);
});
