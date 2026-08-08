import { assert, assertEquals } from 'jsr:@std/assert';
import { ElementParams } from '../src/open-element-params.ts';
import { ElementLifecycle } from '../src/open-element-lifecycle.ts';
import { attachFormInternals } from '../src/open-element-form.ts';

// ─── ElementParams (#904) ────────────────────────────────────────────

class ParamsHost {
  #attributes = new Map<string, string>();
  get tagName() {
    return 'x-test';
  }
  getAttribute(name: string): string | null {
    return this.#attributes.get(name) ?? null;
  }
}

Deno.test('params: attribute parsed into reactive box', () => {
  const host = new ParamsHost() as unknown as HTMLElement;
  (host as { getAttribute(name: string): string | null }).getAttribute = (name) =>
    name === 'params' ? '{"id":"7"}' : null;
  const params = new ElementParams();
  assert(params.syncFromAttribute(host));
  assertEquals(params.value, { id: '7' });
});

Deno.test('params: missing attribute is a no-op', () => {
  const host = new ParamsHost() as unknown as HTMLElement;
  const params = new ElementParams();
  assert(!params.syncFromAttribute(host));
  assertEquals(params.value, {});
});

Deno.test('params: oversized attribute logs instead of throwing', () => {
  const host = new ParamsHost() as unknown as HTMLElement;
  (host as { getAttribute(name: string): string | null }).getAttribute = () =>
    `{"pad":"${'x'.repeat(64 * 1024)}"}`;
  const params = new ElementParams();
  // The guard throws OpenElementError internally; syncFromAttribute catches it.
  assert(params.syncFromAttribute(host));
  assertEquals(params.value, {});
});

Deno.test('params: setter copies, getter returns the copy', () => {
  const params = new ElementParams();
  const source = { a: '1' };
  params.value = source;
  source.a = 'mutated';
  assertEquals(params.value, { a: '1' });
});

// ─── ElementLifecycle (#904) ─────────────────────────────────────────

Deno.test('lifecycle: dispose aborts the signal and starts fresh', () => {
  const lifecycle = new ElementLifecycle();
  const first = lifecycle.signal;
  lifecycle.dispose();
  assert(first.aborted);
  assert(!lifecycle.signal.aborted);
});

Deno.test('lifecycle: setTimeout is cleared on dispose', async () => {
  const lifecycle = new ElementLifecycle();
  let fired = false;
  lifecycle.setTimeout(() => {
    fired = true;
  }, 10);
  lifecycle.dispose();
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert(!fired, 'timer must be cleared on dispose');
});

Deno.test('lifecycle: setTimeout fires when not disposed', async () => {
  const lifecycle = new ElementLifecycle();
  let fired = false;
  lifecycle.setTimeout(() => {
    fired = true;
  }, 5);
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert(fired);
});

// ─── attachFormInternals (#904) ──────────────────────────────────────

Deno.test('form: attaches internals only when opted in', () => {
  const fakeInternals = {} as ElementInternals;
  const withAttach = {
    attachInternals: () => fakeInternals,
  };
  assertEquals(attachFormInternals(withAttach, { formAssociated: true }), fakeInternals);
  assertEquals(attachFormInternals(withAttach, {}), undefined);
  assertEquals(attachFormInternals({}, { formAssociated: true }), undefined);
});
