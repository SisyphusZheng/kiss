/**
 * @openelement/core/dsd-hydration — shared DSD hydration helpers.
 */

import { assert, assertEquals } from 'jsr:@std/assert@^1.0.0';
import { createDsdRenderRoot, hydrateDsdEvents } from '../src/dsd-hydration.ts';
import type { HydrateEventDescriptor } from '@openelement/protocol/framework';
import {
  TestElement,
  TestEvent,
  TestShadowRoot,
  TestTextNode,
  withMockDocument,
} from './test-utils.ts';

function makeHost(): TestElement {
  const host = new TestElement('x-host');
  host.attachShadow();
  return host;
}

Deno.test('createDsdRenderRoot attaches an open shadow root when none exists', () => {
  withMockDocument(() => {
    const host = new TestElement('x-foo');
    const root = createDsdRenderRoot(host as unknown as HTMLElement);
    assert(root instanceof TestShadowRoot, 'returns a shadow root');
    assertEquals(host.shadowRoot, root);
  });
});

Deno.test('createDsdRenderRoot reuses a populated shadow root', () => {
  withMockDocument(() => {
    const host = new TestElement('x-foo');
    const root = new TestShadowRoot(host as unknown as TestElement);
    root.appendChild(new TestTextNode('pre-rendered'));
    // childElementCount is a real-DOM property; emulate it for the harness.
    Object.defineProperty(root, 'childElementCount', { value: 1 });
    (host as unknown as { shadowRoot: TestShadowRoot }).shadowRoot = root;

    const got = createDsdRenderRoot(host as unknown as HTMLElement);
    assertEquals(got, root as unknown as ShadowRoot, 'returns the existing populated shadow root');
  });
});

Deno.test('hydrateDsdEvents returns undefined without a shadow root', () => {
  withMockDocument(() => {
    const host = new TestElement('x-foo');
    const result = hydrateDsdEvents(host as unknown as HTMLElement, {
      hydrateEvents: [{ selector: '[data-x]', event: 'click', method: 'onX' }],
    });
    assertEquals(result, undefined);
  });
});

Deno.test('hydrateDsdEvents returns undefined when no events declared', () => {
  withMockDocument(() => {
    const host = makeHost();
    const result = hydrateDsdEvents(host as unknown as HTMLElement, { hydrateEvents: [] });
    assertEquals(result, undefined);
  });
});

Deno.test('hydrateDsdEvents binds declared handlers and aborts them', () => {
  withMockDocument(() => {
    const host = makeHost();
    const root = (host as unknown as { shadowRoot: TestShadowRoot }).shadowRoot;
    const target = new TestElement('button');
    target.setAttribute('data-ping', '');
    root.appendChild(target);

    let calls = 0;
    (host as unknown as { onPing(): void }).onPing = () => {
      calls++;
    };

    const desc: HydrateEventDescriptor = {
      selector: '[data-ping]',
      event: 'click',
      method: 'onPing',
    };
    const controller = hydrateDsdEvents(host as unknown as HTMLElement, {
      hydrateEvents: [desc],
    });
    assert(controller instanceof AbortController, 'returns an AbortController');

    target.dispatchEvent(new TestEvent('click') as unknown as Event);
    assertEquals(calls, 1, 'handler fires on first dispatch');

    controller!.abort();
    target.dispatchEvent(new TestEvent('click') as unknown as Event);
    assertEquals(calls, 1, 'handler does not fire after abort');
  });
});
