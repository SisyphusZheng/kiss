import { assertThrows } from '@std/assert';
import { assertCompatibilityDate } from './compatibility-date.ts';

Deno.test('compatibility date accepts a current project date', () => {
  assertCompatibilityDate('2026-06-12', new Date('2026-07-15T12:00:00Z'));
});

Deno.test('compatibility date rejects future and stale dates', () => {
  assertThrows(
    () => assertCompatibilityDate('2026-07-16', new Date('2026-07-15T12:00:00Z')),
    Error,
    'future',
  );
  assertThrows(
    () => assertCompatibilityDate('2025-01-01', new Date('2026-07-15T12:00:00Z')),
    Error,
    'maximum',
  );
});
