import { assertEquals } from 'jsr:@std/assert@1';
import {
  __internal_clearActionData,
  __internal_setActionData,
  __internal_setLoaderData,
  useActionData,
  useLoaderData,
} from '../data-context.ts';

Deno.test('data-context: useLoaderData returns undefined by default', () => {
  __internal_setLoaderData(undefined);
  assertEquals(useLoaderData(), undefined);
});

Deno.test('data-context: useLoaderData returns set loader data', () => {
  const testData = { message: 'hello', count: 42 };
  __internal_setLoaderData(testData);
  const result = useLoaderData<{ message: string; count: number }>();
  assertEquals(result, testData);
});

Deno.test('data-context: useLoaderData with typed access', () => {
  const testData = { message: 'hello' };
  __internal_setLoaderData(testData);
  const result = useLoaderData<{ message: string }>();
  assertEquals(result.message, 'hello');
});

Deno.test('data-context: useActionData returns undefined by default', () => {
  __internal_setActionData(undefined);
  assertEquals(useActionData(), undefined);
});

Deno.test('data-context: useActionData returns set action data', () => {
  const actionData = { ok: true, name: 'test' };
  __internal_setActionData(actionData);
  const result = useActionData<{ ok: boolean; name: string }>();
  assertEquals(result, actionData);
});

Deno.test('data-context: clearActionData resets action data', () => {
  __internal_setActionData({ ok: true });
  __internal_clearActionData();
  assertEquals(useActionData(), undefined);
});

Deno.test('data-context: set then read loader data in sequence', () => {
  __internal_setLoaderData({ phase: 'first' });
  assertEquals(useLoaderData<{ phase: string }>().phase, 'first');

  __internal_setLoaderData({ phase: 'second' });
  assertEquals(useLoaderData<{ phase: string }>().phase, 'second');
});
