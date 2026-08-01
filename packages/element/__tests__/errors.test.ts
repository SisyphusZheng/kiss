import { assertEquals, assertThrows } from 'jsr:@std/assert@1';
import {
  OpenElementError,
  reportError,
  resetErrorTelemetryHookForTests,
  setErrorTelemetryHook,
} from '../src/internal/core/errors.ts';
import { renderDsd } from '../src/internal/core/render-dsd.ts';

Deno.test('setErrorTelemetryHook throws when called more than once (#644)', () => {
  resetErrorTelemetryHookForTests();
  try {
    let received: string | null = null;
    setErrorTelemetryHook((e) => {
      received = e.message;
    });
    // A second set must surface immediately instead of silently overwriting the
    // existing hook (last-writer-wins across requests/tenants).
    assertThrows(
      () => setErrorTelemetryHook(() => {}),
      Error,
      'already called',
    );
    // The first hook remains wired.
    reportError(new OpenElementError('boom'));
    assertEquals(received, 'boom');
  } finally {
    resetErrorTelemetryHookForTests();
  }
});

Deno.test('reportError falls back to console.error when no hook is set (#644)', () => {
  resetErrorTelemetryHookForTests();
  const original = console.error;
  const messages: string[] = [];
  console.error = (...args: unknown[]) => messages.push(args.join(' '));
  try {
    reportError(new OpenElementError('fallback'));
    assertEquals(messages.length, 1);
    assertEquals(messages[0].includes('fallback'), true);
  } finally {
    console.error = original;
    resetErrorTelemetryHookForTests();
  }
});

Deno.test('renderDsd routes classified render errors through the telemetry hook (#780)', async () => {
  resetErrorTelemetryHookForTests();
  try {
    const received: string[] = [];
    setErrorTelemetryHook((e) => {
      received.push(e.message);
    });

    class BrokenComponent {
      static tagName = 'x-broken';
      render(): unknown {
        throw new Error('boom');
      }
    }

    const output = await renderDsd(BrokenComponent as unknown as CustomElementConstructor);
    assertEquals(output.metrics.hasError, true);
    assertEquals(received.length, 1);
    assertEquals(received[0].includes('boom'), true);
  } finally {
    resetErrorTelemetryHookForTests();
  }
});
