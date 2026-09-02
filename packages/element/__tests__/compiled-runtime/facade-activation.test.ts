/**
 * compiled-runtime/facade-activation.test.ts — activation-mode truth (#1213).
 *
 * The kernel's connect() result owns the claim-vs-fresh decision; the facade
 * derives its lifecycle hooks (onDsdHydrated / onCsrRendered) from that result
 * and never guesses from pre-connect root state. Covered behavior:
 *   - light / open-shadow / closed-shadow roots, DSD claim vs CSR fresh
 *   - closed-root DSD claim fires onDsdHydrated (H3 regression)
 *   - reconnect reclaims and re-fires onDsdHydrated without fresh labeling
 *   - failed claim fires neither hook and still tears down pre-upgrade capture
 *   - pre-upgrade replay fires exactly once, then listeners and the strong
 *     capture map are released (M1)
 */

import { assertEquals, assertStrictEquals, assertThrows } from '@std/assert';
import {
  FacadeElement,
  FacadeEvent,
  installFacadeDom,
  mountSerialized,
  toHtml,
} from './facade-dom.ts';
import { testProgram } from './test-program.ts';

// The facade captures its HTMLElement base at module evaluation time.
const dom = installFacadeDom();

const { OpenElement, ensurePreHydrationClickCapture, renderDsd } = await import(
  '../../src/index.ts'
);

// deno-lint-ignore no-explicit-any
type AnyElement = any;

interface ActivationSpec {
  tag: string;
  rootMode: 'light' | 'shadow-open' | 'shadow-closed';
}

function activationProgram(spec: ActivationSpec) {
  return testProgram({
    tag: spec.tag,
    rootMode: spec.rootMode,
    template: [{
      k: 'el',
      tag: 'button',
      attrs: [['type', 'button']],
      children: [{ k: 'part', index: 0 }],
    }],
    parts: [
      { k: 'text', index: 0, signal: 'count' },
      {
        k: 'event',
        index: 1,
        event: 'click',
        handler: 'increment',
        action: { kind: 'method', name: 'increment' },
        path: [0],
      },
    ],
    properties: [{
      name: 'count',
      attribute: 'count',
      type: 'number',
      converter: 'number',
      reflect: false,
      default: 0,
    }],
  });
}

interface TrackedElement extends FacadeElement {
  count: number;
  hydrated: number;
  rendered: number;
  increment(): void;
}

function defineTracked(spec: ActivationSpec): void {
  const program = activationProgram(spec);
  class TrackedActivation extends OpenElement {
    static __partProgram = program;
    static __compiledProperties = program.metadata.properties;
    static __elementMetadata = program.metadata;
    static observedAttributes = program.metadata.observedAttributes;
    declare count: number;
    hydrated = 0;
    rendered = 0;
    protected override onDsdHydrated(): void {
      this.hydrated++;
    }
    protected override onCsrRendered(): void {
      this.rendered++;
    }
    increment(): void {
      this.count++;
    }
  }
  dom.registry.define(spec.tag, TrackedActivation as unknown as CustomElementConstructor);
}

function connectFresh(tag: string): TrackedElement {
  const element = dom.document.createElement(tag) as unknown as TrackedElement;
  dom.document.body.appendChild(element);
  return element;
}

function mountDsd(tag: string, beforeConnect?: (element: FacadeElement) => void): TrackedElement {
  const serialized = renderDsd(tag, {
    componentClass: dom.registry.get(tag) as CustomElementConstructor,
  }).html;
  return mountSerialized(dom, serialized, beforeConnect) as unknown as TrackedElement;
}

function captureListenerCount(target: AnyElement): number {
  return (target.listeners.get('click') ?? [])
    .filter((listener: { capture: boolean }) => listener.capture)
    .length;
}

// ─── Mode truth per root kind ────────────────────────────────────────

Deno.test('activation: light DSD claim fires onDsdHydrated only', () => {
  defineTracked({ tag: 'oe-activation-light', rootMode: 'light' });
  let claimedButton: unknown;
  const element = mountDsd('oe-activation-light', (host) => {
    claimedButton = host.childNodes[0];
  });
  assertEquals(element.hydrated, 1);
  assertEquals(element.rendered, 0);
  assertStrictEquals(element.childNodes[0], claimedButton, 'claim preserves node identity');
});

Deno.test('activation: light CSR fires onCsrRendered only and tears down capture', () => {
  defineTracked({ tag: 'oe-activation-light-csr', rootMode: 'light' });
  // The generated entry installs capture on the document before upgrade.
  ensurePreHydrationClickCapture();
  assertEquals(captureListenerCount(dom.document), 1);
  const element = connectFresh('oe-activation-light-csr');
  assertEquals(element.rendered, 1);
  assertEquals(element.hydrated, 0);
  assertEquals(
    toHtml(element.childNodes[0] as AnyElement),
    '<button type="button"><!--oe:p0-->0</button>',
  );
  assertEquals(
    captureListenerCount(dom.document),
    0,
    'a fresh activation still tears the pre-upgrade capture down',
  );
});

Deno.test('activation: open shadow DSD claim fires onDsdHydrated only', () => {
  defineTracked({ tag: 'oe-activation-open', rootMode: 'shadow-open' });
  let claimedButton: unknown;
  const element = mountDsd('oe-activation-open', (host) => {
    claimedButton = host.shadowRoot!.childNodes[0];
  });
  assertEquals(element.hydrated, 1);
  assertEquals(element.rendered, 0);
  assertStrictEquals(
    (element.shadowRoot as unknown as AnyElement).childNodes[0],
    claimedButton,
  );
});

Deno.test('activation: open shadow CSR fires onCsrRendered only', () => {
  defineTracked({ tag: 'oe-activation-open-csr', rootMode: 'shadow-open' });
  const element = connectFresh('oe-activation-open-csr');
  assertEquals(element.rendered, 1);
  assertEquals(element.hydrated, 0);
  assertEquals(
    toHtml(element.shadowRoot as unknown as FacadeElement),
    '<button type="button"><!--oe:p0-->0</button>',
  );
});

Deno.test('activation: closed shadow DSD claim fires onDsdHydrated (H3)', () => {
  defineTracked({ tag: 'oe-activation-closed', rootMode: 'shadow-closed' });
  let claimedButton: unknown;
  const element = mountDsd('oe-activation-closed', (host) => {
    claimedButton = (host as unknown as { __closedRoot: AnyElement }).__closedRoot.childNodes[0];
  });
  assertEquals(element.hydrated, 1, 'a real closed-root claim is hydration, not fresh render');
  assertEquals(element.rendered, 0);
  assertEquals(element.count, 0);
  // The claimed closed root is live: the pre-existing button runs the handler.
  (claimedButton as AnyElement).dispatchEvent(new FacadeEvent('click', { bubbles: true }));
  assertEquals(element.count, 1);
});

Deno.test('activation: closed shadow CSR fires onCsrRendered only', () => {
  defineTracked({ tag: 'oe-activation-closed-csr', rootMode: 'shadow-closed' });
  const element = connectFresh('oe-activation-closed-csr');
  assertEquals(element.rendered, 1);
  assertEquals(element.hydrated, 0);
});

Deno.test('activation: reconnect reclaims and re-fires onDsdHydrated without relabeling', () => {
  defineTracked({ tag: 'oe-activation-reconnect', rootMode: 'light' });
  let claimedButton: AnyElement;
  const element = mountDsd('oe-activation-reconnect', (host) => {
    claimedButton = host.childNodes[0] as AnyElement;
  });
  assertEquals(element.hydrated, 1);
  assertEquals(element.rendered, 0);

  dom.document.body.removeChild(element);
  dom.document.body.appendChild(element);
  assertEquals(element.hydrated, 2, 'reconnect is a re-claim of the retained content');
  assertEquals(element.rendered, 0, 'reconnect is never relabeled as fresh');
  assertStrictEquals(element.childNodes[0], claimedButton!, 'reconnect preserves node identity');

  claimedButton!.dispatchEvent(new FacadeEvent('click', { bubbles: true }));
  assertEquals(element.count, 1, 'exactly one listener survives the reconnect');
});

// ─── Pre-upgrade capture lifecycle (M1) ──────────────────────────────

Deno.test('activation: pre-upgrade replay fires exactly once, then capture is released', () => {
  defineTracked({ tag: 'oe-activation-replay', rootMode: 'light' });
  let button: AnyElement | undefined;
  const element = mountDsd('oe-activation-replay', (host) => {
    ensurePreHydrationClickCapture(host as unknown as EventTarget);
    assertEquals(captureListenerCount(host), 1);
    button = host.childNodes[0] as AnyElement;
    button.dispatchEvent(new FacadeEvent('click', { bubbles: true }));
  }) as unknown as TrackedElement;

  assertEquals(element.hydrated, 1);
  assertEquals(element.rendered, 0);
  assertEquals(element.count, 1, 'the pre-upgrade click replays exactly once into the claim');
  assertEquals(
    captureListenerCount(element),
    0,
    'the capture listeners are stopped after the activation decision',
  );

  // The strong map released the entry: re-ensuring installs a fresh capture.
  ensurePreHydrationClickCapture(element as unknown as EventTarget);
  assertEquals(captureListenerCount(element), 1);

  // Reconnect reclaims; the fresh capture is torn down and nothing replays.
  dom.document.body.removeChild(element);
  dom.document.body.appendChild(element);
  assertEquals(element.count, 1, 'no second replay after release');
  assertEquals(element.hydrated, 2);
  assertEquals(captureListenerCount(element), 0, 'the reconnect decision tears down again');
});

Deno.test('activation: failed claim fires neither hook and still tears down capture', () => {
  defineTracked({ tag: 'oe-activation-failing', rootMode: 'light' });
  ensurePreHydrationClickCapture();
  assertEquals(captureListenerCount(dom.document), 1);

  // Drifted content: the program expects a <button>, the DOM carries a <span>.
  const element = dom.document.createElement('oe-activation-failing') as unknown as TrackedElement;
  element.appendChild(dom.document.createElement('span'));
  assertThrows(() => dom.document.body.appendChild(element));

  assertEquals(element.hydrated, 0, 'a failed claim never reports hydration');
  assertEquals(element.rendered, 0, 'a failed claim is never relabeled as fresh');
  assertEquals(
    captureListenerCount(dom.document),
    0,
    'capture listeners are stopped even when the claim fails',
  );

  // The strong map entry was released: re-ensuring installs a fresh capture.
  ensurePreHydrationClickCapture();
  assertEquals(captureListenerCount(dom.document), 1);
  // Leave no harness listeners behind for other test files: one fresh connect
  // runs the activation teardown again.
  defineTracked({ tag: 'oe-activation-cleanup', rootMode: 'light' });
  connectFresh('oe-activation-cleanup');
  assertEquals(captureListenerCount(dom.document), 0);
});
