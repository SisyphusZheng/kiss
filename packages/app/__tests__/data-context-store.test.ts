import { assertEquals, assertThrows } from 'jsr:@std/assert@1';
import {
  currentLoaderData,
  MAX_DATA_CONTEXT_DEPTH,
  popData,
  pushLoaderData,
} from '../src/internal/router/data-context-store.ts';

Deno.test('data context enforces a depth of 50 without leaking the rejected frame', () => {
  try {
    for (let index = 0; index < MAX_DATA_CONTEXT_DEPTH; index++) pushLoaderData(index);
    assertThrows(() => pushLoaderData('overflow'), Error, 'Data context stack overflow');
    assertEquals(currentLoaderData(), MAX_DATA_CONTEXT_DEPTH - 1);
  } finally {
    for (let index = 0; index < MAX_DATA_CONTEXT_DEPTH; index++) popData();
  }
  assertEquals(currentLoaderData(), undefined);
});
