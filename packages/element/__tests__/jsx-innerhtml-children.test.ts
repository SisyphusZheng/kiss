/**
 * jsx-innerhtml-children.test.ts — innerHTML overrides children on BOTH render
 * paths (#1067).
 *
 * SSR (render-ir.ts renderElementChildren) ignores children when props carry
 * innerHTML; CSR (jsx-render-dom.ts renderHostElement) used to set innerHTML
 * and then append the children anyway, diverging the client tree from the
 * SSR'd one. These tests pin the aligned contract.
 *
 * Deno's test runner has no browser DOM, so a minimal DOM harness is
 * installed when globalThis.document is missing (same pattern as
 * jsx-keyed-for.test.tsx, trimmed to what renderToDom touches here).
 */

import { assertEquals, assertStringIncludes } from '@std/assert';

// ─── Minimal DOM harness for the Deno test environment ─────────────

class TestNode {
  nodeType = 1;
  childNodes: TestNode[] = [];

  appendChild(child: TestNode): TestNode {
    this.childNodes.push(child);
    return child;
  }
}

class TestText extends TestNode {
  override nodeType = 3;
  textContent: string;

  constructor(text: string) {
    super();
    this.textContent = String(text);
  }
}

class TestElement extends TestNode {
  localName: string;
  textContent = '';
  innerHTML = '';

  constructor(tag: string) {
    super();
    this.localName = tag.toLowerCase();
  }

  setAttribute(_name: string, _value: string): void {}
}

class TestFragment extends TestNode {
  override nodeType = 11;
}

if (typeof globalThis.document === 'undefined') {
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {
      createElement: (tag: string) => new TestElement(tag),
      createElementNS: (_ns: string, tag: string) => new TestElement(tag),
      createTextNode: (text: string) => new TestText(text),
      createDocumentFragment: () => new TestFragment(),
    },
  });
}

// Imports must happen after the harness is installed, mirroring the ordering
// contract in open-element.test.ts.
const { jsx } = await import('../src/jsx-runtime.ts');
const { renderToDom } = await import('../src/internal/core/jsx-render-dom.ts');
const { renderDsdTree } = await import('../src/internal/core/render-ir.ts');

Deno.test('CSR innerHTML overrides children instead of coexisting with them (#1067)', () => {
  const vnode = jsx('div', {
    innerHTML: 'text-override',
    children: jsx('span', { children: 'child' }),
  });

  const el = renderToDom(vnode) as unknown as TestElement;

  assertEquals(el.textContent, 'text-override');
  assertEquals(el.childNodes.length, 0, 'children are not appended when innerHTML is set');
});

Deno.test('SSR innerHTML overrides children (#1067 parity pin)', async () => {
  const vnode = jsx('div', {
    innerHTML: 'text-override',
    children: jsx('span', { children: 'child' }),
  });

  const html = await renderDsdTree(vnode);

  assertStringIncludes(html, '<div>text-override</div>');
  assertEquals(html.includes('<span>'), false, 'SSR never renders the overridden children');
});
