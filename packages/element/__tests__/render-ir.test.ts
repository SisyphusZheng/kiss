import { assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import { jsx } from '../src/jsx-runtime.ts';
import { renderDsdTree, serializeAttrs } from '../src/internal/core/render-ir.ts';
import { collectEventBindings } from '../src/internal/core/event-hydration.ts';
import { MAX_SSR_NESTING_DEPTH, renderDsd } from '../src/internal/core/render-dsd.ts';

Deno.test('render IR propagates component failures to the application boundary', async () => {
  function BrokenComponent(): never {
    throw new Error('component failed');
  }

  await assertRejects(
    () => renderDsdTree(jsx(BrokenComponent, {})),
    Error,
    'component failed',
  );
});

Deno.test('render IR safely ignores dangerous and read-only component props', async () => {
  class SafeComponent {
    get label(): string {
      return 'declared';
    }

    render() {
      return jsx('span', { children: this.label });
    }
  }

  const html = await renderDsdTree(jsx(SafeComponent, {
    label: 'overwritten',
    constructor: 'polluted',
    __proto__: { polluted: true },
  }));

  assertStringIncludes(html, 'declared');
  assertEquals((Object.prototype as { polluted?: boolean }).polluted, undefined);
});

Deno.test('event hydration safely ignores read-only component props', () => {
  class SafeComponent {
    get label(): string {
      return 'declared';
    }

    render() {
      return jsx('button', { onClick: () => this.label });
    }
  }

  const bindings = collectEventBindings(jsx(SafeComponent, {
    label: 'overwritten',
    prototype: 'polluted',
  }));

  assertEquals(bindings.size, 1);
});

Deno.test('#602 serializeAttrs rejects unsafe attribute names', () => {
  const safe = serializeAttrs('div', { className: 'ok', 'data-x': '1', id: 'a' });
  assertStringIncludes(safe, 'class="ok"');
  assertStringIncludes(safe, 'data-x="1"');
  assertStringIncludes(safe, 'id="a"');

  const evil = serializeAttrs('div', {
    'x" onclick="alert(1)" data-x': 'pwn',
    'onmouseover': 'alert(1)',
    'ok-name': 'yes',
  });
  assertEquals(evil.includes('onclick'), false);
  assertEquals(evil.includes('onmouseover'), false);
  assertStringIncludes(evil, 'ok-name="yes"');
});

Deno.test('SSR rejects rendering beyond the nesting-depth limit', async () => {
  class RecursiveElement {
    render() {
      return jsx('recursive-element', {});
    }
  }

  await assertRejects(
    () =>
      renderDsd('recursive-element', {
        componentClass: RecursiveElement as unknown as CustomElementConstructor,
        nestingDepth: MAX_SSR_NESTING_DEPTH + 1,
      }),
    Error,
    `SSR nesting depth exceeded ${MAX_SSR_NESTING_DEPTH}`,
  );
});

Deno.test('SSR instantiate failure falls back to a bare tag with serialized props (#892)', async () => {
  class ThrowingElement {
    constructor() {
      throw new Error('ctor boom');
    }
  }

  const output = await renderDsd('x-throwing', {
    componentClass: ThrowingElement as unknown as CustomElementConstructor,
    props: { someProp: 'value', count: 3 },
  });

  assertEquals(output.metrics.hasError, true);
  assertStringIncludes(output.html, 'some-prop="value"');
  assertStringIncludes(output.html, 'count="3"');
  assertEquals(output.html.startsWith('<x-throwing '), true);
  assertStringIncludes(output.html, '</x-throwing>');
});

Deno.test('SSR instantiate failure is classified recoverable like render() failures (#892)', async () => {
  class NotAComponent {
    // No render(): instantiation succeeds but is rejected as non-DSD.
  }

  const output = await renderDsd('x-missing-render', {
    componentClass: NotAComponent as unknown as CustomElementConstructor,
  });

  assertEquals(output.errors.length, 1);
  assertEquals(output.errors[0].code, 'OPEN_ELEMENT_RENDER_INSTANTIATE_FAILED');
  assertEquals(output.errors[0].recoverable, true);
  assertEquals(output.errors[0].severity, 'warning');
  assertEquals(output.html, '<x-missing-render></x-missing-render>');
});

Deno.test('SSR render() failure fallback keeps the same bare-tag-with-props shape (#892)', async () => {
  class BrokenRender {
    render(): unknown {
      throw new Error('boom');
    }
  }

  const output = await renderDsd('x-broken-render', {
    componentClass: BrokenRender as unknown as CustomElementConstructor,
    props: { label: 'hi' },
  });

  assertEquals(output.errors.length, 1);
  assertEquals(output.errors[0].recoverable, true);
  assertEquals(output.errors[0].severity, 'warning');
  assertEquals(output.html, '<x-broken-render label="hi"></x-broken-render>');
});
