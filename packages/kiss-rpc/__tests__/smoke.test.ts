/**
 * @kissjs/rpc — Smoke tests
 */
import { RpcController, RpcError } from '../src/index.ts';
import { assert, assertEquals, assertInstanceOf, assertRejects } from 'jsr:@std/assert@^1.0.0';

class MockHost {
  controllers: unknown[] = [];
  addController(ctrl: unknown) {
    this.controllers.push(ctrl);
  }
  requestUpdate() {/* no-op */}
}

Deno.test('RpcError — creates with status and message', () => {
  const err = new RpcError(404, 'Not found');
  assertEquals(err.status, 404);
  assertEquals(err.message, 'Not found');
  assertEquals(err.name, 'RpcError');
});

Deno.test('RpcController — initial state', () => {
  const host = new MockHost();
  const ctrl = new RpcController(host as never);
  assertEquals(ctrl.loading, false);
  assertEquals(ctrl.error, null);
});

Deno.test('RpcController — call() returns result on success', async () => {
  const host = new MockHost();
  const ctrl = new RpcController(host as never);
  const result = await ctrl.call(() => Promise.resolve({ data: 'ok' }));
  assertEquals(result, { data: 'ok' });
  assertEquals(ctrl.loading, false);
  assertEquals(ctrl.error, null);
});

Deno.test('RpcController — call() throws RpcError on failure', async () => {
  const host = new MockHost();
  const ctrl = new RpcController(host as never);
  await assertRejects(
    () => ctrl.call(() => Promise.reject(new RpcError(500, 'Server error'))),
    RpcError,
    'Server error',
  );
});

Deno.test('RpcController — call() wraps generic Error in RpcError', async () => {
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

Deno.test('RpcController — hostDisconnected resets state', () => {
  const host = new MockHost();
  const ctrl = new RpcController(host as never);
  // Access private fields via type assertion for testing
  const internal = ctrl as unknown as { _loading: boolean; _error: RpcError | null };
  internal._loading = true;
  internal._error = new RpcError(500, 'err');
  ctrl.hostDisconnected();
  assertEquals(ctrl.loading, false);
  assertEquals(ctrl.error, null);
});
