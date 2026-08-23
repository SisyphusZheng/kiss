/**
 * static-style-casing.test.ts — CSR static style keys go through the single
 * casing rule (camelToKebab), matching SSR styleObjectToString (#1056).
 *
 * Browsers silently ignore camelCase property names passed to
 * CSSStyleDeclaration.setProperty(), so a static-style descriptor built from
 * { backgroundColor: 'red' } used to render no style at all on the CSR path
 * while SSR emitted `background-color`. applyStaticStyle is the single DOM
 * write point for every static-style descriptor (initial render and
 * re-activation alike), so the descriptor-level assertion here covers both.
 */

import { assertEquals, assertStringIncludes } from '@std/assert';
import { applyBindingDescriptor } from '../src/internal/core/binding-activation.ts';
import { bindStaticStyle } from '../src/internal/core/binding-descriptor.ts';
import { serializeAttrs } from '../src/internal/core/render-ir.ts';
import { attrNameFor, VNODE_CONTROL_PROP_KEYS } from '../src/internal/core/vnode-prop-rules.ts';

Deno.test('static-style binding kebab-cases camelCase keys (#1056)', () => {
  const calls: [string, string][] = [];
  const el = {
    style: {
      setProperty: (name: string, value: string) => calls.push([name, value]),
    },
  } as unknown as Element;

  applyBindingDescriptor(
    bindStaticStyle(el, { backgroundColor: 'red', 'font-size': '12px' }),
    {},
  );

  assertEquals(calls, [['background-color', 'red'], ['font-size', '12px']]);
});

Deno.test('SSR and CSR share attribute, style, and control-prop rules (#1096)', () => {
  assertEquals(attrNameFor('x-card', 'className'), 'class');
  assertEquals(attrNameFor('x-card', 'htmlFor'), 'for');
  assertEquals(attrNameFor('x-card', 'itemCount'), 'item-count');
  assertEquals(VNODE_CONTROL_PROP_KEYS.has('children'), true);

  const html = serializeAttrs('x-card', {
    className: 'box',
    htmlFor: 'field',
    itemCount: 2,
    style: { backgroundColor: 'red', display: null },
    children: 'ignored',
  });
  assertStringIncludes(html, 'class="box"');
  assertStringIncludes(html, 'for="field"');
  assertStringIncludes(html, 'item-count="2"');
  assertStringIncludes(html, 'style="background-color: red"');
  assertEquals(html.includes('children='), false);
});
