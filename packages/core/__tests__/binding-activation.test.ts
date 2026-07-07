/**
 * @openelement/core — Binding activation tests (ADR-0109 Phase 1).
 */

import { assert, assertEquals, assertFalse } from 'jsr:@std/assert@^1.0.0';
import { asTestElement, signal, withMockDocument } from './test-utils.ts';
import type {
  BindingDescriptor,
  BindingLifecycle,
  BindingRenderer,
} from '../src/binding-descriptor.ts';
import {
  bindAttr,
  bindClass,
  bindConditional,
  bindEvent,
  bindList,
  bindRef,
  bindRender,
  bindStaticAttr,
  bindStaticBoolean,
  bindStaticProp,
  bindStaticStyle,
  bindText,
} from '../src/binding-descriptor.ts';
import { applyBindingDescriptor, registerBindingKind } from '../src/binding-activation.ts';
import { renderToDom } from '../src/jsx-render-dom.ts';
import { jsx } from '../src/jsx-runtime.ts';

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface TestLifecycle extends BindingLifecycle {
  controller: AbortController;
}

function createLifecycle(): TestLifecycle {
  const controller = new AbortController();
  return {
    signal: controller.signal,
    disposers: new Set<() => void>(),
    controller,
  };
}

// ─── Static bindings ─────────────────────────────────────────────────────────

Deno.test('static-attr applies attribute value', () =>
  withMockDocument(() => {
    const el = document.createElement('div');
    const desc: BindingDescriptor = bindStaticAttr(el, 'data-test', 'hello');
    const dispose = applyBindingDescriptor(desc, {});
    assertEquals(el.getAttribute('data-test'), 'hello');
    dispose();
  }));

Deno.test('static-boolean toggles boolean attribute', () =>
  withMockDocument(() => {
    const el = document.createElement('input');
    const desc: BindingDescriptor = bindStaticBoolean(el, 'disabled', true);
    applyBindingDescriptor(desc, {});
    assert(el.hasAttribute('disabled'));

    const descOff: BindingDescriptor = bindStaticBoolean(el, 'disabled', false);
    applyBindingDescriptor(descOff, {});
    assertFalse(el.hasAttribute('disabled'));
  }));

Deno.test('static-style applies CSS properties', () =>
  withMockDocument(() => {
    const el = document.createElement('div');
    const desc: BindingDescriptor = bindStaticStyle(el, { color: 'red', fontSize: '12px' });
    applyBindingDescriptor(desc, {});
    assertEquals(asTestElement(el).style.getPropertyValue('color'), 'red');
    assertEquals(asTestElement(el).style.getPropertyValue('fontSize'), '12px');
  }));

// ─── Signal bindings ─────────────────────────────────────────────────────────

Deno.test('signal-text updates textContent when signal changes', () =>
  withMockDocument(() => {
    const el = document.createElement('div');
    const s = signal('hello');
    const desc: BindingDescriptor = bindText(el, s);
    applyBindingDescriptor(desc, {});
    assertEquals(el.textContent, 'hello');
    s.value = 'world';
    assertEquals(el.textContent, 'world');
  }));

Deno.test('signal-text targets a Text node', () =>
  withMockDocument(() => {
    const textNode = document.createTextNode('');
    const s = signal('hello');
    const desc: BindingDescriptor = bindText(textNode, s);
    applyBindingDescriptor(desc, {});
    assertEquals(textNode.textContent, 'hello');
  }));

Deno.test('signal-class toggles class when signal changes', () =>
  withMockDocument(() => {
    const el = document.createElement('div');
    const s = signal(false);
    const desc: BindingDescriptor = bindClass(el, 'active', s);
    applyBindingDescriptor(desc, {});
    assertFalse(el.classList.contains('active'));
    s.value = true;
    assert(el.classList.contains('active'));
  }));

Deno.test('signal-attr updates multiple attributes', () =>
  withMockDocument(() => {
    const el = document.createElement('input');
    const s = signal('foo');
    const desc: BindingDescriptor = bindAttr(el, ['value', 'data-x'], s);
    applyBindingDescriptor(desc, {});
    assertEquals(el.getAttribute('value'), 'foo');
    assertEquals(el.getAttribute('data-x'), 'foo');
    s.value = 'bar';
    assertEquals(el.getAttribute('value'), 'bar');
    assertEquals(el.getAttribute('data-x'), 'bar');
  }));

Deno.test('signal-html escapes untrusted HTML', () =>
  withMockDocument(() => {
    const el = document.createElement('div');
    const s = signal('<script>xss</script>');
    const desc: BindingDescriptor = { kind: 'signal-html', el, signal: s, trusted: false };
    applyBindingDescriptor(desc, {});
    // textContent escapes HTML, so the literal string is preserved without execution.
    assertEquals(el.textContent, '<script>xss</script>');
    assertEquals(asTestElement(el).innerHTML, '<script>xss</script>');
  }));

Deno.test('signal-html trusts raw HTML when trusted is true', () =>
  withMockDocument(() => {
    const el = document.createElement('div');
    const s = signal('<span>trusted</span>');
    const desc: BindingDescriptor = { kind: 'signal-html', el, signal: s, trusted: true };
    applyBindingDescriptor(desc, {});
    assertEquals(asTestElement(el).innerHTML, '<span>trusted</span>');
  }));

Deno.test('signal-render renders VNode and updates on signal change', () =>
  withMockDocument(() => {
    const el = document.createElement('div');
    const s = signal({ tag: 'span', props: { className: 'a' }, children: ['A'] });
    const childLifecycle: BindingLifecycle = {};
    const desc: BindingDescriptor = bindRender(el, s as unknown as typeof s, childLifecycle);
    const renderer: BindingRenderer = {
      render: (node, lifecycle) => renderToDom(node, lifecycle),
    };
    applyBindingDescriptor(desc, {}, renderer);
    assertEquals(asTestElement(el).innerHTML, '<span class="a">A</span>');

    s.value = { tag: 'span', props: { className: 'b' }, children: ['B'] };
    assertEquals(asTestElement(el).innerHTML, '<span class="b">B</span>');
  }));

// ─── Event / ref ─────────────────────────────────────────────────────────────

Deno.test('event binds and unbinds listener', () =>
  withMockDocument(() => {
    const el = document.createElement('button');
    let count = 0;
    const handler = () => count++;
    const desc: BindingDescriptor = bindEvent(el, 'click', handler);
    const dispose = applyBindingDescriptor(desc, {});
    asTestElement(el).click();
    assertEquals(count, 1);
    dispose();
    asTestElement(el).click();
    assertEquals(count, 1);
  }));

Deno.test('event uses AbortSignal for cleanup', () =>
  withMockDocument(() => {
    const el = document.createElement('button');
    let count = 0;
    const handler = () => count++;
    const lifecycle = createLifecycle();
    const desc: BindingDescriptor = bindEvent(el, 'click', handler);
    applyBindingDescriptor(desc, lifecycle);
    asTestElement(el).click();
    assertEquals(count, 1);
    lifecycle.controller.abort();
    asTestElement(el).click();
    assertEquals(count, 1);
  }));

Deno.test('ref invokes callback with element', () =>
  withMockDocument(() => {
    const el = document.createElement('div');
    let received: Element | null = null;
    const desc: BindingDescriptor = bindRef(el, (e) => {
      received = e;
    });
    applyBindingDescriptor(desc, {});
    assertEquals(received, el);
  }));

// ─── Lifecycle / dispose ─────────────────────────────────────────────────────

Deno.test('dispose is registered via AbortSignal when present, Set when not', () =>
  withMockDocument(() => {
    // With signal: disposer goes to AbortSignal listener, not the Set
    const el = document.createElement('div');
    const s = signal('x');
    const lifecycle1 = createLifecycle();
    const desc1: BindingDescriptor = bindText(el, s);
    applyBindingDescriptor(desc1, lifecycle1);
    assertEquals(lifecycle1.disposers!.size, 0);

    // Without signal: disposer goes to the Set
    const lifecycle2: BindingLifecycle = { disposers: new Set() };
    const desc2: BindingDescriptor = bindText(el, s);
    applyBindingDescriptor(desc2, lifecycle2);
    assertEquals(lifecycle2.disposers!.size, 1);
  }));

Deno.test('AbortSignal triggers dispose', () =>
  withMockDocument(() => {
    const el = document.createElement('div');
    const s = signal('x');
    const lifecycle = createLifecycle();
    const desc: BindingDescriptor = bindText(el, s);
    applyBindingDescriptor(desc, lifecycle);
    s.value = 'y';
    assertEquals(el.textContent, 'y');
    lifecycle.controller.abort();
    s.value = 'z';
    assertEquals(el.textContent, 'y');
  }));

Deno.test('event without AbortSignal registers explicit dispose', () =>
  withMockDocument(() => {
    const el = document.createElement('button');
    const handler = () => {};
    const lifecycle: BindingLifecycle = { disposers: new Set() };
    const desc: BindingDescriptor = bindEvent(el, 'click', handler);
    applyBindingDescriptor(desc, lifecycle);
    assertEquals(lifecycle.disposers!.size, 1);
  }));

Deno.test('static-prop assigns a DOM property', () =>
  withMockDocument(() => {
    const el = document.createElement('input');
    const desc: BindingDescriptor = bindStaticProp(el, 'value', 'hello');
    applyBindingDescriptor(desc, {});
    assertEquals((el as unknown as { value: string }).value, 'hello');
  }));

Deno.test('signal-attr handles boolean-ish values', () =>
  withMockDocument(() => {
    const el = document.createElement('input');
    const s = signal<string | boolean | null>('x');
    const desc: BindingDescriptor = bindAttr(el, ['value'], s);
    applyBindingDescriptor(desc, {});
    assertEquals(el.getAttribute('value'), 'x');

    s.value = null;
    assertEquals(el.getAttribute('value'), null);

    s.value = true;
    assertEquals(el.getAttribute('value'), '');

    s.value = false;
    assertEquals(el.getAttribute('value'), null);
  }));

Deno.test('signal-render logs error when renderer is missing', () =>
  withMockDocument(() => {
    const el = document.createElement('div');
    const s = signal({ tag: 'span', props: {}, children: ['A'] });
    const desc: BindingDescriptor = bindRender(el, s as unknown as typeof s, {});
    const dispose = applyBindingDescriptor(desc, {});
    assertEquals(asTestElement(el).innerHTML, '');
    dispose();
  }));

Deno.test('signal-render renders Fragment array and updates', () =>
  withMockDocument(() => {
    const el = document.createElement('div');
    const s = signal<unknown>([
      { tag: 'span', props: { className: 'a' }, children: ['A'] },
      { tag: 'span', props: { className: 'b' }, children: ['B'] },
    ]);
    const desc: BindingDescriptor = bindRender(el, s as unknown as typeof s, {});
    const renderer: BindingRenderer = {
      render: (node, lifecycle) => renderToDom(node, lifecycle),
    };
    applyBindingDescriptor(desc, {}, renderer);
    assertEquals(asTestElement(el).innerHTML, '<span class="a">A</span><span class="b">B</span>');

    s.value = { tag: 'p', props: {}, children: ['C'] };
    assertEquals(asTestElement(el).innerHTML, '<p>C</p>');
  }));

Deno.test('event binding supports object options', () =>
  withMockDocument(() => {
    const el = document.createElement('button');
    let count = 0;
    const handler = () => count++;
    const lifecycle: BindingLifecycle = { disposers: new Set() };
    const desc: BindingDescriptor = bindEvent(el, 'click', handler, { once: true, passive: true });
    applyBindingDescriptor(desc, lifecycle);
    asTestElement(el).click();
    assertEquals(count, 1);
  }));

// ─── Conditional / list bindings ─────────────────────────────────────────────

Deno.test('conditional binding renders truthy branch and reacts', () =>
  withMockDocument(() => {
    const when = signal(true);
    const anchor = document.createComment('show');
    const host = document.createElement('div');
    host.appendChild(anchor);
    const renderer: BindingRenderer = {
      render: (node, lifecycle) => renderToDom(node, lifecycle),
    };
    const desc: BindingDescriptor = bindConditional(
      anchor as ChildNode,
      when,
      () => jsx('span', { children: 'yes' }),
      () => jsx('span', { children: 'no' }),
    );
    applyBindingDescriptor(desc, {}, renderer);
    assertEquals(asTestElement(host).textContent, 'yes');

    when.value = false;
    assertEquals(asTestElement(host).textContent, 'no');

    when.value = true;
    assertEquals(asTestElement(host).textContent, 'yes');
  }));

Deno.test('conditional binding falls back to falsy branch', () =>
  withMockDocument(() => {
    const when = signal(false);
    const anchor = document.createComment('show');
    const host = document.createElement('div');
    host.appendChild(anchor);
    const renderer: BindingRenderer = {
      render: (node, lifecycle) => renderToDom(node, lifecycle),
    };
    const desc: BindingDescriptor = bindConditional(
      anchor as ChildNode,
      when,
      () => jsx('span', { children: 'yes' }),
      () => jsx('span', { children: 'no' }),
    );
    applyBindingDescriptor(desc, {}, renderer);
    assertEquals(asTestElement(host).textContent, 'no');
  }));

Deno.test('conditional binding clears content when branch returns null', () =>
  withMockDocument(() => {
    const when = signal(true);
    const anchor = document.createComment('show');
    const host = document.createElement('div');
    host.appendChild(anchor);
    const renderer: BindingRenderer = {
      render: (node, lifecycle) => renderToDom(node, lifecycle),
    };
    const desc: BindingDescriptor = bindConditional(
      anchor as ChildNode,
      when,
      () => jsx('span', { children: 'yes' }),
      () => null,
    );
    applyBindingDescriptor(desc, {}, renderer);
    assertEquals(asTestElement(host).textContent, 'yes');

    when.value = false;
    assertEquals(asTestElement(host).textContent, '');
  }));

Deno.test('conditional binding disposes nested renders on update', () =>
  withMockDocument(() => {
    const when = signal(true);
    const anchor = document.createComment('show');
    const host = document.createElement('div');
    host.appendChild(anchor);
    const nestedDisposers = new Set<() => void>();
    const renderer: BindingRenderer = {
      render: (node, lifecycle) => renderToDom(node, lifecycle, nestedDisposers),
    };
    const desc: BindingDescriptor = bindConditional(
      anchor as ChildNode,
      when,
      () => jsx('span', { children: 'yes' }),
      () => jsx('span', { children: 'no' }),
    );
    const dispose = applyBindingDescriptor(desc, {}, renderer);
    const initialDisposerCount = nestedDisposers.size;

    when.value = false;
    assertEquals(nestedDisposers.size, initialDisposerCount);

    dispose();
    assertEquals(nestedDisposers.size, 0);
  }));

Deno.test('conditional binding renders Fragment/multi-node branch', () =>
  withMockDocument(() => {
    const when = signal(true);
    const anchor = document.createComment('show');
    const host = document.createElement('div');
    host.appendChild(anchor);
    const renderer: BindingRenderer = {
      render: (node, lifecycle) => renderToDom(node, lifecycle),
    };
    const desc: BindingDescriptor = bindConditional(
      anchor as ChildNode,
      when,
      () => [jsx('span', { children: 'a' }), jsx('span', { children: 'b' })],
      () => [jsx('em', { children: 'x' }), jsx('em', { children: 'y' })],
    );
    applyBindingDescriptor(desc, {}, renderer);
    assertEquals(asTestElement(host).innerHTML, '<span>a</span><span>b</span>');

    when.value = false;
    assertEquals(asTestElement(host).innerHTML, '<em>x</em><em>y</em>');

    when.value = true;
    assertEquals(asTestElement(host).innerHTML, '<span>a</span><span>b</span>');
  }));

Deno.test('list binding renders items and reacts', () =>
  withMockDocument(() => {
    const items = signal(['a', 'b']);
    const anchor = document.createComment('for');
    const host = document.createElement('div');
    host.appendChild(anchor);
    const renderer: BindingRenderer = {
      render: (node, lifecycle) => renderToDom(node, lifecycle),
    };
    const desc: BindingDescriptor = bindList(
      anchor as ChildNode,
      items,
      (item: unknown) => jsx('span', { children: item as string }),
    );
    applyBindingDescriptor(desc, {}, renderer);
    assertEquals(asTestElement(host).textContent, 'ab');

    items.value = ['x', 'y', 'z'];
    assertEquals(asTestElement(host).textContent, 'xyz');
  }));

Deno.test('list binding ignores non-array items', () =>
  withMockDocument(() => {
    const items = signal('not-an-array');
    const anchor = document.createComment('for');
    const host = document.createElement('div');
    host.appendChild(anchor);
    const renderer: BindingRenderer = {
      render: (node, lifecycle) => renderToDom(node, lifecycle),
    };
    const desc: BindingDescriptor = bindList(
      anchor as ChildNode,
      items,
      (item: unknown) => jsx('span', { children: item as string }),
    );
    applyBindingDescriptor(desc, {}, renderer);
    assertEquals(asTestElement(host).textContent, '');
  }));

Deno.test('list binding disposes nested renders on update', () =>
  withMockDocument(() => {
    const items = signal(['a']);
    const anchor = document.createComment('for');
    const host = document.createElement('div');
    host.appendChild(anchor);
    const nestedDisposers = new Set<() => void>();
    const renderer: BindingRenderer = {
      render: (node, lifecycle) => renderToDom(node, lifecycle, nestedDisposers),
    };
    const desc: BindingDescriptor = bindList(
      anchor as ChildNode,
      items,
      (item: unknown) => jsx('span', { children: item as string }),
    );
    const dispose = applyBindingDescriptor(desc, {}, renderer);
    const initialDisposerCount = nestedDisposers.size;

    items.value = ['b'];
    assertEquals(nestedDisposers.size, initialDisposerCount);

    dispose();
    assertEquals(nestedDisposers.size, 0);
  }));

Deno.test('list binding renders Fragment/multi-node items', () =>
  withMockDocument(() => {
    const items = signal(['a']);
    const anchor = document.createComment('for');
    const host = document.createElement('div');
    host.appendChild(anchor);
    const renderer: BindingRenderer = {
      render: (node, lifecycle) => renderToDom(node, lifecycle),
    };
    const desc: BindingDescriptor = bindList(
      anchor as ChildNode,
      items,
      (item: unknown) => [
        jsx('span', { children: item as string }),
        jsx('b', { children: item as string }),
      ],
    );
    applyBindingDescriptor(desc, {}, renderer);
    assertEquals(asTestElement(host).innerHTML, '<span>a</span><b>a</b>');

    items.value = ['x', 'y'];
    assertEquals(
      asTestElement(host).innerHTML,
      '<span>x</span><b>x</b><span>y</span><b>y</b>',
    );
  }));

Deno.test('registerBindingKind dispatches custom binding kind', () =>
  withMockDocument(() => {
    const el = document.createElement('div');
    let ran = false;
    const customDispose = () => {};
    const kind = 'custom-test-kind';
    registerBindingKind(kind, (desc, _lifecycle) => {
      ran = true;
      assertEquals((desc as unknown as { el: Element }).el, el);
      return customDispose;
    });
    const desc = { kind, el } as unknown as BindingDescriptor;
    const dispose = applyBindingDescriptor(desc, {});
    assert(ran);
    assertEquals(dispose, customDispose);
  }));
