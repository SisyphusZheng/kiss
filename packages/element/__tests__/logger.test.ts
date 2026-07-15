import { assertEquals } from 'jsr:@std/assert@1';
import { resetWarnOnceForTests, warnOnce } from '../src/internal/core/logger.ts';
import * as publicElement from '../src/index.ts';

Deno.test('warnOnce test reset is internal and restores test isolation', () => {
  const messages: string[] = [];
  const logger = {
    debug: () => {},
    info: () => {},
    warn: (message: string) => messages.push(message),
    error: () => {},
  };

  resetWarnOnceForTests();
  warnOnce('same-key', logger, 'first');
  warnOnce('same-key', logger, 'duplicate');
  resetWarnOnceForTests();
  warnOnce('same-key', logger, 'after reset');

  assertEquals(messages, ['first', 'after reset']);
  assertEquals('resetWarnOnceForTests' in publicElement, false);
});
