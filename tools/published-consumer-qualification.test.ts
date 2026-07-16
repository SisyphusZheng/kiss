import { assertEquals, assertThrows } from '@std/assert';
import { parseQualificationOptions } from './published-consumer-qualification.ts';

Deno.test('published-consumer qualification defaults to the current published package line', () => {
  assertEquals(
    parseQualificationOptions([], { OPEN_ELEMENT_PUBLISHED_VERSION: '0.41.0-alpha.14' }),
    {
      mode: 'all',
      reportPath: 'published-consumer-report.json',
      version: '0.41.0-alpha.14',
    },
  );
});

Deno.test('published-consumer qualification accepts an explicit version and isolated mode', () => {
  assertEquals(
    parseQualificationOptions(
      ['--mode', 'starter', '--version', '0.41.0-alpha.15', '--report', 'artifacts/report.json'],
      {},
    ),
    {
      mode: 'starter',
      reportPath: 'artifacts/report.json',
      version: '0.41.0-alpha.15',
    },
  );
});

Deno.test('published-consumer qualification rejects an unknown mode', () => {
  assertThrows(
    () => parseQualificationOptions(['--mode', 'browser'], {}),
    Error,
    '--mode must be starter, runtime, or all',
  );
});
