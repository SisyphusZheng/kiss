import { assert, assertEquals } from "jsr:@std/assert@1";
import { routes } from "../routes.ts";

// ─── Minimal DOM mock for Deno test environment ──────────────────
// ponytail: inline mock covering only the DOM APIs used by route components.
// If more APIs are needed, swap to linkedom/deno-dom.

class MockNode {
  childNodes: MockNode[] = [];
  parentNode: MockNode | null = null;
  textContent: string = "";

  appendChild(child: MockNode): MockNode {
    this.childNodes.push(child);
    child.parentNode = this;
    return child;
  }
  removeChild(child: MockNode): MockNode {
    const i = this.childNodes.indexOf(child);
    if (i >= 0) this.childNodes.splice(i, 1);
    child.parentNode = null;
    return child;
  }
  remove(): void {
    this.parentNode?.removeChild(this);
  }
}

class MockElement extends MockNode {
  tagName: string;
  _attrs = new Map<string, string>();
  _listeners = new Map<string, Array<(...args: unknown[]) => void>>();
  _value = "";
  _disabled = false;
  className = "";
  style = {
    _props: {} as Record<string, string>,
    setProperty(k: string, v: string) {
      this._props[k] = v;
    },
    getProperty(k: string) {
      return this._props[k] ?? "";
    },
  } as unknown as Record<string, string> & {
    setProperty(k: string, v: string): void;
    getProperty(k: string): string;
  };

  constructor(tag: string) {
    super();
    this.tagName = tag.toUpperCase();
  }

  getAttribute(name: string): string | null {
    return this._attrs.get(name) ?? null;
  }
  setAttribute(name: string, value: string): void {
    this._attrs.set(name, value);
  }
  addEventListener(type: string, fn: (...args: unknown[]) => void): void {
    const list = this._listeners.get(type) ?? [];
    list.push(fn);
    this._listeners.set(type, list);
  }
  click(): void {
    this._listeners.get("click")?.forEach((fn) => fn({ stopPropagation() {} }));
  }
  append(...children: (string | MockNode)[]): void {
    for (const c of children) {
      if (typeof c === "string") {
        this.appendChild(new MockText(c));
      } else {
        this.appendChild(c);
      }
    }
  }
  get value(): string {
    return this._value;
  }
  set value(v: string) {
    this._value = v;
  }
  get disabled(): boolean {
    return this._disabled;
  }
  set disabled(v: boolean) {
    this._disabled = v;
  }
}

class MockText extends MockNode {
  constructor(content: string) {
    super();
    this.textContent = content;
  }
}

class MockDocumentFragment extends MockNode {}

function mockDocument() {
  const body = new MockElement("body");
  const docEl = new MockElement("html");
  const mockDoc = {
    body,
    documentElement: docEl,
    createDocumentFragment(): MockDocumentFragment {
      return new MockDocumentFragment();
    },
    createElement(tag: string): MockElement {
      return new MockElement(tag);
    },
    createTextNode(content: string): MockText {
      return new MockText(content);
    },
    querySelector(_selector: string): MockElement | null {
      return null;
    },
  };
  return mockDoc;
}

// Install mock DOM globals before tests that need them
// Deno already provides crypto, Blob, URL — only document/HTMLElement are missing.
// deno-lint-ignore no-explicit-any
(globalThis as any).document = mockDocument();
// deno-lint-ignore no-explicit-any
(globalThis as any).DocumentFragment = MockDocumentFragment;
// deno-lint-ignore no-explicit-any
(globalThis as any).HTMLElement = MockElement;

// ─── Tests ────────────────────────────────────────────────────────

Deno.test("route table contains all 5 paths", () => {
  const paths = routes.map((r) => r.path);
  assertEquals(
    [...paths].sort(),
    ["/", "/books/:id", "/notes", "/search", "/settings"].sort(),
  );
});

Deno.test("each route has a component function", () => {
  for (const route of routes) {
    assertEquals(typeof route.component, "function");
  }
});

Deno.test("bookshelf route renders without error", () => {
  const route = routes.find((r) => r.path === "/");
  if (!route) throw new Error("bookshelf route not found");
  const frag = route.component();
  assertEquals(frag instanceof MockDocumentFragment, true);
  assert(frag.childNodes.length > 0);
});

Deno.test("notes route renders without error", () => {
  const route = routes.find((r) => r.path === "/notes");
  if (!route) throw new Error("notes route not found");
  const frag = route.component();
  assertEquals(frag instanceof MockDocumentFragment, true);
});

Deno.test("search route renders without error", () => {
  const route = routes.find((r) => r.path === "/search");
  if (!route) throw new Error("search route not found");
  const frag = route.component();
  assertEquals(frag instanceof MockDocumentFragment, true);
});

Deno.test("settings route renders without error", () => {
  const route = routes.find((r) => r.path === "/settings");
  if (!route) throw new Error("settings route not found");
  const frag = route.component();
  assertEquals(frag instanceof MockDocumentFragment, true);
});
