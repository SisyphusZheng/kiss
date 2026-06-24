import { assertEquals } from 'jsr:@std/assert@1';
import {
  __internal_popData,
  __internal_pushActionData,
  __internal_pushLoaderData,
  useActionData,
  useLoaderData,
} from '../data-context.ts';

Deno.test('data-context: useLoaderData returns undefined by default', () => {
  assertEquals(useLoaderData(), undefined);
});

Deno.test('data-context: useLoaderData returns pushed loader data', () => {
  const testData = { message: 'hello', count: 42 };
  __internal_pushLoaderData(testData);
  const result = useLoaderData<{ message: string; count: number }>();
  assertEquals(result, testData);
  __internal_popData();
});

Deno.test('data-context: useLoaderData with typed access', () => {
  const testData = { message: 'hello' };
  __internal_pushLoaderData(testData);
  const result = useLoaderData<{ message: string }>();
  assertEquals(result.message, 'hello');
  __internal_popData();
});

Deno.test('data-context: useActionData returns undefined by default', () => {
  assertEquals(useActionData(), undefined);
});

Deno.test('data-context: useActionData returns pushed action data', () => {
  const actionData = { ok: true, name: 'test' };
  __internal_pushLoaderData({});
  __internal_pushActionData(actionData);
  const result = useActionData<{ ok: boolean; name: string }>();
  assertEquals(result, actionData);
  __internal_popData();
});

Deno.test('data-context: action data is scoped to current render', () => {
  __internal_pushLoaderData({ phase: 'first' });
  __internal_pushActionData({ ok: true });
  assertEquals(useLoaderData<{ phase: string }>().phase, 'first');
  assertEquals(useActionData<{ ok: boolean }>()?.ok, true);
  __internal_popData();

  __internal_pushLoaderData({ phase: 'second' });
  assertEquals(useLoaderData<{ phase: string }>().phase, 'second');
  assertEquals(useActionData(), undefined);
  __internal_popData();
});

Deno.test('data-context: nested renders keep outer data after inner pop', () => {
  __internal_pushLoaderData({ level: 'outer' });
  assertEquals(useLoaderData<{ level: string }>().level, 'outer');

  __internal_pushLoaderData({ level: 'inner' });
  assertEquals(useLoaderData<{ level: string }>().level, 'inner');
  __internal_popData();

  assertEquals(useLoaderData<{ level: string }>().level, 'outer');
  __internal_popData();
});
