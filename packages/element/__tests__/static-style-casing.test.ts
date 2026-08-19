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

import { assertEquals } from '@std/assert';
import { applyBindingDescriptor } from '../src/internal/core/binding-activation.ts';
import { bindStaticStyle } from '../src/internal/core/binding-descriptor.ts';

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
