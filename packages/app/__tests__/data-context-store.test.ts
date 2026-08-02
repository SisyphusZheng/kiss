import { assertEquals, assertThrows } from '@std/assert';
import {
  createRenderDataContext,
  currentLoaderData,
  MAX_DATA_CONTEXT_DEPTH,
  popData,
  pushActionData,
  pushLoaderData,
} from '../src/internal/router/data-context-store.ts';
import {
  __activeDataContext,
  __enterDataContext,
  __exitDataContext,
} from '../src/internal/router/data-context-store.ts';
import { useActionData, useLoaderData } from '../src/internal/router/data-context.ts';

Deno.test('data context enforces a depth of 50 without leaking the rejected frame', () => {
  const ctx = createRenderDataContext();
  try {
    for (let index = 0; index < MAX_DATA_CONTEXT_DEPTH; index++) pushLoaderData(ctx, index);
    assertThrows(() => pushLoaderData(ctx, 'overflow'), Error, 'Data context stack overflow');
    assertEquals(currentLoaderData(ctx), MAX_DATA_CONTEXT_DEPTH - 1);
  } finally {
    for (let index = 0; index < MAX_DATA_CONTEXT_DEPTH; index++) popData(ctx);
  }
  assertEquals(currentLoaderData(ctx), undefined);
});

Deno.test('data contexts are isolated per render (no cross-request leakage)', () => {
  const a = createRenderDataContext();
  const b = createRenderDataContext();
  pushLoaderData(a, 'A');
  pushLoaderData(b, 'B');
  assertEquals(currentLoaderData(a), 'A');
  assertEquals(currentLoaderData(b), 'B');
  popData(b);
  assertEquals(currentLoaderData(a), 'A');
  assertEquals(currentLoaderData(b), undefined);
});

Deno.test('useLoaderData reads the active per-render context, not a process global', () => {
  const ctx = createRenderDataContext();
  __enterDataContext(ctx);
  pushLoaderData(ctx, { message: 'hello' });
  pushActionData(ctx, { ok: true });
  try {
    assertEquals(useLoaderData<{ message: string }>(), { message: 'hello' });
    assertEquals(useActionData<{ ok: boolean }>(), { ok: true });
  } finally {
    __exitDataContext();
  }
  // After leaving the render scope the hooks read an empty (null) context.
  assertEquals(useLoaderData(), undefined);
  assertEquals(useActionData(), undefined);
  assertEquals(__activeDataContext().stack.length, 0);
});

Deno.test('useLoaderData types undefined into the return instead of erasing it (#763)', () => {
  // Type-level: loader-less routes / outside render scope legitimately yield
  // undefined, so the hook's return type must include it (aligned with
  // useActionData) — dereferencing requires a narrowing check.
  const data: { message: string } | undefined = useLoaderData<{ message: string }>();
  assertEquals(data, undefined);
});
