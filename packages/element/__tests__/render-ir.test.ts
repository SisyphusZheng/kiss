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

Deno.test('SSR unserializable public props degrade like a render() failure', async () => {
  class NullRender {
    render(): null {
      return null;
    }
  }
  const circular: Record<string, unknown> = { label: 'hi' };
  circular.self = circular;

  const circularOutput = await renderDsd('x-circular-props', {
    componentClass: NullRender as unknown as CustomElementConstructor,
    props: { circular },
  });
  assertEquals(circularOutput.errors.length, 1);
  assertEquals(circularOutput.errors[0].recoverable, true);
  assertEquals(circularOutput.metrics.hasError, true);
  // The unserializable attribute is skipped; the bare tag still renders.
  assertEquals(circularOutput.html, '<x-circular-props></x-circular-props>');

  const bigintOutput = await renderDsd('x-bigint-props', {
    componentClass: NullRender as unknown as CustomElementConstructor,
    props: { count: 1n },
  });
  assertEquals(bigintOutput.errors.length, 1);
  assertEquals(bigintOutput.metrics.hasError, true);
  assertEquals(bigintOutput.html, '<x-bigint-props count="1"></x-bigint-props>');
});

Deno.test('SSR a throwing getter prop is skipped, not crashed on', async () => {
  class NullRender {
    render(): null {
      return null;
    }
  }
  const props: Record<string, unknown> = { label: 'hi' };
  Object.defineProperty(props, 'exploding', {
    enumerable: true,
    get() {
      throw new Error('getter boom');
    },
  });

  const output = await renderDsd('x-getter-props', {
    componentClass: NullRender as unknown as CustomElementConstructor,
    props,
  });

  assertEquals(output.errors.length, 0);
  assertEquals(output.metrics.hasError, false);
  assertStringIncludes(output.html, '<x-getter-props');
  assertEquals(output.html.includes('exploding'), false);
});

Deno.test('SSR fallback never throws when unserializable props carry a throwing getter', async () => {
  class NullRender {
    render(): null {
      return null;
    }
  }
  // The circular prop forces the serialization-failure fallback; the
  // fallback's own serializeAttrs call then enumerates the original props
  // and re-invokes the throwing getter — the exact escape hatch the
  // degradation promise forbids.
  const circular: Record<string, unknown> = { label: 'hi' };
  circular.self = circular;
  const props: Record<string, unknown> = { circular };
  Object.defineProperty(props, 'exploding', {
    enumerable: true,
    get() {
      throw new Error('getter boom');
    },
  });

  const output = await renderDsd('x-circular-getter-props', {
    componentClass: NullRender as unknown as CustomElementConstructor,
    props,
  });

  assertEquals(output.errors.length, 1);
  assertEquals(output.errors[0].recoverable, true);
  assertEquals(output.metrics.hasError, true);
  assertEquals(output.html, '<x-circular-getter-props></x-circular-getter-props>');
});

Deno.test('raw-text elements serialize text children verbatim (#932)', async () => {
  const css = '.post-body :not(pre) > code { color: #ff0; } .a & .b { color: red; }';
  const html = await renderDsdTree(jsx('style', { children: css }));
  assertEquals(html, `<style>${css}</style>`);

  const script = "const s = 'a < b && c > d';";
  const scriptHtml = await renderDsdTree(jsx('script', { children: script }));
  assertEquals(scriptHtml, `<script>${script}</script>`);

  const mixed = await renderDsdTree(
    jsx('div', { children: [jsx('style', { children: 'a > b' }), 'text > escaped'] }),
  );
  assertEquals(mixed, `<div><style>a > b</style>text &gt; escaped</div>`);
});
