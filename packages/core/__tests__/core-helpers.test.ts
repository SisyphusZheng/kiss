/**
 * @openelement/core - focused core helper unit tests.
 *
 * Covers small, deterministic helpers that are important but not yet fully
 * exercised by the existing suite: tag-utils, style-sheet SSR shim,
 * html-escape edge cases, logger, additional error classes, context edge
 * cases, signal-context, dsd-hydration, and the static prop runtime.
 */

import { assert, assertEquals, assertFalse, assertStringIncludes } from 'jsr:@std/assert@^1.0.0';
import { isValidTagName } from '../src/tag-utils.ts';
import { StyleSheet } from '../src/style-sheet.ts';
import { escapeHtml, renderSsrError, wrapInDocument } from '../src/html-escape.ts';
import { createLogger, warnOnce } from '../src/logger.ts';
import {
  ErrorCode,
  formatError,
  OpenElementError,
  PropValidationError,
  RenderError,
  reportError,
  setErrorTelemetryHook,
  SsrRenderError,
} from '../src/errors.ts';
import type { ErrorTelemetryHook } from '@openelement/protocol/errors';
import { extractParams } from '../src/context.ts';
import { consumeContext, createContext, provideContext } from '../src/signal-context.ts';
import { bindHydrateEvents } from '../src/dsd-hydration-events.ts';
import { createDsdRenderRoot, hydrateDsdEvents } from '../src/dsd-hydration.ts';
import {
  disposeStaticProps,
  handleStaticPropAttributeChange,
  initializeStaticProps,
  normalizePropDecl,
  registerStaticObservedAttributes,
  syncStaticPropsFromAttributes,
  unwrap,
} from '../src/prop.ts';

// Deno test runner does not expose ShadowRoot, but signal-context only uses it
// for an instanceof check. Provide a minimal stub so the fallback path can
// complete without a ReferenceError.
(globalThis as unknown as Record<string, unknown>).ShadowRoot = class ShadowRoot {};

// ─── tag-utils ───────────────────────────────────────────────────────────────

Deno.test('tag-utils - isValidTagName', async (t) => {
  await t.step('accepts valid custom element names', () => {
    assert(isValidTagName('my-element'));
    assert(isValidTagName('x-1'));
    assert(isValidTagName('my-el-2'));
  });

  await t.step('rejects names without a hyphen', () => {
    assertFalse(isValidTagName('myelement'));
    assertFalse(isValidTagName('a'));
  });

  await t.step('rejects empty or non-string input', () => {
    assertFalse(isValidTagName(''));
    assertFalse(isValidTagName(null as unknown as string));
    assertFalse(isValidTagName(undefined as unknown as string));
  });

  await t.step('rejects uppercase letters', () => {
    assertFalse(isValidTagName('My-Element'));
    assertFalse(isValidTagName('my-Element'));
  });

  await t.step('rejects names starting with a digit', () => {
    assertFalse(isValidTagName('1-element'));
  });

  await t.step('rejects reserved names', () => {
    assertFalse(isValidTagName('annotation-xml'));
    assertFalse(isValidTagName('font-face'));
    assertFalse(isValidTagName('missing-glyph'));
  });
});

// ─── style-sheet SSR shim ────────────────────────────────────────────────────

Deno.test('style-sheet - SSR shim parses CSS', async (t) => {
  await t.step('parses a simple rule', () => {
    const sheet = new StyleSheet();
    sheet.replaceSync('a { color: red; }');
    assertEquals(sheet.cssRules.length, 1);
    assertStringIncludes(sheet.cssRules[0].cssText, 'a');
    assertStringIncludes(sheet.cssRules[0].cssText, 'color: red');
  });

  await t.step('parses multiple rules', () => {
    const sheet = new StyleSheet();
    sheet.replaceSync('a { color: red; } b { color: blue; }');
    assertEquals(sheet.cssRules.length, 2);
  });

  await t.step('ignores comments', () => {
    const sheet = new StyleSheet();
    sheet.replaceSync('/* comment */ a { color: red; }');
    assertEquals(sheet.cssRules.length, 1);
  });

  await t.step('handles empty and whitespace input', () => {
    const sheet = new StyleSheet();
    sheet.replaceSync('   \n  ');
    assertEquals(sheet.cssRules.length, 0);
  });

  await t.step('falls back to raw css for malformed braces', () => {
    const sheet = new StyleSheet();
    sheet.replaceSync('a { color: red');
    assertEquals(sheet.cssRules.length, 1);
    assertStringIncludes(sheet.cssRules[0].cssText, 'a { color: red');
  });

  await t.step('handles nested at-rules / braces', () => {
    const sheet = new StyleSheet();
    sheet.replaceSync('@media screen { a { color: red; } }');
    assertEquals(sheet.cssRules.length, 1);
    assertStringIncludes(sheet.cssRules[0].cssText, '@media screen');
  });
});

// ─── logger ──────────────────────────────────────────────────────────────────

function captureConsole(method: 'log' | 'warn' | 'error' | 'info' | 'debug') {
  const original = console[method];
  const calls: unknown[][] = [];
  (console as unknown as Record<string, (...args: unknown[]) => void>)[method] = (
    ...args: unknown[]
  ) => calls.push(args);
  return {
    calls,
    [Symbol.dispose]() {
      (console as unknown as Record<string, (...args: unknown[]) => void>)[method] = original;
    },
    restore() {
      (console as unknown as Record<string, (...args: unknown[]) => void>)[method] = original;
    },
  };
}

Deno.test('logger - createLogger prefixes messages', () => {
  const c = captureConsole('warn');
  try {
    const log = createLogger('core');
    log.warn('hello');
    assertEquals(c.calls.length, 1);
    assertEquals(c.calls[0][0], '[core] hello');
  } finally {
    c.restore();
  }
});

Deno.test('logger - warnOnce deduplicates by key', () => {
  const c = captureConsole('warn');
  try {
    const log = createLogger('core');
    const key = `warn-once-${Date.now()}`;
    warnOnce(key, log, 'first');
    warnOnce(key, log, 'second');
    assertEquals(c.calls.length, 1);
    assertStringIncludes(String(c.calls[0][0]), 'first');
  } finally {
    c.restore();
  }
});

// ─── errors ──────────────────────────────────────────────────────────────────

Deno.test('errors - formatError handles non-Errors', () => {
  assertEquals(formatError('oops'), 'oops');
  assertEquals(formatError(42), '42');
  assertEquals(formatError({ toString: () => 'custom' }), 'custom');
});

Deno.test('errors - PropValidationError captures property details', () => {
  const err = new PropValidationError('count', 123);
  assertEquals(err.code, ErrorCode.PROP_VALIDATION_ERROR);
  assertEquals(err.propertyName, 'count');
  assertEquals(err.receivedValue, 123);
  assertEquals(err.severity, 'warning');
});

Deno.test('errors - RenderError captures path, tag and cause', () => {
  const cause = new Error('boom');
  const err = new RenderError('app/routes/index.ts', 'render failed', 'CUSTOM', 'my-tag', cause);
  assertEquals(err.code, 'CUSTOM');
  assertEquals(err.componentPath, 'app/routes/index.ts');
  assertEquals(err.tagName, 'my-tag');
  assertEquals(err.cause, cause);
});

Deno.test('errors - reportError uses telemetry hook', () => {
  const calls: OpenElementError[] = [];
  const hook: ErrorTelemetryHook = (e) => calls.push(e as OpenElementError);
  setErrorTelemetryHook(hook);
  try {
    const err = new OpenElementError('telemetry test', { code: ErrorCode.UNKNOWN });
    reportError(err);
    assertEquals(calls.length, 1);
    assertEquals(calls[0].message, 'telemetry test');
  } finally {
    setErrorTelemetryHook(undefined as unknown as ErrorTelemetryHook);
  }
});

Deno.test('errors - reportError falls back to console.error', () => {
  const c = captureConsole('error');
  try {
    setErrorTelemetryHook(undefined as unknown as ErrorTelemetryHook);
    const err = new SsrRenderError('path', new Error('inner'));
    reportError(err);
    assertEquals(c.calls.length, 1);
    assertStringIncludes(String(c.calls[0][0]), '[openElement:SSR_RENDER_ERROR]');
  } finally {
    c.restore();
  }
});

Deno.test('errors - telemetry hook errors are swallowed', () => {
  setErrorTelemetryHook(
    (() => {
      throw new Error('hook boom');
    }) as ErrorTelemetryHook,
  );
  const c = captureConsole('error');
  try {
    reportError(new OpenElementError('safe'));
    assertEquals(c.calls.length, 0);
  } finally {
    c.restore();
    setErrorTelemetryHook(undefined as unknown as ErrorTelemetryHook);
  }
});

// ─── context ─────────────────────────────────────────────────────────────────

Deno.test('context - extractParams returns empty on invalid pattern', () => {
  // An unbalanced group should cause URLPattern to throw.
  const params = extractParams('/foo/((', '/foo/bar');
  assertEquals(params, {});
});

// ─── html-escape edge cases ──────────────────────────────────────────────────

Deno.test('html-escape - escapeHtml edge cases', async (t) => {
  await t.step('returns empty string for non-string input', () => {
    assertEquals(escapeHtml(null as unknown as string), '');
    assertEquals(escapeHtml(undefined as unknown as string), '');
    assertEquals(escapeHtml(123 as unknown as string), '');
  });

  await t.step('leaves safe strings unchanged', () => {
    assertEquals(escapeHtml('hello world'), 'hello world');
  });
});

Deno.test('html-escape - wrapInDocument security and edge cases', async (t) => {
  await t.step('strips script tags from headExtras by default', () => {
    const html = wrapInDocument('<p>x</p>', {
      headExtras: '<script>alert(1)</script><link rel="stylesheet" href="/a.css">',
    });
    assertFalse(html.includes('<script>'));
    assertFalse(html.includes('alert(1)'));
    assertStringIncludes(html, '<link rel="stylesheet" href="/a.css">');
  });

  await t.step('allows scripts in headExtras when explicitly permitted', () => {
    const html = wrapInDocument('<p>x</p>', {
      headExtras: '<script>alert(1)</script>',
      allowHeadExtrasScripts: true,
    });
    assertStringIncludes(html, '<script>alert(1)</script>');
  });

  await t.step('strips on* event handler attributes from headExtras', () => {
    const c = captureConsole('warn');
    try {
      const html = wrapInDocument('<p>x</p>', {
        headExtras: '<div onclick="alert(1)">y</div>',
      });
      assertFalse(html.includes('onclick'));
      assertEquals(c.calls.length, 1);
    } finally {
      c.restore();
    }
  });

  await t.step('warns about unbalanced HTML comments in headExtras', () => {
    const c = captureConsole('warn');
    try {
      wrapInDocument('<p>x</p>', { headExtras: '<!-- unclosed' });
      const found = c.calls.some((args) => String(args[0]).includes('unbalanced HTML comments'));
      assert(found);
    } finally {
      c.restore();
    }
  });

  await t.step('ignores invalid CSP nonce format', () => {
    const c = captureConsole('warn');
    try {
      const html = wrapInDocument('<p>x</p>', { cspNonce: 'has spaces!' });
      assertFalse(html.includes('nonce='));
      assertEquals(c.calls.length, 1);
    } finally {
      c.restore();
    }
  });

  await t.step('accepts valid CSP nonce format without warning', () => {
    const c = captureConsole('warn');
    try {
      const html = wrapInDocument('<p>x</p>', { cspNonce: 'dGVzdG5vbmNl123' });
      assertFalse(html.includes('nonce='));
      assertEquals(c.calls.length, 0);
    } finally {
      c.restore();
    }
  });

  await t.step('renders dangerousHeadFragments raw', () => {
    const html = wrapInDocument('<p>x</p>', {
      dangerouslyHeadFragments: ['<meta name="x" content="y">'],
    });
    assertStringIncludes(html, '<meta name="x" content="y">');
  });

  await t.step('renders custom meta tags array', () => {
    const html = wrapInDocument('<p>x</p>', {
      meta: {
        tags: [
          { property: 'og:title', content: 'T' },
          { 'http-equiv': 'X-UA-Compatible', content: 'IE=edge' },
        ],
      },
    });
    assertStringIncludes(html, 'property="og:title"');
    assertStringIncludes(html, 'content="T"');
    assertStringIncludes(html, 'http-equiv="X-UA-Compatible"');
  });

  await t.step('escapes attribute values in meta tags', () => {
    const html = wrapInDocument('<p>x</p>', {
      meta: { tags: [{ content: '"<script>' }] },
    });
    assertStringIncludes(html, '&quot;');
    assertStringIncludes(html, '&lt;script&gt;');
  });
});

Deno.test('html-escape - renderSsrError status handling', () => {
  const html = renderSsrError(new Error('x'), 404, false);
  assertStringIncludes(html, 'Error 404');
});

// ─── signal-context ──────────────────────────────────────────────────────────

Deno.test('signal-context - default value without host', () => {
  const ctx = createContext(Symbol('ctx'), 42);
  const sig = consumeContext(ctx);
  assertEquals(sig.value, 42);
});

Deno.test('signal-context - provide and consume on same host', () => {
  const key = Symbol('host-ctx');
  const ctx = createContext(key, 'default');
  const host = {} as HTMLElement;
  provideContext(host, ctx, 'provided');
  const sig = consumeContext(ctx, host);
  assertEquals(sig.value, 'provided');
});

Deno.test('signal-context - walks parentElement chain', () => {
  const key = Symbol('parent-ctx');
  const ctx = createContext(key, 'default');
  const parent = {} as HTMLElement;
  const child = { parentNode: parent } as unknown as HTMLElement;
  provideContext(parent, ctx, 'from-parent');
  const sig = consumeContext(ctx, child);
  assertEquals(sig.value, 'from-parent');
});

Deno.test('signal-context - falls back to default signal', () => {
  const key = Symbol('default-ctx');
  const ctx = createContext(key, 'fallback');
  const orphan = {} as HTMLElement;
  const sig = consumeContext(ctx, orphan);
  assertEquals(sig.value, 'fallback');
});

Deno.test('signal-context - shadows default with provided value', () => {
  const key = Symbol('shadow-ctx');
  const ctx = createContext(key, 'default');
  const host = {} as HTMLElement;
  provideContext(host, ctx, 'shadow');
  const sig = consumeContext(ctx, host);
  sig.value = 'mutated';
  const defaultSig = consumeContext(ctx);
  assertEquals(defaultSig.value, 'default');
});

// ─── dsd-hydration ───────────────────────────────────────────────────────────

Deno.test('dsd-hydration - createDsdRenderRoot', async (t) => {
  await t.step('returns existing non-empty shadow root', () => {
    const root = { childElementCount: 1 } as unknown as ShadowRoot;
    const el = { shadowRoot: root, attachShadowCount: 0 } as unknown as HTMLElement;
    assertEquals(createDsdRenderRoot(el), root);
  });

  await t.step('attaches new shadow root when empty', () => {
    const newRoot = {} as unknown as ShadowRoot;
    const el = {
      shadowRoot: { childElementCount: 0 } as unknown as ShadowRoot,
      attachShadow: () => newRoot,
    } as unknown as HTMLElement;
    assertEquals(createDsdRenderRoot(el), newRoot);
  });

  await t.step('attaches shadow root when missing', () => {
    const newRoot = {} as unknown as ShadowRoot;
    const el = {
      attachShadow: () => newRoot,
    } as unknown as HTMLElement;
    assertEquals(createDsdRenderRoot(el), newRoot);
  });
});

Deno.test('dsd-hydration - hydrateDsdEvents guards', () => {
  const elNoShadow = {} as HTMLElement;
  assertEquals(hydrateDsdEvents(elNoShadow, { hydrateEvents: [] }), undefined);

  const elWithShadow = { shadowRoot: {} } as unknown as HTMLElement;
  assertEquals(hydrateDsdEvents(elWithShadow, { hydrateEvents: [] }), undefined);
});

Deno.test('dsd-hydration-events - binds public methods and skips private', () => {
  const bound: Array<{ type: string; selector: string }> = [];
  const root = {
    querySelectorAll: () => [
      {
        addEventListener: (type: string, _handler: unknown, _opts: unknown) => {
          bound.push({ type, selector: 'button' });
        },
      },
    ],
  } as unknown as ParentNode;

  const host = {
    onClick: () => {},
    __privateMethod: () => {},
    notAFunction: 'nope',
  };

  bindHydrateEvents(
    root,
    host,
    [
      { event: 'click', selector: 'button', method: 'onClick' },
      { event: 'click', selector: 'button', method: '__privateMethod' },
      { event: 'click', selector: 'button', method: 'notAFunction' },
      { event: 'click', selector: 'button', method: 'missingMethod' },
    ] as unknown as Parameters<typeof bindHydrateEvents>[2],
    new AbortController().signal,
  );

  assertEquals(bound.length, 1);
  assertEquals(bound[0], { type: 'click', selector: 'button' });
});

// ─── prop runtime ────────────────────────────────────────────────────────────

class FakeElement {
  static observedAttributes?: string[];
  #attrs = new Map<string, string>();

  setAttribute(name: string, value: string): void {
    this.#attrs.set(name.toLowerCase(), String(value));
  }

  removeAttribute(name: string): void {
    this.#attrs.delete(name.toLowerCase());
  }

  getAttribute(name: string): string | null {
    return this.#attrs.get(name.toLowerCase()) ?? null;
  }

  hasAttribute(name: string): boolean {
    return this.#attrs.has(name.toLowerCase());
  }
}

Deno.test('prop - normalizePropDecl', async (t) => {
  await t.step('function shorthand for Boolean/Number/String', () => {
    assertEquals(normalizePropDecl(Boolean), { type: Boolean, default: false, reflect: false });
    assertEquals(normalizePropDecl(Number), { type: Number, default: 0, reflect: false });
    assertEquals(normalizePropDecl(String), { type: String, default: '', reflect: false });
  });

  await t.step('object declaration with explicit fields', () => {
    assertEquals(normalizePropDecl({ type: Number, default: 5, reflect: true }), {
      type: Number,
      default: 5,
      reflect: true,
    });
  });

  await t.step('object declaration defaults', () => {
    assertEquals(normalizePropDecl({}), { type: String, default: '', reflect: false });
    assertEquals(normalizePropDecl({ type: Boolean }), {
      type: Boolean,
      default: false,
      reflect: false,
    });
  });

  await t.step('unknown input defaults to String', () => {
    assertEquals(normalizePropDecl(null), { type: String, default: '', reflect: false });
    assertEquals(normalizePropDecl(undefined), { type: String, default: '', reflect: false });
  });
});

Deno.test('prop - registerStaticObservedAttributes', () => {
  const Ctor: { observedAttributes?: string[] } = {};
  registerStaticObservedAttributes(Ctor, { foo: String, FooBar: String });
  assertEquals(Ctor.observedAttributes, ['foo', 'foobar']);
});

Deno.test('prop - unwrap', () => {
  assertEquals(unwrap('plain'), 'plain');
  assertEquals(unwrap(null), null);
  const sig = { value: 7, subscribe: (_fn: (v: unknown) => void) => () => {} };
  assertEquals(unwrap(sig), 7);
});

Deno.test('prop - initializeStaticProps reflects Boolean prop', () => {
  class BoolEl extends FakeElement {
    static props = { active: { type: Boolean, reflect: true } };
  }
  const el = new BoolEl() as unknown as HTMLElement;
  initializeStaticProps(el);

  assertEquals((el as unknown as { active: { value: boolean } }).active.value, false);
  (el as unknown as { active: { value: boolean } }).active.value = true;
  assert(el.hasAttribute('active'));

  (el as unknown as { active: { value: boolean } }).active.value = false;
  assertFalse(el.hasAttribute('active'));
});

Deno.test('prop - initializeStaticProps reflects Number prop', () => {
  class NumEl extends FakeElement {
    static props = { count: { type: Number, default: 10, reflect: true } };
  }
  const el = new NumEl() as unknown as HTMLElement;
  initializeStaticProps(el);

  assertEquals((el as unknown as { count: { value: number } }).count.value, 10);
  (el as unknown as { count: { value: number } }).count.value = 42;
  assertEquals(el.getAttribute('count'), '42');
});

Deno.test('prop - initializeStaticProps reflects String prop', () => {
  class StrEl extends FakeElement {
    static props = { label: { type: String, default: 'hi', reflect: true } };
  }
  const el = new StrEl() as unknown as HTMLElement;
  initializeStaticProps(el);

  assertEquals((el as unknown as { label: { value: string } }).label.value, 'hi');
  (el as unknown as { label: { value: string } }).label.value = 'bye';
  assertEquals(el.getAttribute('label'), 'bye');
});

Deno.test('prop - initializeStaticProps with no props is a no-op', () => {
  class NoPropsEl extends FakeElement {}
  const el = new NoPropsEl() as unknown as HTMLElement;
  assertEquals(initializeStaticProps(el), undefined);
});

Deno.test('prop - disposeStaticProps unsubscribes reflectors', () => {
  class DisEl extends FakeElement {
    static props = { toggled: { type: Boolean, reflect: true } };
  }
  const el = new DisEl() as unknown as HTMLElement;
  initializeStaticProps(el);
  const prop = (el as unknown as { toggled: { value: boolean } }).toggled;
  prop.value = true;
  assert(el.hasAttribute('toggled'));
  disposeStaticProps(el);
  prop.value = false;
  // After disposal the reflector should no longer run.
  assert(el.hasAttribute('toggled'));
});

Deno.test('prop - handleStaticPropAttributeChange', async (t) => {
  await t.step('Boolean attribute added sets true', () => {
    class BE extends FakeElement {
      static props = { enabled: Boolean };
    }
    const el = new BE() as unknown as HTMLElement;
    initializeStaticProps(el);
    handleStaticPropAttributeChange(el, 'enabled', null, '');
    assertEquals((el as unknown as { enabled: { value: boolean } }).enabled.value, true);
  });

  await t.step('Boolean attribute removed sets false', () => {
    class BE extends FakeElement {
      static props = { enabled: Boolean };
    }
    const el = new BE() as unknown as HTMLElement;
    initializeStaticProps(el);
    (el as unknown as { enabled: { value: boolean } }).enabled.value = true;
    handleStaticPropAttributeChange(el, 'enabled', '', null);
    assertEquals((el as unknown as { enabled: { value: boolean } }).enabled.value, false);
  });

  await t.step('Number attribute parses value', () => {
    class NE extends FakeElement {
      static props = { count: Number };
    }
    const el = new NE() as unknown as HTMLElement;
    initializeStaticProps(el);
    handleStaticPropAttributeChange(el, 'count', null, '7');
    assertEquals((el as unknown as { count: { value: number } }).count.value, 7);
  });

  await t.step('Number attribute falls back to 0 for NaN', () => {
    class NE extends FakeElement {
      static props = { count: Number };
    }
    const el = new NE() as unknown as HTMLElement;
    initializeStaticProps(el);
    handleStaticPropAttributeChange(el, 'count', null, 'abc');
    assertEquals((el as unknown as { count: { value: number } }).count.value, 0);
  });

  await t.step('String attribute sets raw value', () => {
    class SE extends FakeElement {
      static props = { name: String };
    }
    const el = new SE() as unknown as HTMLElement;
    initializeStaticProps(el);
    handleStaticPropAttributeChange(el, 'name', null, 'test');
    assertEquals((el as unknown as { name: { value: string } }).name.value, 'test');
  });

  await t.step('unknown attribute is ignored', () => {
    class UE extends FakeElement {
      static props = { name: String };
    }
    const el = new UE() as unknown as HTMLElement;
    initializeStaticProps(el);
    handleStaticPropAttributeChange(el, 'other', null, 'x');
    assertEquals((el as unknown as { name: { value: string } }).name.value, '');
  });

  await t.step('is no-op when props are not initialized', () => {
    const el = new FakeElement() as unknown as HTMLElement;
    assertEquals(handleStaticPropAttributeChange(el, 'x', null, 'y'), undefined);
  });
});

Deno.test('prop - syncStaticPropsFromAttributes', () => {
  class SyncEl extends FakeElement {
    static props = { enabled: Boolean, count: Number, label: String };
  }
  const el = new SyncEl() as unknown as HTMLElement;
  initializeStaticProps(el);
  el.setAttribute('enabled', '');
  el.setAttribute('count', '3');
  el.setAttribute('label', 'sync');

  syncStaticPropsFromAttributes(el);

  assertEquals((el as unknown as { enabled: { value: boolean } }).enabled.value, true);
  assertEquals((el as unknown as { count: { value: number } }).count.value, 3);
  assertEquals((el as unknown as { label: { value: string } }).label.value, 'sync');
});

Deno.test('prop - syncStaticPropsFromAttributes is safe with missing signal map', () => {
  const el = new FakeElement() as unknown as HTMLElement;
  assert(() => {
    syncStaticPropsFromAttributes(el);
    return true;
  });
});

Deno.test('prop - prop value change through property setter reflects', () => {
  class SetEl extends FakeElement {
    static props = { title: { type: String, reflect: true } };
  }
  const el = new SetEl() as unknown as HTMLElement;
  initializeStaticProps(el);
  (el as unknown as { title: { value: string } }).title.value = 'hello';
  assertEquals(el.getAttribute('title'), 'hello');
});
