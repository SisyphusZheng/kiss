/**
 * @kissjs/rpc ！ Smoke tests
 */
import { RpcController, RpcError } from '../src/index.ts';
import { assert, assertEquals, assertInstanceOf, assertRejects } from 'jsr:@std/assert@^1.0.0';

class MockHost {
  controllers: unknown[] = [];
  addController(ctrl: unknown) {
    this.controllers.push(ctrl);
  }
  removeController(ctrl: unknown) {
    this.controllers = this.controllers.filter((c) => c !== ctrl);
  }
  requestUpdate() {/* no-op */}
  updateComplete = Promise.resolve(true);
}

Deno.test('RpcError ！ creates with status and message', () => {
  const err = new RpcError(404, 'Not found');
  assertEquals(err.status, 404);
  assertEquals(err.message, 'Not found');
  assertEquals(err.name, 'RpcError');
});

Deno.test('RpcError ！ creates with default code', () => {
  const err = new RpcError(500, 'Server error');
  assertEquals(err.code, 'RPC_ERROR');
  assertEquals(err.details, undefined);
});

Deno.test('RpcError ！ creates with custom code and details', () => {
  const details = [{ field: 'email', message: 'Invalid email' }];
  const err = new RpcError(422, 'Validation failed', 'VALIDATION_ERROR', details);
  assertEquals(err.code, 'VALIDATION_ERROR');
  assertEquals(err.details, details);
});

Deno.test('RpcError ！ toJSON returns structured object', () => {
  const err = new RpcError(404, 'Not found', 'NOT_FOUND');
  const json = err.toJSON();
  assertEquals(json, {
    error: {
      code: 'NOT_FOUND',
      message: 'Not found',
      status: 404,
    },
  });
});

Deno.test('RpcController ！ initial state', () => {
  const host = new MockHost();
  const ctrl = new RpcController(host as never);
  assertEquals(ctrl.loading, false);
  assertEquals(ctrl.error, null);
});

Deno.test('RpcController ！ call() returns result on success', async () => {
  const host = new MockHost();
  const ctrl = new RpcController(host as never);
  const result = await ctrl.call(() => Promise.resolve({ data: 'ok' }));
  assertEquals(result, { data: 'ok' });
  assertEquals(ctrl.loading, false);
  assertEquals(ctrl.error, null);
});

Deno.test('RpcController ！ call() throws RpcError on failure', async () => {
  const host = new MockHost();
  const ctrl = new RpcController(host as never);
  await assertRejects(
    () => ctrl.call(() => Promise.reject(new RpcError(500, 'Server error'))),
    RpcError,
    'Server error',
  );
});

Deno.test('RpcController ！ call() wraps generic Error in RpcError', async () => {
  const host = new MockHost();
  const ctrl = new RpcController(host as never);
  try {
    await ctrl.call(() => Promise.reject(new Error('Network failure')));
    assert(false, 'Should have thrown');
  } catch (err) {
    assertInstanceOf(err, RpcError);
    assertEquals((err as RpcError).status, 0);
    assertEquals((err as RpcError).message, 'Network failure');
  }
});

Deno.test('RpcController ！ hostDisconnected resets state', () => {
  const host = new MockHost();
  const ctrl = new RpcController(host as never);
  const internal = ctrl as unknown as { _loading: boolean; _error: RpcError | null };
  internal._loading = true;
  internal._error = new RpcError(500, 'err');
  ctrl.hostDisconnected();
  assertEquals(ctrl.loading, false);
  assertEquals(ctrl.error, null);
});

Deno.test('RpcController ！ signal returns undefined when no call in progress', () => {
  const host = new MockHost();
  const ctrl = new RpcController(host as never);
  assertEquals(ctrl.signal, undefined);
});

Deno.test('RpcController ！ signal returns AbortSignal during call', async () => {
  const host = new MockHost();
  const ctrl = new RpcController(host as never);
  let capturedSignal: AbortSignal | undefined;
  await ctrl.call((signal) => {
    capturedSignal = signal;
    return Promise.resolve('ok');
  });
  assertInstanceOf(capturedSignal, AbortSignal);
});

Deno.test('RpcController ！ call() wraps non-Error throws in RpcError', async () => {
  const host = new MockHost();
  const ctrl = new RpcController(host as never);
  try {
    await ctrl.call(() => Promise.reject('string error' as never));
    assert(false, 'Should have thrown');
  } catch (err) {
    assertInstanceOf(err, RpcError);
    assertEquals((err as RpcError).status, 0);
    assertEquals((err as RpcError).message, 'Unknown error');
  }
});

Deno.test('RpcController ！ call() handles pre-aborted signal', async () => {
  const host = new MockHost();
  const ctrl = new RpcController(host as never);
  const callPromise = ctrl.call(() =>
    new Promise<string>((resolve) => {
      setTimeout(() => resolve('late'), 10000);
    })
  );
  ctrl.abort();
  try {
    await callPromise;
  } catch {
    // Expected ！ the aborted call may throw
  }
});

Deno.test('RpcController ！ retry with function delay', async () => {
  const host = new MockHost();
  const ctrl = new RpcController(host as never, {
    maxRetries: 1,
    retryDelay: (attempt: number) => attempt * 10,
  });
  let callCount = 0;
  try {
    await ctrl.call(() => {
      callCount++;
      return Promise.reject(new RpcError(500, 'Server error'));
    });
  } catch (err) {
    assertInstanceOf(err, RpcError);
    assertEquals((err as RpcError).status, 500);
  }
  assertEquals(callCount, 2, 'Should have retried once');
});

Deno.test('RpcController ！ does not retry 4xx errors', async () => {
  const host = new MockHost();
  const ctrl = new RpcController(host as never, {
    maxRetries: 3,
    retryDelay: 1,
  });
  let callCount = 0;
  try {
    await ctrl.call(() => {
      callCount++;
      return Promise.reject(new RpcError(400, 'Bad Request'));
    });
  } catch (err) {
    assertInstanceOf(err, RpcError);
    assertEquals((err as RpcError).status, 400);
  }
  assertEquals(callCount, 1, 'Should NOT retry 4xx errors');
});

Deno.test('RpcController ！ retries on 5xx errors then succeeds', async () => {
  const host = new MockHost();
  const ctrl = new RpcController(host as never, {
    maxRetries: 2,
    retryDelay: 1,
  });
  let callCount = 0;
  const result = await ctrl.call(() => {
    callCount++;
    if (callCount < 3) {
      return Promise.reject(new RpcError(503, 'Service Unavailable'));
    }
    return Promise.resolve('recovered');
  });
  assertEquals(result, 'recovered');
  assertEquals(callCount, 3);
  assertEquals(ctrl.error, null);
});

Deno.test('RpcController ！ abort during call produces ABORTED error', async () => {
  const host = new MockHost();
  const ctrl = new RpcController(host as never);
  const callPromise = ctrl.call(() =>
    new Promise<never>((_resolve, reject) => {
      setTimeout(() => reject(new DOMException('Aborted', 'AbortError')), 100);
    })
  );
  ctrl.abort();
  try {
    await callPromise;
    assert(false, 'Should have thrown');
  } catch (err) {
    assertInstanceOf(err, RpcError);
    assertEquals((err as RpcError).code, 'ABORTED');
  }
});

Deno.test('RpcController ！ retry exhaustion with maxRetries', async () => {
  const host = new MockHost();
  const ctrl = new RpcController(host as never, {
    maxRetries: 1,
    retryDelay: 1,
  });
  let callCount = 0;
  try {
    await ctrl.call(() => {
      callCount++;
      return Promise.reject(new RpcError(500, 'Server down'));
    });
  } catch (err) {
    assertInstanceOf(err, RpcError);
    assertEquals((err as RpcError).status, 500);
    assertEquals((err as RpcError).message, 'Server down');
  }
  assertEquals(callCount, 2, 'Should have tried maxRetries+1 times');
  assertInstanceOf(ctrl.error, RpcError);
});
