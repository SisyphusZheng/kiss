/**
 * Unit tests for the real enhance-client module (#610) — the code the
 * generated client entry inlines verbatim. Drives the submit interceptor
 * with stub forms (H1/#576/#598 action-URL resolution, previously locked by
 * string assertions on generated code) and the morph helpers (#603/#604).
 */
import { assert, assertEquals } from '@std/assert';
import { createEnhanceClient } from '../src/internal/ssg/enhance-client.ts';

type Win = Window & typeof globalThis;

class FakeFormElement {
  tagName = 'FORM';
  attrs = new Map<string, string>();
  listeners = new Map<string, ((e: unknown) => void)[]>();
  hasAttribute(name: string): boolean {
    return this.attrs.has(name);
  }
  getAttribute(name: string): string | null {
    return this.attrs.has(name) ? this.attrs.get(name)! : null;
  }
  setAttribute(name: string, value: string): void {
    this.attrs.set(name, value);
  }
  removeAttribute(name: string): void {
    this.attrs.delete(name);
  }
  closest(): null {
    return null;
  }
  rootNode: unknown = null;
  getRootNode(): unknown {
    return this.rootNode;
  }
  addEventListener(type: string, fn: (e: unknown) => void): void {
    const list = this.listeners.get(type) ?? [];
    list.push(fn);
    this.listeners.set(type, list);
  }
  dispatchEvent(): boolean {
    return true;
  }
}

class FakeSubmitter {
  attrs = new Map<string, string>();
  formAction = 'https://fixture.local/should-not-win-without-attr';
  hasAttribute(name: string): boolean {
    return this.attrs.has(name);
  }
  getAttribute(name: string): string | null {
    return this.attrs.has(name) ? this.attrs.get(name)! : null;
  }
}

class FakeFormData {
  constructor(
    public form: unknown,
    public submitter?: unknown,
  ) {}
}

function makeFakeDoc() {
  return {
    readyState: 'complete',
    title: '',
    activeElement: null,
    body: null,
    listeners: new Map<string, ((e: unknown) => void)[]>(),
    addEventListener(type: string, fn: (e: unknown) => void): void {
      const list = this.listeners.get(type) ?? [];
      list.push(fn);
      this.listeners.set(type, list);
    },
    dispatchEvent(): boolean {
      return true;
    },
    querySelectorAll(): unknown[] {
      return [];
    },
    querySelector(): null {
      return null;
    },
  };
}

interface FetchCall {
  url: string;
  init: { method: string; body: unknown; headers: Record<string, string> };
}

function makeHarness(options: { responseStatus?: number; responseType?: string } = {}) {
  const fetches: FetchCall[] = [];
  const win = {
    location: {
      href: 'https://fixture.local/form',
      origin: 'https://fixture.local',
      pathname: '/form',
      search: '',
      hash: '',
      assign: () => {},
      reload: () => {},
    },
    history: { pushState: () => {} },
    sessionStorage: {
      getItem: () => null,
      setItem: () => {},
    },
    pageXOffset: 0,
    pageYOffset: 0,
    scrollTo: () => {},
    addEventListener: () => {},
    setTimeout: (fn: () => void) => fn(),
    CSS: { escape: (s: string) => s },
    CustomEvent: class {
      constructor(
        public type: string,
        public init: unknown,
      ) {}
    },
    HTMLFormElement: FakeFormElement,
    FormData: FakeFormData,
    DOMParser: class {
      parseFromString(): never {
        throw new Error('not used in these tests');
      }
    },
    fetch: (url: string, init: FetchCall['init']) => {
      fetches.push({ url, init });
      return Promise.resolve({
        text: () => Promise.resolve('<html></html>'),
        url,
        status: options.responseStatus ?? 500,
        headers: { get: () => options.responseType ?? 'text/plain' },
      });
    },
  } as unknown as Win;
  const doc = makeFakeDoc();
  const client = createEnhanceClient({
    log: { warn: () => {} },
    tags: [],
    actionHeader: 'x-openelement-action',
    win,
    doc: doc as unknown as Document,
    observeVisible: () => {},
  });
  const fireSubmit = (form: FakeFormElement, submitter: FakeSubmitter | null = null): void => {
    form.rootNode = doc;
    const listeners = doc.listeners.get('submit') ?? [];
    const event = submitEvent(form, submitter);
    for (const listener of listeners) listener(event);
  };
  return { client, fetches, win, fireSubmit };
}

function submitEvent(
  form: FakeFormElement,
  submitter: FakeSubmitter | null,
): { target: unknown; submitter: unknown; prevented: boolean; preventDefault(): void } {
  return {
    target: form,
    submitter,
    prevented: false,
    preventDefault() {
      this.prevented = true;
    },
  };
}

Deno.test('H1/#576: formaction attribute wins over the form action', async () => {
  const { fetches, fireSubmit } = makeHarness();
  const form = new FakeFormElement();
  form.setAttribute('method', 'post');
  form.setAttribute('data-open-enhance', '');
  form.setAttribute('action', '/form');
  const submitter = new FakeSubmitter();
  submitter.attrs.set('formaction', '/ping?/pong');
  submitter.formAction = 'https://fixture.local/ping?/pong';
  fireSubmit(form, submitter);
  await Promise.resolve();
  assertEquals(fetches.length, 1);
  assertEquals(fetches[0].url, 'https://fixture.local/ping?/pong');
  assertEquals(fetches[0].init.headers['x-openelement-action'], 'enhance');
  assert((fetches[0].init.body as FakeFormData).submitter === submitter);
});

Deno.test('H1/#576: the form action attribute is used when no formaction exists', async () => {
  const { fetches, fireSubmit } = makeHarness();
  const form = new FakeFormElement();
  form.setAttribute('method', 'post');
  form.setAttribute('data-open-enhance', '');
  form.setAttribute('action', '/form');
  // A submitter WITHOUT formaction: pre-fix the formAction IDL (always the
  // document URL) shadowed the form action and posted to the page URL.
  const submitter = new FakeSubmitter();
  fireSubmit(form, submitter);
  await Promise.resolve();
  assertEquals(fetches.length, 1);
  assertEquals(fetches[0].url, 'https://fixture.local/form');
});

Deno.test('H1/#598: the action ATTRIBUTE is resolved, never the form.action IDL', async () => {
  const { fetches, fireSubmit } = makeHarness();
  const form = new FakeFormElement();
  form.setAttribute('method', 'post');
  form.setAttribute('data-open-enhance', '');
  form.setAttribute('action', '/elsewhere');
  // Simulate the name="action" trap: the IDL would return this element, so a
  // correct implementation posts to the attribute value instead.
  (form as unknown as Record<string, unknown>).action = { tagName: 'INPUT' };
  fireSubmit(form);
  await Promise.resolve();
  assertEquals(fetches.length, 1);
  assertEquals(fetches[0].url, 'https://fixture.local/elsewhere');
});

Deno.test('no action attribute posts to the current URL', async () => {
  const { fetches, fireSubmit } = makeHarness();
  const form = new FakeFormElement();
  form.setAttribute('method', 'post');
  form.setAttribute('data-open-enhance', '');
  fireSubmit(form);
  await Promise.resolve();
  assertEquals(fetches.length, 1);
  assertEquals(fetches[0].url, 'https://fixture.local/form');
});

Deno.test('GET forms and non-enhanced forms are never intercepted', () => {
  const { fetches, fireSubmit } = makeHarness();
  const get = new FakeFormElement();
  get.setAttribute('method', 'get');
  get.setAttribute('data-open-enhance', '');
  const plain = new FakeFormElement();
  plain.setAttribute('method', 'post');
  const notAForm = { hasAttribute: () => true, getAttribute: () => 'post' };
  fireSubmit(get);
  fireSubmit(plain);
  fireSubmit(notAForm as unknown as FakeFormElement);
  assertEquals(fetches.length, 0);
});

Deno.test('#564: a second submit while one is in flight is ignored', async () => {
  const { fetches, fireSubmit } = makeHarness({ responseStatus: 500 });
  const form = new FakeFormElement();
  form.setAttribute('method', 'post');
  form.setAttribute('data-open-enhance', '');
  fireSubmit(form);
  fireSubmit(form); // in flight: ignored
  assertEquals(fetches.length, 1);
  // Let the response promise chain settle (busy flag resets in a .then).
  await new Promise((resolve) => setTimeout(resolve, 0));
  fireSubmit(form); // response settled: allowed again
  assertEquals(fetches.length, 2);
});
