/**
 * @openelement/core - render-dsd.ts unit tests (Deno)
 *
 * Tests for the core DSD renderer: escape functions, attribute serialization,
 * DSD rendering pipeline, DSD options, pure-island layer, adapter protocol,
 * and error handling.
 *
 * Uses plain class mocks - no browser HTMLElement needed.
 */
import { assertEquals, assertFalse, assertStringIncludes } from 'jsr:@std/assert@^1.0.0';
import { renderDsd, type RenderDsdOptions } from '../src/render-dsd.ts';
import { escapeAttr, escapeAttrValue, escapeHtml } from '../src/html-escape.ts';
import { jsx } from '../src/jsx-runtime.ts';
import type { VNode } from '../src/vnode.ts';

// ─── Mock Component Classes ──────────────────────────────────
//
// renderDsdForTest() takes CustomElementConstructor but only uses new() + render().
// We create plain classes that satisfy the DsdComponent interface without
// needing browser HTMLElement (not available in Deno runtime).

interface MockComponent {
  render(): VNode | null | unknown;
  [key: string]: unknown;
  layer?: string;
}

/** Create a mock component class with a render() method */
function createMockClass(
  renderContent: string,
  extra?: {
    layer?: string;
    throwOnConstruct?: boolean;
    throwOnRender?: boolean;
    renderValue?: unknown;
    readOnlyProp?: string;
  },
): new () => MockComponent {
  if (extra?.throwOnConstruct) {
    return class {
      constructor() {
        throw new Error('Construction failed');
      }
    } as unknown as new () => MockComponent;
  }

  const layerVal = extra?.layer;
  const throwOnRender = extra?.throwOnRender;
  const renderValue = extra?.renderValue;
  const readOnlyProp = extra?.readOnlyProp;

  const cls = class {
    layer = layerVal;
    render() {
      if (throwOnRender) throw new Error('Render exploded');
      if (renderValue !== undefined) return renderValue;
      return renderContent === ''
        ? null
        : jsx('div', { innerHTML: renderContent, trustedHtml: true });
    }
  };

  // If a read-only property is requested, add it via getter
  if (readOnlyProp) {
    Object.defineProperty(cls.prototype, readOnlyProp, {
      get() {
        return 'immutable';
      },
      configurable: true,
    });
  }

  return cls as unknown as new () => MockComponent;
}

/** Cast mock class to CustomElementConstructor for renderDsd */
function asCtor(cls: new () => MockComponent): CustomElementConstructor {
  return cls as unknown as CustomElementConstructor;
}

function renderDsdForTest(
  tagName: string,
  componentClass: CustomElementConstructor,
  props: Record<string, unknown> = {},
  sourceInfo?: { route?: string; source?: string },
  dsdOptions?: RenderDsdOptions['dsdOptions'],
  nestingDepth?: number,
  hooks?: RenderDsdOptions['hooks'],
) {
  return renderDsd(tagName, {
    componentClass,
    props,
    sourceInfo,
    dsdOptions,
    nestingDepth,
    hooks,
  });
}

// ─── escapeAttrValue ──────────────────────────────────────────

Deno.test('escapeAttrValue', async (t) => {
  await t.step('returns empty string for null', () => {
    assertEquals(escapeAttrValue(null), '');
  });

  await t.step('returns empty string for undefined', () => {
    assertEquals(escapeAttrValue(undefined), '');
  });

  await t.step('escapes & in attribute values', () => {
    assertEquals(escapeAttrValue('foo&bar'), 'foo&amp;bar');
  });

  await t.step('escapes double quotes in attribute values', () => {
    assertEquals(escapeAttrValue('he said "hello"'), 'he said &quot;hello&quot;');
  });

  await t.step('escapes single quotes in attribute values', () => {
    assertEquals(escapeAttrValue("it's"), 'it&#39;s');
  });

  await t.step('escapes < and > in attribute values', () => {
    assertEquals(escapeAttrValue('<script>'), '&lt;script&gt;');
  });

  await t.step('converts numbers to strings', () => {
    assertEquals(escapeAttrValue(42), '42');
  });

  await t.step('converts booleans to strings', () => {
    assertEquals(escapeAttrValue(true), 'true');
    assertEquals(escapeAttrValue(false), 'false');
  });

  await t.step('returns empty string for empty string input', () => {
    assertEquals(escapeAttrValue(''), '');
  });

  await t.step('handles already-safe strings as-is', () => {
    assertEquals(escapeAttrValue('hello-world'), 'hello-world');
  });
});

// ─── escapeAttr ──────────────────────────────────────────────

Deno.test('escapeAttr', async (t) => {
  await t.step('escapes ampersands', () => {
    assertEquals(escapeAttr('a&b'), 'a&amp;b');
  });

  await t.step('escapes double quotes', () => {
    assertEquals(escapeAttr('"quoted"'), '&quot;quoted&quot;');
  });

  await t.step('escapes single quotes', () => {
    assertEquals(escapeAttr("'quoted'"), '&#39;quoted&#39;');
  });

  await t.step('escapes angle brackets', () => {
    assertEquals(escapeAttr('<>'), '&lt;&gt;');
  });

  await t.step('leaves safe strings unchanged', () => {
    assertEquals(escapeAttr('hello'), 'hello');
  });

  await t.step('escapes all special characters together', () => {
    assertEquals(
      escapeAttr('<a href="url" onclick=\'fn()\'>&amp;</a>'),
      '&lt;a href=&quot;url&quot; onclick=&#39;fn()&#39;&gt;&amp;amp;&lt;/a&gt;',
    );
  });
});

// ─── escapeHtml ──────────────────────────────────────────────

Deno.test('escapeHtml', async (t) => {
  await t.step('escapes & to &amp;', () => {
    assertEquals(escapeHtml('foo & bar'), 'foo &amp; bar');
  });

  await t.step('escapes < to &lt;', () => {
    assertEquals(escapeHtml('a < b'), 'a &lt; b');
  });

  await t.step('escapes > to &gt;', () => {
    assertEquals(escapeHtml('a > b'), 'a &gt; b');
  });

  await t.step('escapes " to &quot;', () => {
    assertEquals(escapeHtml('say "hi"'), 'say &quot;hi&quot;');
  });

  await t.step("escapes ' to &#39;", () => {
    assertEquals(escapeHtml("it's"), 'it&#39;s');
  });

  await t.step('escapes all five special characters at once', () => {
    assertEquals(
      escapeHtml(`<&"'>&>`),
      '&lt;&amp;&quot;&#39;&gt;&amp;&gt;',
    );
  });

  await t.step('preserves safe strings unchanged', () => {
    assertEquals(escapeHtml('hello world'), 'hello world');
  });
});

// ─── renderDsd - Basic rendering ─────────────────────────────

Deno.test('renderDsd - basic rendering', async (t) => {
  await t.step('renders a simple component with DSD template', async () => {
    const cls = createMockClass('<p>Hello</p>');
    const output = await renderDsdForTest('test-comp-1', asCtor(cls), {});
    assertStringIncludes(output.html, '<test-comp-1>');
    assertStringIncludes(output.html, '<template shadowrootmode="open">');
    assertStringIncludes(output.html, '<p>Hello</p>');
    assertStringIncludes(output.html, '</template>');
    assertStringIncludes(output.html, '</test-comp-1>');
  });

  await t.step('explicit light render mode omits DSD template', async () => {
    const LightElement = createMockClass('<p>light content</p>');
    Object.assign(LightElement, { renderMode: 'light' as const });
    const output = await renderDsdForTest('light-el-1', asCtor(LightElement), {});
    assertStringIncludes(output.html, '<light-el-1>');
    assertStringIncludes(output.html, '<p>light content</p>');
    assertStringIncludes(output.html, '</light-el-1>');
    assertFalse(output.html.includes('<template shadowrootmode'));
    assertEquals(output.metrics.layer, 'light-dom');
  });

  await t.step('renders component with props as attributes', async () => {
    const cls = createMockClass('<span>content</span>');
    const output = await renderDsdForTest('my-el-1', asCtor(cls), { variant: 'primary', count: 5 });
    assertStringIncludes(output.html, 'variant="primary"');
    assertStringIncludes(output.html, 'count="5"');
  });

  await t.step('includes data-ssr-props when props are provided', async () => {
    const cls = createMockClass('<div>x</div>');
    const output = await renderDsdForTest('test-el-1', asCtor(cls), { name: 'test' });
    assertStringIncludes(output.html, 'data-ssr-props=');
  });

  await t.step('does not include data-ssr-props when no props', async () => {
    const cls = createMockClass('<div>x</div>');
    const output = await renderDsdForTest('test-el-2', asCtor(cls), {});
    assertFalse(output.html.includes('data-ssr-props'));
  });

  await t.step('skips false/null/undefined props in attributes', async () => {
    const cls = createMockClass('<div>x</div>');
    const output = await renderDsdForTest('test-el-3', asCtor(cls), {
      active: false,
      missing: null,
      gone: undefined,
    });
    assertFalse(output.html.includes('active='));
    assertFalse(output.html.includes('missing='));
    assertFalse(output.html.includes('gone='));
  });

  await t.step('renders boolean true as bare attribute', async () => {
    const cls = createMockClass('<div>x</div>');
    const output = await renderDsdForTest('test-el-4', asCtor(cls), { disabled: true });
    assertStringIncludes(output.html, 'disabled');
    assertFalse(output.html.includes('disabled="true"'));
  });

  await t.step('serializes object props as JSON in attribute', async () => {
    const cls = createMockClass('<div>x</div>');
    const output = await renderDsdForTest('test-el-5', asCtor(cls), { items: ['a', 'b'] });
    assertStringIncludes(output.html, 'items="');
    assertStringIncludes(output.html, '[');
  });
});

// ─── renderDsd - Error handling ──────────────────────────────

Deno.test('renderDsd - error handling', async (t) => {
  await t.step('handles component that throws on instantiation', async () => {
    const cls = createMockClass('', { throwOnConstruct: true });
    const output = await renderDsdForTest('broken-el-1', asCtor(cls), {});
    // v0.19.1: Bare-tag fallback - no shadow DOM, no error comments in HTML
    assertStringIncludes(output.html, '<broken-el-1>');
    assertStringIncludes(output.html, '</broken-el-1>');
    assertFalse(output.html.includes('Render Error'));
    assertFalse(output.html.includes('<template shadowrootmode'));
    assertEquals(output.errors.length, 1);
    assertEquals(output.errors[0].phase, 'instantiate');
  });

  await t.step('handles render() that throws', async () => {
    const cls = createMockClass('', { throwOnRender: true });
    const output = await renderDsdForTest('error-el-1', asCtor(cls), {});
    // v0.19.1: Bare-tag fallback - no shadow DOM, no error comments in HTML
    assertStringIncludes(output.html, '<error-el-1>');
    assertStringIncludes(output.html, '</error-el-1>');
    assertFalse(output.html.includes('Render Error'));
    assertFalse(output.html.includes('<template shadowrootmode'));
    assertEquals(output.errors.length, 1);
    assertEquals(output.errors[0].phase, 'render');
  });

  await t.step('handles render() that returns null', async () => {
    const cls = createMockClass('', { renderValue: null });
    const output = await renderDsdForTest('null-el-1', asCtor(cls), {});
    assertStringIncludes(output.html, '<null-el-1>');
    assertStringIncludes(output.html, '<template shadowrootmode="open">');
    assertStringIncludes(output.html, '</template>');
  });

  await t.step('handles render() that returns non-VNode without adapter', async () => {
    const cls = createMockClass('', { renderValue: { notAString: true } });
    const output = await renderDsdForTest('obj-el-1', asCtor(cls), {});
    assertStringIncludes(output.html, '<obj-el-1>');
    assertFalse(output.html.includes('Render Error'));
    assertEquals(output.errors[0]?.code, 'LESS_RENDER_INVALID_OUTPUT');
  });
});

// ─── renderDsd - DSD Options ─────────────────────────────────

Deno.test('renderDsd - DSD options', async (t) => {
  await t.step('adds shadowrootdelegatesfocus when delegatesFocus=true', async () => {
    const cls = createMockClass('<button>Click</button>');
    const output = await renderDsdForTest('focus-el-1', asCtor(cls), {}, undefined, {
      delegatesFocus: true,
    });
    assertStringIncludes(output.html, 'shadowrootdelegatesfocus');
  });

  await t.step('adds shadowrootserializable when serializable=true', async () => {
    const cls = createMockClass('<span>data</span>');
    const output = await renderDsdForTest('serial-el-1', asCtor(cls), {}, undefined, {
      serializable: true,
    });
    assertStringIncludes(output.html, 'shadowrootserializable');
  });

  await t.step('adds shadowrootclonable when clonable=true', async () => {
    const cls = createMockClass('<span>clone me</span>');
    const output = await renderDsdForTest('clone-el-1', asCtor(cls), {}, undefined, {
      clonable: true,
    });
    assertStringIncludes(output.html, 'shadowrootclonable');
  });

  await t.step('adds shadowrootslotassignment when slotAssignment=manual', async () => {
    const cls = createMockClass('<slot></slot>');
    const output = await renderDsdForTest('slot-el-1', asCtor(cls), {}, undefined, {
      slotAssignment: 'manual',
    });
    assertStringIncludes(output.html, 'shadowrootslotassignment="manual"');
  });

  await t.step('adds boolean shadowrootcustomelementregistry when enabled', async () => {
    const cls = createMockClass('<slot></slot>');
    const output = await renderDsdForTest('registry-el-1', asCtor(cls), {}, undefined, {
      customElementRegistry: true,
    });
    assertStringIncludes(output.html, 'shadowrootcustomelementregistry');
    assertFalse(output.html.includes('shadowrootcustomelementregistry='));
  });

  await t.step('omits DSD attrs when options are not set', async () => {
    const cls = createMockClass('<div>x</div>');
    const output = await renderDsdForTest('plain-el-1', asCtor(cls), {}, undefined, {});
    assertFalse(output.html.includes('shadowrootdelegatesfocus'));
    assertFalse(output.html.includes('shadowrootclonable'));
    assertFalse(output.html.includes('shadowrootserializable'));
    assertFalse(output.html.includes('shadowrootslotassignment'));
    assertFalse(output.html.includes('shadowrootcustomelementregistry'));
  });

  await t.step('includes multiple DSD attrs at once', async () => {
    const cls = createMockClass('<input />');
    const output = await renderDsdForTest('multi-el-1', asCtor(cls), {}, undefined, {
      delegatesFocus: true,
      clonable: true,
      serializable: true,
    });
    assertStringIncludes(output.html, 'shadowrootdelegatesfocus');
    assertStringIncludes(output.html, 'shadowrootclonable');
    assertStringIncludes(output.html, 'shadowrootserializable');
  });
});

// ─── renderDsd - Pure Island layer ──────────────────────────

Deno.test('renderDsd - pure-island layer', async (t) => {
  await t.step('skips DSD template for pure-island layer', async () => {
    const cls = createMockClass('<div>island</div>');
    const output = await renderDsdForTest('island-el-1', asCtor(cls), {}, undefined, {
      layer: 'pure-island',
    });
    assertFalse(output.html.includes('<template shadowrootmode'));
  });

  await t.step('pure-island includes data-ssr-props for hydration', async () => {
    const cls = createMockClass('<div>island</div>');
    const output = await renderDsdForTest('island-el-2', asCtor(cls), { count: 3 }, undefined, {
      layer: 'pure-island',
    });
    assertStringIncludes(output.html, 'data-ssr-props=');
  });

  await t.step('pure-island includes attributes from props', async () => {
    const cls = createMockClass('<div>island</div>');
    const output = await renderDsdForTest('island-el-3', asCtor(cls), { name: 'test' }, undefined, {
      layer: 'pure-island',
    });
    assertStringIncludes(output.html, 'name="test"');
  });

  await t.step('pure-island respects instance.layer property', async () => {
    const cls = createMockClass('<div>island</div>', { layer: 'pure-island' });
    const output = await renderDsdForTest('island-el-4', asCtor(cls), {});
    assertFalse(output.html.includes('<template shadowrootmode'));
  });
});

// ─── renderDsd - Source info ─────────────────────────────────
// v0.19.1: Instantiation errors now produce bare-tag fallback without
// source info attributes. Source info is still recorded in the errors array.

Deno.test('renderDsd - source info', async (t) => {
  await t.step('instantiation error is recorded with route info', async () => {
    const cls = createMockClass('', { throwOnConstruct: true });
    const output = await renderDsdForTest('err-el-1', asCtor(cls), {}, { route: '/about' });
    // Bare-tag output doesn't include route/source attrs
    assertStringIncludes(output.html, '<err-el-1>');
    // But error metadata is preserved
    assertEquals(output.errors.length, 1);
  });

  await t.step('instantiation error is recorded with source file info', async () => {
    const cls = createMockClass('', { throwOnConstruct: true });
    const output = await renderDsdForTest('err-el-2', asCtor(cls), {}, {
      source: 'app/routes/about.ts',
    });
    assertStringIncludes(output.html, '<err-el-2>');
    assertEquals(output.errors.length, 1);
  });

  await t.step('both route and source recorded in errors', async () => {
    const cls = createMockClass('', { throwOnConstruct: true });
    const output = await renderDsdForTest('err-el-3', asCtor(cls), {}, {
      route: '/test',
      source: 'test.ts',
    });
    assertStringIncludes(output.html, '<err-el-3>');
    assertEquals(output.errors.length, 1);
  });
});

// ─── Edge cases ──────────────────────────────────────────────

Deno.test('renderDsd - edge cases', async (t) => {
  await t.step('handles empty render output', async () => {
    const cls = createMockClass('');
    const output = await renderDsdForTest('empty-el-1', asCtor(cls), {});
    assertStringIncludes(output.html, '<empty-el-1>');
    assertStringIncludes(output.html, '<template shadowrootmode="open">');
  });

  await t.step('handles component with read-only property', async () => {
    const cls = createMockClass('<div>test</div>', { readOnlyProp: 'frozenProp' });
    // Should not throw when trying to set read-only property
    const output = await renderDsdForTest('readonly-el-1', asCtor(cls), { frozenProp: 'newval' });
    // Component should render even if a property is read-only
    assertStringIncludes(output.html, 'shadowrootmode="open"');
    assertStringIncludes(output.html, '<div>test</div>');
  });

  await t.step('handles props with special characters in values', async () => {
    const cls = createMockClass('<div>x</div>');
    const output = await renderDsdForTest('special-el-1', asCtor(cls), {
      text: '<script>alert("xss")</script>',
    });
    assertStringIncludes(output.html, '&lt;script&gt;');
  });

  await t.step('handles deeply nested HTML content', async () => {
    const deepContent = '<div><section><article><p><span>deep</span></p></article></section></div>';
    const cls = createMockClass(deepContent);
    const output = await renderDsdForTest('deep-el-1', asCtor(cls), {});
    assertStringIncludes(output.html, deepContent);
  });

  await t.step('skips nested client-only tags from global admission set', async () => {
    const previousCustomElements = globalThis.customElements;
    const previousClientOnly = (globalThis as typeof globalThis & {
      __CLIENT_ONLY_TAGS__?: Set<string>;
    }).__CLIENT_ONLY_TAGS__;
    const childCls = createMockClass('<span>should-not-render</span>');
    const registry = new Map<string, CustomElementConstructor>([
      ['child-widget', asCtor(childCls)],
    ]);
    (globalThis as typeof globalThis & {
      customElements: CustomElementRegistry;
      __CLIENT_ONLY_TAGS__?: Set<string>;
    }).customElements = {
      get: (tagName: string) => registry.get(tagName),
    } as CustomElementRegistry;
    (globalThis as typeof globalThis & {
      __CLIENT_ONLY_TAGS__?: Set<string>;
    }).__CLIENT_ONLY_TAGS__ = new Set(['child-widget']);

    try {
      const parentCls = createMockClass('<div><child-widget></child-widget></div>');
      const output = await renderDsdForTest('parent-widget', asCtor(parentCls), {});
      assertStringIncludes(output.html, '<child-widget></child-widget>');
      assertFalse(output.html.includes('should-not-render'));
    } finally {
      (globalThis as typeof globalThis & {
        customElements?: CustomElementRegistry;
        __CLIENT_ONLY_TAGS__?: Set<string>;
      }).customElements = previousCustomElements;
      (globalThis as typeof globalThis & {
        __CLIENT_ONLY_TAGS__?: Set<string>;
      }).__CLIENT_ONLY_TAGS__ = previousClientOnly;
    }
  });

  await t.step('handles component with very large attribute value', async () => {
    const cls = createMockClass('<div>x</div>');
    const largeVal = 'a'.repeat(10000);
    const output = await renderDsdForTest('large-el-1', asCtor(cls), { data: largeVal });
    assertStringIncludes(output.html, '<template shadowrootmode="open">');
    assertStringIncludes(output.html, '</large-el-1>');
    assertEquals(output.html.length > 10000, true);
  });

  await t.step('dsd-interactive layer still emits DSD template', async () => {
    const cls = createMockClass('<button>Click me</button>', { layer: 'dsd-interactive' });
    const output = await renderDsdForTest('interactive-el-1', asCtor(cls), {});
    assertStringIncludes(output.html, '<template shadowrootmode="open">');
  });
});
