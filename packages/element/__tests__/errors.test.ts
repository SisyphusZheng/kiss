import { assertEquals } from '@std/assert';
import {
  OpenElementError,
  reportError,
  resetErrorTelemetryHookForTests,
  setErrorTelemetryHook,
} from '../src/internal/core/errors.ts';

Deno.test('setErrorTelemetryHook is reconfigurable (#1099)', () => {
  resetErrorTelemetryHookForTests();
  try {
    let received: string | null = null;
    setErrorTelemetryHook((e) => {
      received = e.message;
    });
    let replacement = '';
    setErrorTelemetryHook((error) => {
      replacement = error.message;
    });
    reportError(new OpenElementError('boom'));
    assertEquals(received, null);
    assertEquals(replacement, 'boom');
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

// The legacy renderDsd telemetry-routing and control-flow-rethrow tests were
// deleted with the legacy renderer: the 0.44 renderDsd (public-runtime.ts)
// fails closed for uncompiled classes and never invokes component code, so
// there is no render error to route. Fail-closed coverage:
// __tests__/compiled-runtime/facade.test.ts ('renderDsd fails closed').
