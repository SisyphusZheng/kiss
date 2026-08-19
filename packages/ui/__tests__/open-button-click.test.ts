/**
 * @openelement/ui - open-button click behavior tests (#637).
 *
 * Self-contained minimal DOM harness so the test does not depend on the larger
 * components.test.ts harness ordering. open-button is imported dynamically after
 * the harness is installed so OpenElement captures the fake HTMLElement base.
 */
import { assertEquals } from '@std/assert';

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
      const store =
        (this as unknown as { __listeners?: Map<string, Set<EventListener>> }).__listeners;
      const ls = store?.get(type);
      if (ls) { for (const l of ls) l.call(this, event); }
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

Deno.test('open-button href branch never submits or resets a form (#637)', () => {
  // Only the href-no-submit assertion lives here: the submit/reset dispatch
  // cases are covered by components.test.ts (form submission regression
  // block) and are intentionally not duplicated (#792).
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

  btn.setAttribute('href', '/go');
  btn.setAttribute('type', 'submit');
  btn._handleClick(new Event('click'));
  assertEquals(submits.length, 0);
  assertEquals(resets.length, 0);
});

// ─── #757: anchor-mode disabled sync ─────────────────────────────────────────
// _syncDOM() branches on `el instanceof HTMLButtonElement/HTMLAnchorElement`,
// which do not exist in this minimal harness — install fakes before
// exercising the anchor sync path.

class FakeAnchorElement {
  className = '';
  #attrs = new Map<string, string>();
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
}

class FakeButtonElement {
  className = '';
  disabled = false;
  #attrs = new Map<string, string>();
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
}

(globalThis as { HTMLAnchorElement?: unknown }).HTMLAnchorElement ??= FakeAnchorElement;
(globalThis as { HTMLButtonElement?: unknown }).HTMLButtonElement ??= FakeButtonElement;

Deno.test('open-button anchor mode syncs href/aria-disabled on disabled changes in both directions (#757)', () => {
  const btn = new (OpenButton as unknown as new () => OpenButtonLike)() as OpenButtonLike & {
    attributeChangedCallback: (n: string, o: string | null, v: string | null) => void;
    shadowRoot: unknown;
  };
  btn.setAttribute('href', '/x');
  const anchor = new FakeAnchorElement();
  btn.shadowRoot = { querySelector: (sel: string) => (sel === '.btn' ? anchor : null) };

  // Adding `disabled` at runtime: href must be removed outright — even an
  // empty href stays Tab-focusable and navigates on Enter / programmatic
  // click (#1061). aria-disabled is set alongside.
  btn.setAttribute('disabled', '');
  btn.attributeChangedCallback('disabled', null, '');
  assertEquals(anchor.hasAttribute('href'), false);
  assertEquals(anchor.getAttribute('aria-disabled'), 'true');

  // Removing `disabled`: href must be restored, aria-disabled removed —
  // otherwise the anchor stays a permanently dead link.
  btn.removeAttribute('disabled');
  btn.attributeChangedCallback('disabled', '', null);
  assertEquals(anchor.getAttribute('href'), '/x');
  assertEquals(anchor.hasAttribute('aria-disabled'), false);
});

Deno.test('open-button disabled click is a no-op: no open-click, no form submit (#757)', () => {
  const btn = new (OpenButton as unknown as new () => OpenButtonLike)() as OpenButtonLike & {
    addEventListener: (t: string, l: EventListener) => void;
  };

  const submits: string[] = [];
  const fakeForm: FakeForm = {
    tagName: 'FORM',
    dispatchEvent: (e: Event) => {
      submits.push(e.type);
      return true;
    },
    reset: () => {},
    requestSubmit: () => {},
    submit: () => {},
  };
  btn._internals = { form: fakeForm };
  btn.closest = () => null;

  let openClickFired = false;
  btn.addEventListener('open-click', () => {
    openClickFired = true;
  });

  btn.setAttribute('type', 'submit');
  btn.setAttribute('disabled', '');
  btn._handleClick(new Event('click'));
  assertEquals(openClickFired, false);
  assertEquals(submits.length, 0);
});

// ─── #1039: target/type attribute sync ─────────────────────────────────────

Deno.test('open-button syncs target (and _blank rel guard) on the inner anchor (#1039)', () => {
  const btn = new (OpenButton as unknown as new () => OpenButtonLike)() as OpenButtonLike & {
    attributeChangedCallback: (n: string, o: string | null, v: string | null) => void;
    shadowRoot: unknown;
  };
  btn.setAttribute('href', '/x');
  const anchor = new FakeAnchorElement();
  btn.shadowRoot = { querySelector: (sel: string) => (sel === '.btn' ? anchor : null) };

  btn.setAttribute('target', '_blank');
  btn.attributeChangedCallback('target', null, '_blank');
  assertEquals(anchor.getAttribute('target'), '_blank');
  assertEquals(anchor.getAttribute('rel'), 'noopener noreferrer');

  // Changing away from _blank drops the rel guard; removing target entirely
  // removes both attributes.
  btn.removeAttribute('target');
  btn.attributeChangedCallback('target', '_blank', null);
  assertEquals(anchor.hasAttribute('target'), false);
  assertEquals(anchor.hasAttribute('rel'), false);
});

Deno.test('open-button syncs type on the inner button (#1039)', () => {
  const btn = new (OpenButton as unknown as new () => OpenButtonLike)() as OpenButtonLike & {
    attributeChangedCallback: (n: string, o: string | null, v: string | null) => void;
    shadowRoot: unknown;
  };
  const button = new FakeButtonElement();
  btn.shadowRoot = { querySelector: (sel: string) => (sel === '.btn' ? button : null) };

  btn.setAttribute('type', 'submit');
  btn.attributeChangedCallback('type', null, 'submit');
  assertEquals(button.getAttribute('type'), 'submit');

  // Removing type restores the render() default ('button').
  btn.removeAttribute('type');
  btn.attributeChangedCallback('type', 'submit', null);
  assertEquals(button.getAttribute('type'), 'button');
});
