/**
 * @openelement/app — adversarial Preact hydration lifecycle tests (#1146, area 2).
 *
 * The smoke suite hydrates into an EMPTY stub root (preact-smoke.test.ts).
 * These cases attack the gaps around clientActivate()/hydrate()/ownership:
 *   2a. First hydration over a shadow root pre-populated with real SSR
 *       children must bind the existing tree (no duplication/replacement),
 *       flow data-ssr-props and signal props, and keep teardown exactly-once.
 *   2b. hydrate → update → real detach → reconnect must keep a single tree,
 *       a single mount per attach, and no leaked effect subscriptions.
 *   2c. Double clientActivate() on the same host (upgrade race) must behave
 *       as an idempotent update through the Preact owner, not a second mount.
 *
 * Stub fidelity note: StubTextNode inherits setAttribute() from StubNode, so
 * it fails preact's hydration matcher, which uses `'setAttribute' in value`
 * to tell elements from text. Preact therefore replaces text children during
 * hydrate where a real browser reuses them. Element identity — the assertion
 * that matters here — is unaffected.
 */

import { assert, assertEquals } from '@std/assert';
import { OpenElement, signal } from '@openelement/element';
import { h } from 'preact';
import { useLayoutEffect } from 'preact/hooks';
import { definePreactIsland } from '../src/preact.ts';
import { installDomStubs, StubNode, StubTextNode } from './dom-stubs.ts';

// ─── Helpers ───────────────────────────────────────────────────────

/** Build a stub shadow root pre-populated with the DSD children SSR emitted. */
function ssrRoot(tag: string, text: string): { root: StubNode; element: StubNode } {
  const root = new StubNode();
  const element = new StubNode(1, tag);
  element.appendChild(new StubTextNode(text) as unknown as Node);
  root.appendChild(element as unknown as Node);
  return { root, element };
}

// ─── 2a. First hydration onto real pre-existing SSR children ───────

Deno.test('Preact adversarial 2a: first hydration binds real SSR children without duplicating them (#1146)', async () => {
  const restore = installDomStubs();
  try {
    const count = signal(0);
    let starts = 0;
    let cleanups = 0;
    const Component = (props: { name?: string; count: { value: number } }) => {
      useLayoutEffect(() => {
        starts++;
        return () => cleanups++;
      }, []);
      return h('p', { class: 'msg' }, `Hello, ${props.name}! Count: ${props.count.value}`);
    };
    const ctor = definePreactIsland('test-adv-ssr-hydrate', Component as never, {
      props: { count } as never,
    });
    const instance = new ctor() as OpenElement & {
      clientActivate: () => void;
      disconnectedCallback: () => void;
      shadowRoot: ShadowRoot | null;
    };

    // Realistic SSR payload: render-dsd.ts serializes hydration props into
    // data-ssr-props, and the shadow root already contains the rendered
    // markup. _Base is locked at module load without HTMLElement, so
    // getAttribute/isConnected are stubbed per-instance (same approach as
    // the attribute stubs in preact-smoke.test.ts).
    let ssrProps: Record<string, unknown> = { name: 'SSR' };
    Object.defineProperty(instance, 'getAttribute', {
      configurable: true,
      value: (name: string) => name === 'data-ssr-props' ? JSON.stringify(ssrProps) : null,
    });
    let connected = true;
    Object.defineProperty(instance, 'isConnected', {
      configurable: true,
      get: () => connected,
    });
    const { root, element } = ssrRoot('P', 'Hello, SSR! Count: 0');
    instance.shadowRoot = root as unknown as ShadowRoot;

    instance.clientActivate();

    // The pre-existing SSR element is bound in place: mounted once, no
    // duplication, no replacement.
    assertEquals(starts, 1);
    assertEquals(cleanups, 0);
    assertEquals(root.childNodes.length, 1);
    assert(root.childNodes[0] === (element as unknown as Node));
    // data-ssr-props and the options signal both flowed into the render.
    assertEquals(root.textContent, 'Hello, SSR! Count: 0');

    // Signal + prop updates re-render through the Preact owner in place.
    count.value = 7;
    ssrProps = { name: 'Client' };
    instance.requestUpdate();
    assertEquals(root.textContent, 'Hello, Client! Count: 7');
    assertEquals(root.childNodes.length, 1);
    assert(root.childNodes[0] === (element as unknown as Node));
    assertEquals(starts, 1);
    assertEquals(cleanups, 0);

    // Teardown stays exactly-once, even under a double-detach storm.
    connected = false;
    instance.disconnectedCallback();
    instance.disconnectedCallback();
    await Promise.resolve();
    await Promise.resolve();
    assertEquals(cleanups, 1);
    assertEquals(starts, 1);
    assertEquals(root.childNodes.length, 0);
  } finally {
    restore();
  }
});

// ─── 2b. Hydrate → update → detach → reconnect ─────────────────────

Deno.test('Preact adversarial 2b: hydrate-update-detach-reconnect keeps one tree and one teardown (#1146)', async () => {
  const restore = installDomStubs();
  try {
    let starts = 0;
    let cleanups = 0;
    const props: { label: string } = { label: 'ssr' };
    const Component = (p: { label?: string }) => {
      useLayoutEffect(() => {
        starts++;
        return () => cleanups++;
      }, []);
      return h('div', null, p.label ?? 'ssr');
    };
    const ctor = definePreactIsland('test-adv-lifecycle', Component as never, { props });
    const instance = new ctor() as OpenElement & {
      clientActivate: () => void;
      disconnectedCallback: () => void;
      shadowRoot: ShadowRoot | null;
    };
    let connected = true;
    Object.defineProperty(instance, 'isConnected', {
      configurable: true,
      get: () => connected,
    });
    const { root, element } = ssrRoot('DIV', 'ssr');
    instance.shadowRoot = root as unknown as ShadowRoot;

    // 1. Hydrate over the SSR tree.
    instance.clientActivate();
    assertEquals(starts, 1);
    assert(root.childNodes[0] === (element as unknown as Node));

    // 2. In-place update: no remount, no cleanup, element identity kept.
    props.label = 'updated';
    instance.requestUpdate();
    assertEquals(root.textContent, 'updated');
    assertEquals(starts, 1);
    assertEquals(cleanups, 0);
    assert(root.childNodes[0] === (element as unknown as Node));

    // 3. Real detach: the deferred teardown unmounts exactly once.
    connected = false;
    instance.disconnectedCallback();
    await Promise.resolve();
    assertEquals(cleanups, 1);
    assertEquals(root.childNodes.length, 0);

    // 4. Reconnect: a fresh tree through the existing Preact owner — no
    //    hydrate replay, no duplicate mount.
    connected = true;
    instance.clientActivate();
    assertEquals(starts, 2);
    assertEquals(cleanups, 1);
    assertEquals(root.childNodes.length, 1);
    assertEquals(root.textContent, 'updated');

    // 5. Final teardown exactly once: every mount was cleaned up, so no
    //    effect subscription leaked across the lifecycle.
    connected = false;
    instance.disconnectedCallback();
    await Promise.resolve();
    assertEquals(cleanups, 2);
    assertEquals(starts, cleanups);
    assertEquals(root.childNodes.length, 0);
  } finally {
    restore();
  }
});

// ─── 2c. Double clientActivate on the same host (upgrade race) ─────

Deno.test('Preact adversarial 2c: double clientActivate is an idempotent update, not a second tree (#1146)', async () => {
  const restore = installDomStubs();
  try {
    let starts = 0;
    let cleanups = 0;
    const Component = () => {
      useLayoutEffect(() => {
        starts++;
        return () => cleanups++;
      }, []);
      return h('div', null, 'raced');
    };
    const ctor = definePreactIsland('test-adv-double-activate', Component as never);
    const instance = new ctor() as OpenElement & {
      clientActivate: () => void;
      disconnectedCallback: () => void;
      shadowRoot: ShadowRoot | null;
    };
    let connected = true;
    Object.defineProperty(instance, 'isConnected', {
      configurable: true,
      get: () => connected,
    });
    // Upgrade race on a DSD host: the shadow root is already SSR-populated.
    const { root, element } = ssrRoot('DIV', 'raced');
    instance.shadowRoot = root as unknown as ShadowRoot;

    // Two activations without an intervening disconnect: the first hydrates,
    // the second must go through the existing Preact owner as an update.
    instance.clientActivate();
    instance.clientActivate();

    assertEquals(starts, 1);
    assertEquals(cleanups, 0);
    assertEquals(root.childNodes.length, 1);
    assert(root.childNodes[0] === (element as unknown as Node));
    assertEquals(root.textContent, 'raced');

    // Ownership is still singular afterwards: one detach, one teardown.
    connected = false;
    instance.disconnectedCallback();
    await Promise.resolve();
    assertEquals(cleanups, 1);
    assertEquals(starts, 1);
  } finally {
    restore();
  }
});
