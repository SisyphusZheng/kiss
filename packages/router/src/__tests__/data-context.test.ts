import { assertEquals } from 'jsr:@std/assert@1';
import { useActionData, useLoaderData } from '../data-context.ts';
import { popData, pushActionData, pushLoaderData } from '../internal/data-context.ts';

Deno.test('data-context: useLoaderData returns undefined by default', () => {
  assertEquals(useLoaderData(), undefined);
});

Deno.test('data-context: useLoaderData returns pushed loader data', () => {
  const testData = { message: 'hello', count: 42 };
  pushLoaderData(testData);
  const result = useLoaderData<{ message: string; count: number }>();
  assertEquals(result, testData);
  popData();
});

Deno.test('data-context: useLoaderData with typed access', () => {
  const testData = { message: 'hello' };
  pushLoaderData(testData);
  const result = useLoaderData<{ message: string }>();
  assertEquals(result.message, 'hello');
  popData();
});

Deno.test('data-context: useActionData returns undefined by default', () => {
  assertEquals(useActionData(), undefined);
});

Deno.test('data-context: useActionData returns pushed action data', () => {
  const actionData = { ok: true, name: 'test' };
  pushLoaderData({});
  pushActionData(actionData);
  const result = useActionData<{ ok: boolean; name: string }>();
  assertEquals(result, actionData);
  popData();
});

Deno.test('data-context: action data is scoped to current render', () => {
  pushLoaderData({ phase: 'first' });
  pushActionData({ ok: true });
  assertEquals(useLoaderData<{ phase: string }>().phase, 'first');
  assertEquals(useActionData<{ ok: boolean }>()?.ok, true);
  popData();

  pushLoaderData({ phase: 'second' });
  assertEquals(useLoaderData<{ phase: string }>().phase, 'second');
  assertEquals(useActionData(), undefined);
  popData();
});

Deno.test('data-context: nested renders keep outer data after inner pop', () => {
  pushLoaderData({ level: 'outer' });
  assertEquals(useLoaderData<{ level: string }>().level, 'outer');

  pushLoaderData({ level: 'inner' });
  assertEquals(useLoaderData<{ level: string }>().level, 'inner');
  popData();

  assertEquals(useLoaderData<{ level: string }>().level, 'outer');
  popData();
});
