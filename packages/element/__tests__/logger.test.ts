import { assertEquals } from 'jsr:@std/assert@1';
import {
  createLogger,
  createWarnScope,
  resetWarnOnceForTests,
  warnOnce,
} from '../src/internal/core/logger.ts';
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

Deno.test('warnOnce with a render scope is isolated to that scope, not process-global', () => {
  const messages: string[] = [];
  const original = console.warn;
  console.warn = (...args: unknown[]) => messages.push(args.join(' '));
  try {
    const logger = createLogger('t');
    const scopeA = createWarnScope();
    warnOnce('k', logger, 'a', scopeA);
    warnOnce('k', logger, 'a-dup', scopeA);
    const scopeB = createWarnScope();
    warnOnce('k', logger, 'b', scopeB);
    assertEquals(messages, ['[t] a', '[t] b']);
  } finally {
    console.warn = original;
  }
});

Deno.test('warnOnce without a scope uses the global fallback and resetWarnOnceForTests clears it', () => {
  const messages: string[] = [];
  const original = console.warn;
  console.warn = (...args: unknown[]) => messages.push(args.join(' '));
  try {
    const logger = createLogger('t2');
    resetWarnOnceForTests();
    warnOnce('gk', logger, 'one');
    warnOnce('gk', logger, 'two');
    assertEquals(messages, ['[t2] one']);
    resetWarnOnceForTests();
    warnOnce('gk', logger, 'three');
    assertEquals(messages, ['[t2] one', '[t2] three']);
  } finally {
    console.warn = original;
  }
});

Deno.test('createWarnScope returns an independent scope per render', () => {
  assertEquals(createWarnScope().warned.size, 0);
  assertEquals(createWarnScope() !== createWarnScope(), true);
});
