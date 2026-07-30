/**
 * @openelement/ui - open-button click behavior tests (#637).
 *
 * Self-contained minimal DOM harness so the test does not depend on the larger
 * components.test.ts harness ordering. open-button is imported dynamically after
 * the harness is installed so OpenElement captures the fake HTMLElement base.
 */
import { assertEquals } from 'jsr:@std/assert@^1.0.0';

function installMinimalDom(): void {
  if (typeof (globalThis as { HTMLElement?: unknown }).HTMLElement !== 'undefined') return;

  class FakeHTMLElement {
    #attrs = new Map<string, string>();
    _internals: { form: FakeForm | null } | null = null;
    shadowRoot = null;
    constructor() {}
    getAttribute(name: string): string | null {
      return this.#attrs.get(name) ?? null;
    }
    setAttribute(name: string, value: string): void {
      this.#attrs.set(name, value);
    }
    hasAttribute(name: string): boolean {
      return this.#attrs.has(name);
    }
    removeAttribute(name: string): void {
      this.#attrs.delete(name);
    }
    closest(_sel: string): unknown {
      return null;
    }
    dispatchEvent(event: Event): boolean {
      const type = event.type;
      const store = (this as unknown as { __listeners?: Map<string, Set<EventListener>> }).__listeners;
      const ls = store?.get(type);
      if (ls) for (const l of ls) l.call(this, event);
      return true;
    }
    addEventListener(type: string, listener: EventListener): void {
      const self = this as unknown as { __listeners?: Map<string, Set<EventListener>> };
      if (!self.__listeners) self.__listeners = new Map();
      let s = self.__listeners.get(type);
      if (!s) {
        s = new Set();
        self.__listeners.set(type, s);
      }
      s.add(listener);
    }
    removeEventListener(): void {}
    attachInternals(): { form: FakeForm | null } {
      this._internals = { form: null };
      return this._internals;
    }
    querySelector(): Element | null {
      return null;
    }
    querySelectorAll(): NodeListOf<Element> {
      return [] as unknown as NodeListOf<Element>;
    }
  }

  (globalThis as { HTMLElement?: unknown }).HTMLElement = FakeHTMLElement;
  (globalThis as { document?: unknown }).document = {
    documentElement: { dataset: {}, getAttribute: () => null, setAttribute: () => {} },
    createElement: () => new FakeHTMLElement(),
    querySelector: () => null,
    querySelectorAll: () => [],
    body: new FakeHTMLElement(),
    head: new FakeHTMLElement(),
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  };
}

interface FakeForm {
  tagName: string;
  dispatchEvent(event: Event): boolean;
  reset(): void;
  requestSubmit?: () => void;
  submit?: () => void;
}

interface VNodeLike {
  tag?: unknown;
  props: Record<string, unknown>;
  children: unknown[];
}

interface OpenButtonLike {
  _handleClick: (e: Event) => void;
  render: () => VNodeLike;
  setAttribute: (n: string, v: string) => void;
  removeAttribute: (n: string) => void;
  _internals: { form: FakeForm | null } | null;
  closest: (sel: string) => unknown;
}

function findByTag(node: unknown, tag: string): VNodeLike | undefined {
  if (!node || typeof node !== 'object') return undefined;
  const n = node as VNodeLike;
  if (n.tag === tag) return n;
  for (const child of n.children ?? []) {
    const found = findByTag(child, tag);
    if (found) return found;
  }
  return undefined;
}

installMinimalDom();

const { OpenButton } = await import('../src/open-button.tsx');

Deno.test('open-button onClick wiring uses a single handler reference for both branches (#637 异味②)', () => {
  const btn = new (OpenButton as unknown as new () => OpenButtonLike)() as OpenButtonLike;

  // Button branch (no href): onClick must be the same handler reference.
  btn.removeAttribute('href');
  const buttonNode = findByTag(btn.render(), 'button');
  assertEquals(buttonNode?.props.onClick, btn._handleClick);

  // Anchor branch (href present): onClick must also be the same handler reference.
  btn.setAttribute('href', '/go');
  const anchorNode = findByTag(btn.render(), 'a');
  assertEquals(anchorNode?.props.onClick, btn._handleClick);
});

Deno.test('open-button submit/reset dispatch, and href branch never submits a form (#637)', () => {
  const btn = new (OpenButton as unknown as new () => OpenButtonLike)() as OpenButtonLike;

  const submits: string[] = [];
  const resets: number[] = [];
  const fakeForm: FakeForm = {
    tagName: 'FORM',
    dispatchEvent: (e: Event) => {
      submits.push(e.type);
      return true;
    },
    reset: () => {
      resets.push(1);
    },
    requestSubmit: () => {},
    submit: () => {},
  };
  btn._internals = { form: fakeForm };
  btn.closest = () => null;

  // submit
  btn.removeAttribute('href');
  btn.setAttribute('type', 'submit');
  btn._handleClick(new Event('click'));
  assertEquals(submits, ['submit']);

  // reset
  submits.length = 0;
  btn.setAttribute('type', 'reset');
  btn._handleClick(new Event('click'));
  assertEquals(resets, [1]);

  // href branch must NOT submit or reset
  submits.length = 0;
  resets.length = 0;
  btn.setAttribute('href', '/go');
  btn.setAttribute('type', 'submit');
  btn._handleClick(new Event('click'));
  assertEquals(submits.length, 0);
  assertEquals(resets.length, 0);
});
