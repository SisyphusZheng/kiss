/**
 * @openelement/core — DataAdapter unit tests (Deno)
 */
import { assertEquals } from 'jsr:@std/assert@^1.0.0';
import { type DataAdapter, MemoryDataAdapter } from '../src/index.ts';

Deno.test('MemoryDataAdapter - get existing key', async () => {
  const adapter = new MemoryDataAdapter([['a', 1], ['b', 2]]);
  assertEquals(await adapter.get('a'), 1);
});

Deno.test('MemoryDataAdapter - get missing key returns undefined', async () => {
  const adapter = new MemoryDataAdapter<string>();
  assertEquals(await adapter.get('missing'), undefined);
});

Deno.test('MemoryDataAdapter - keys returns all', async () => {
  const adapter = new MemoryDataAdapter([['a', 1], ['b', 2]]);
  const keys = await adapter.keys!();
  assertEquals(keys.length, 2);
});

Deno.test('MemoryDataAdapter - set and delete', () => {
  const adapter = new MemoryDataAdapter<string>();
  adapter.set('k', 'v');
  assertEquals(adapter.size, 1);
  adapter.delete('k');
  assertEquals(adapter.size, 0);
});

Deno.test('MemoryDataAdapter - empty adapter', async () => {
  const adapter = new MemoryDataAdapter();
  assertEquals(adapter.size, 0);
  assertEquals(await adapter.keys!(), []);
});

Deno.test('DataAdapter type — generic inference', () => {
  const adapter: DataAdapter<{ id: number }> = new MemoryDataAdapter();
  assertEquals(adapter.name, 'memory');
});
