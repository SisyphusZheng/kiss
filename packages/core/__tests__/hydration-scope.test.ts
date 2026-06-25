/**
 * @openelement/core — HydrationScope tests.
 *
 * Verifies that HydrationScope can be imported from @openelement/core/hydrate
 * and used without @openelement/element.
 */

import { assert, assertEquals, assertFalse } from 'jsr:@std/assert@^1.0.0';
import { HydrationScope } from '@openelement/core/hydrate';
import {
  flushRaf,
  signal,
  TestElement,
  TestEvent,
  TestShadowRoot,
  TestTextNode,
  withMockDocument,
} from './test-utils.ts';
import { jsx } from '../src/jsx-runtime.ts';

// ─── Tests ───────────────────────────────────────────────────────────────────

Deno.test('HydrationScope hydrates signal-text marker', () =>
  withMockDocument(() => {
    const s = signal('hello');
    const registry = new Map([[
      'msg',
      s as import('@openelement/protocol/signal').Signal<unknown>,
    ]]);

    const host = new TestElement('my-el');
    const shadow = new TestShadowRoot(host);
    const el = new TestElement('span');
    el.setAttribute('data-signal', 'msg');
    shadow.appendChild(el);

    const scope = new HydrationScope({ signalRegistry: registry });
    scope.hydrate(shadow as unknown as ShadowRoot);
    flushRaf();

    assertEquals(el.textContent, 'hello');
    s.value = 'world';
    assertEquals(el.textContent, 'world');
    assert(scope.debug.isActive);
    assertEquals(scope.debug.effectCount, 1);

    scope.dispose();
  }));

Deno.test('HydrationScope dispose clears signal effects', () =>
  withMockDocument(() => {
    const s = signal('a');
    const registry = new Map([[
      'msg',
      s as import('@openelement/protocol/signal').Signal<unknown>,
    ]]);

    const host = new TestElement('my-el');
    const shadow = new TestShadowRoot(host);
    const el = new TestElement('span');
    el.setAttribute('data-signal', 'msg');
    shadow.appendChild(el);

    const scope = new HydrationScope({ signalRegistry: registry });
    scope.hydrate(shadow as unknown as ShadowRoot);
    flushRaf();

    assertEquals(el.textContent, 'a');
    scope.dispose();
    assertFalse(scope.debug.isActive);
    assertEquals(scope.debug.effectCount, 0);

    s.value = 'b';
    // Effect was disposed; DOM should not update.
    assertEquals(el.textContent, 'a');
  }));

Deno.test('HydrationScope reset clears bindings without deactivating', () =>
  withMockDocument(() => {
    const s = signal('a');
    const registry = new Map([[
      'msg',
      s as import('@openelement/protocol/signal').Signal<unknown>,
    ]]);

    const host = new TestElement('my-el');
    const shadow = new TestShadowRoot(host);
    const el = new TestElement('span');
    el.setAttribute('data-signal', 'msg');
    shadow.appendChild(el);

    const scope = new HydrationScope({ signalRegistry: registry });
    scope.hydrate(shadow as unknown as ShadowRoot);
    flushRaf();

    assertEquals(el.textContent, 'a');
    scope.reset();
    assert(scope.debug.isActive, 'scope should stay active after reset');
    assertEquals(scope.debug.effectCount, 0, 'effects should be cleared after reset');

    // Re-hydrate with the same scope; new effect should update the DOM again.
    scope.hydrate(shadow as unknown as ShadowRoot);
    flushRaf();
    s.value = 'b';
    assertEquals(el.textContent, 'b');

    scope.dispose();
  }));

Deno.test('HydrationScope hydrates event markers without OpenElement', () =>
  withMockDocument(() => {
    let clicks = 0;
    const vnode = jsx('button', {
      onClick: () => clicks++,
      children: 'Click me',
    });

    const host = new TestElement('my-el');
    const shadow = new TestShadowRoot(host);
    const btn = new TestElement('button');
    btn.setAttribute('data-eid', 'e0');
    btn.appendChild(new TestTextNode('Click me'));
    shadow.appendChild(btn);

    const scope = new HydrationScope({ render: () => vnode });
    scope.hydrate(shadow as unknown as ShadowRoot);
    flushRaf();

    const event = new TestEvent('click') as unknown as Event;
    btn.dispatchEvent(event);
    assertEquals(clicks, 1);

    scope.dispose();
    btn.dispatchEvent(new TestEvent('click') as unknown as Event);
    assertEquals(clicks, 1);
  }));

Deno.test('HydrationScope imported from @openelement/core/hydrate is a class', () =>
  withMockDocument(() => {
    assertEquals(typeof HydrationScope, 'function');
  }));
