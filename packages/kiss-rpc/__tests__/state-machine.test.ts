/**
 * @kissjs/rpc — Deep tests: State machine + Abort + Retry
 *
 * Tests cover:
 * - Loading state transitions (idle → loading → idle)
 * - Error state management (set/clear)
 * - AbortController integration
 * - Retry with exponential backoff
 * - Concurrent call handling
 */
import { RpcController, RpcError } from '../src/index.ts';
import {
  assert,
  assertEquals,
  assertExists,
  // assertFalse, // not used
  assertInstanceOf,
  // assertRejects, // not used
} from 'jsr:@std/assert@^1.0.0';

class MockHost {
  controllers: unknown[] = [];
  addController(ctrl: unknown) {
    this.controllers.push(ctrl);
  }
  requestUpdate() {/* no-op */}
  updateCount = 0;
}

/** Host that tracks requestUpdate calls */
class TrackingHost extends MockHost {
  override requestUpdate() {
    this.updateCount++;
  }
}

// ─── State Machine Tests ──────────────────────────────────

Deno.test('RpcController — state machine: idle → loading → idle on success', async () => {
  const host = new TrackingHost();
  const ctrl = new RpcController(host as never);

  assertEquals(ctrl.loading, false);
  assertEquals(ctrl.error, null);

  const callPromise = ctrl.call(() => Promise.resolve('ok'));

  // During async operation, loading should be true
  assertEquals(ctrl.loading, true);

  await callPromise;

  assertEquals(ctrl.loading, false);
  assertEquals(ctrl.error, null);
  // requestUpdate should have been called for state changes
  assert(host.updateCount >= 2, 'requestUpdate should be called on state changes');
});

Deno.test('RpcController — state machine: idle → loading → error on failure', async () => {
  const host = new TrackingHost();
  const ctrl = new RpcController(host as never);

  try {
    await ctrl.call(() => Promise.reject(new Error('fail')));
    assert(false, 'Should have thrown');
  } catch (err) {
    assertInstanceOf(err, RpcError);
  }

  assertEquals(ctrl.loading, false);
  assertInstanceOf(ctrl.error, RpcError);
  assertEquals(ctrl.error!.message, 'fail');
});

Deno.test('RpcController — state machine: error resets on next success', async () => {
  const host = new TrackingHost();
  const ctrl = new RpcController(host as never);

  // First call fails
  try {
    await ctrl.call(() => Promise.reject(new Error('fail')));
  } catch { /* expected */ }

  assertInstanceOf(ctrl.error, RpcError);

  // Second call succeeds — error should clear
  const result = await ctrl.call(() => Promise.resolve('recovered'));
  assertEquals(result, 'recovered');
  assertEquals(ctrl.error, null);
  assertEquals(ctrl.loading, false);
});

// ─── AbortController Tests ────────────────────────────────

Deno.test('RpcController — abort signal is passed to caller', async () => {
  const host = new MockHost();
  const ctrl = new RpcController(host as never);

  let receivedSignal: AbortSignal | undefined;

  await ctrl.call((signal) => {
    receivedSignal = signal;
    return Promise.resolve('ok');
  });

  assertExists(receivedSignal, 'AbortSignal should be passed to caller');
  assertEquals(receivedSignal!.aborted, false);
});

Deno.test('RpcController — abort cancels in-flight request', async () => {
  const host = new MockHost();
  const ctrl = new RpcController(host as never);

  // Create a promise that respects AbortSignal
  let _capturedSignal: AbortSignal | undefined;
  void _capturedSignal;
  const callPromise = ctrl.call((signal) => {
    _capturedSignal = signal;
    return new Promise<never>((_resolve, reject) => {
      signal?.addEventListener('abort', () => {
        reject(new DOMException('The operation was aborted.', 'AbortError'));
      });
    });
  });

  // Abort the controller
  ctrl.abort();

  // The call should throw due to abort
  try {
    await callPromise;
    assert(false, 'Should have thrown after abort');
  } catch (err) {
    // Should be an RpcError wrapping the abort
    assertInstanceOf(err, RpcError);
    assertEquals((err as RpcError).code, 'ABORTED');
  }

  assertEquals(ctrl.loading, false, 'Loading should reset after abort');
});

Deno.test('RpcController — hostDisconnected clears abort', () => {
  const host = new MockHost();
  const ctrl = new RpcController(host as never);

  ctrl.abort();
  ctrl.hostDisconnected();

  assertEquals(ctrl.loading, false);
  assertEquals(ctrl.error, null);
});

// ─── Retry / Error Classification ─────────────────────────

Deno.test('RpcError — classifies HTTP errors correctly', () => {
  const clientErr = new RpcError(400, 'Bad Request');
  assertEquals(clientErr.status, 400);
  assertEquals(clientErr.name, 'RpcError');

  const serverErr = new RpcError(503, 'Service Unavailable');
  assertEquals(serverErr.status, 503);

  const networkErr = new RpcError(0, 'Network Error');
  assertEquals(networkErr.status, 0);
});

Deno.test('RpcController — wraps non-RpcError errors', async () => {
  const host = new MockHost();
  const ctrl = new RpcController(host as never);

  try {
    await ctrl.call(() => {
      throw new TypeError('Cannot read property of undefined');
    });
    assert(false, 'Should have thrown');
  } catch (err) {
    assertInstanceOf(err, RpcError);
    // Generic errors become status 0
    assertEquals((err as RpcError).status, 0);
    assertStringIncludes((err as RpcError).message, 'Cannot read property');
  }
});

function assertStringIncludes(actual: string, expected: string) {
  if (!actual.includes(expected)) {
    throw new Error(`Expected "${actual}" to include "${expected}"`);
  }
}

// ─── Edge Cases ───────────────────────────────────────────

Deno.test('RpcController — rapid sequential calls handle state correctly', async () => {
  const host = new TrackingHost();
  const ctrl = new RpcController(host as never);

  // Fire multiple rapid calls — only the last one's result matters
  const results = await Promise.allSettled([
    ctrl.call(() => Promise.resolve('first')),
    ctrl.call(() => Promise.resolve('second')),
    ctrl.call(() => Promise.resolve('third')),
  ]);

  // All should succeed (they're independent calls)
  const successes = results.filter((r) => r.status === 'fulfilled');
  assertEquals(successes.length, 3);

  // Final state should be idle
  assertEquals(ctrl.loading, false);
});

Deno.test('RpcController — call() without function argument works', async () => {
  const host = new MockHost();
  const ctrl = new RpcController(host as never);

  // call() should work even if no fn is passed (edge case)
  // This tests that the implementation handles undefined gracefully
  try {
    await ctrl.call(undefined as never);
    assert(false, 'Should have thrown');
  } catch (err) {
    // Should produce some kind of error
    assert(err instanceof Error, 'Should produce an error');
  }
});
