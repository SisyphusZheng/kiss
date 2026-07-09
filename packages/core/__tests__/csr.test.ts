/**
 * @openelement/core/csr — barrel surface smoke test.
 *
 * csr.ts is a re-export module; this test asserts the public runtime surface
 * it aggregates is intact so a refactor that drops a binding/renderer export
 * is caught immediately.
 */

import { assertEquals, assertExists } from 'jsr:@std/assert@^1.0.0';
import * as csr from '../src/csr.ts';
import { applyProps, collectPropBindings, renderToDom } from '../src/jsx-render-dom.ts';
import {
  collectEventBindings,
  eventRecordsToDescriptors,
  hydrateEventMarkers,
} from '../src/event-hydration.ts';

Deno.test('csr barrel re-exports the static rendering surface', () => {
  // static.ts surface
  assertEquals(typeof csr.renderToDom, 'function');
});

Deno.test('csr barrel re-exports binding descriptors', () => {
  for (const name of ['bindAttr', 'bindClass', 'bindEvent', 'bindHtml', 'bindList', 'bindRef']) {
    const value = (csr as Record<string, unknown>)[name];
    assertEquals(typeof value, 'function', `${name} should be exported from csr.ts`);
  }
});

Deno.test('csr barrel re-exports the full DOM renderer', () => {
  assertEquals(csr.applyProps, applyProps);
  assertEquals(csr.collectPropBindings, collectPropBindings);
  assertEquals(csr.renderToDom, renderToDom);
});

Deno.test('csr barrel re-exports event hydration helpers', () => {
  assertEquals(csr.collectEventBindings, collectEventBindings);
  assertEquals(csr.eventRecordsToDescriptors, eventRecordsToDescriptors);
  assertEquals(csr.hydrateEventMarkers, hydrateEventMarkers);
});

Deno.test('csr barrel re-exports binding activation', () => {
  assertExists(csr.applyBindingDescriptor);
  assertExists(csr.commitBindings);
  assertExists(csr.registerBindingKind);
});
