import { assertEquals, assertThrows } from '@std/assert';
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

Deno.test('renderDsd rethrows control-flow throws (notFound/redirect) instead of falling back (#922)', async () => {
  class NotFoundComponent {
    static tagName = 'x-notfound';
    render(): unknown {
      // Duck-typed OpenElementNotFound (app package class; element must not
      // depend on app) — same shape the request-time handler recognizes.
      const err = new Error('nope') as unknown as { name: string; status: number };
      err.name = 'OpenElementNotFound';
      err.status = 404;
      throw err;
    }
  }

  try {
    await renderDsd(NotFoundComponent as unknown as CustomElementConstructor);
    assertEquals(true, false, 'expected control-flow throw to propagate');
  } catch (err) {
    assertEquals((err as { name?: unknown }).name, 'OpenElementNotFound');
  }
});
