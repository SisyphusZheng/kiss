/**
 * #631 — Hydration-mismatch developer diagnostics.
 *
 * Pins the stable message shape of formatHydrationMismatchMessage: production
 * gets a one-line coded summary, development gets the full structured detail
 * (expected vs actual counts, both oe-branch token sequences, divergence
 * index). The end-to-end contract (warning fires with code + structured
 * detail, degradation still re-renders client-side) is covered by the
 * mismatch tests in open-element.test.ts.
 */

import { assertEquals, assertStringIncludes } from '@std/assert';
import {
  formatHydrationMismatchMessage,
  HYDRATION_MISMATCH_CODE,
  type HydrationMismatchDetail,
} from '../src/internal/core/hydration-scope.ts';

const base: HydrationMismatchDetail = {
  reason: 'marker-count',
  hostTag: 'x-counter',
  expectedMarkers: 1,
  actualMarkers: 2,
  expectedBranches: [],
  actualBranches: [],
};

Deno.test('hydration mismatch code is stable and taxonomy-styled', () => {
  assertEquals(HYDRATION_MISMATCH_CODE, 'OPEN_ELEMENT_HYDRATION_MISMATCH');
});

Deno.test('prod mismatch message is a one-line coded summary', () => {
  const message = formatHydrationMismatchMessage(base, false);
  assertEquals(
    message,
    '[OPEN_ELEMENT_HYDRATION_MISMATCH] SSR/hydration mismatch (marker-count) on ' +
      '<x-counter>; falling back to client-side render for this shadow root.',
  );
  assertEquals(message.includes('\n'), false);
});

Deno.test('dev marker-count message reports expected vs actual marker counts', () => {
  const message = formatHydrationMismatchMessage(base, true);
  assertStringIncludes(message, '[OPEN_ELEMENT_HYDRATION_MISMATCH]');
  assertStringIncludes(message, '<x-counter>');
  assertStringIncludes(message, 'expected 1 (client VNode), found 2 (SSR DOM)');
  assertStringIncludes(message, 'Falling back to client-side render for this shadow root.');
});

Deno.test('dev branch-count message reports token counts and both sequences', () => {
  const detail: HydrationMismatchDetail = {
    ...base,
    reason: 'branch-count',
    expectedMarkers: 2,
    actualMarkers: 2,
    expectedBranches: ['oe-branch:show:1', 'oe-branch:for:2:abc'],
    actualBranches: ['oe-branch:show:1'],
  };
  const message = formatHydrationMismatchMessage(detail, true);
  assertStringIncludes(message, 'expected 2 (client VNode), found 1 (SSR DOM)');
  assertStringIncludes(message, 'expected tokens: [oe-branch:show:1, oe-branch:for:2:abc]');
  assertStringIncludes(message, 'actual tokens:   [oe-branch:show:1]');
});

Deno.test('dev branch-token message names the divergence index and tokens', () => {
  const detail: HydrationMismatchDetail = {
    ...base,
    reason: 'branch-token',
    expectedMarkers: 1,
    actualMarkers: 1,
    expectedBranches: ['oe-branch:show:0'],
    actualBranches: ['oe-branch:show:1'],
    divergedAt: 0,
  };
  const message = formatHydrationMismatchMessage(detail, true);
  assertStringIncludes(
    message,
    'oe-branch token diverges at index 0: expected "oe-branch:show:0", found "oe-branch:show:1".',
  );
  const prod = formatHydrationMismatchMessage(detail, false);
  assertStringIncludes(prod, '(branch-token)');
  assertStringIncludes(prod, 'OPEN_ELEMENT_HYDRATION_MISMATCH');
});

Deno.test('an explicit shadow root kind keeps the historical exact wording', () => {
  // Threading the root kind through (ADR-0142 readiness) must not perturb
  // the pinned shadow text: explicit 'shadow' is identical to the default.
  assertEquals(
    formatHydrationMismatchMessage(base, false, 'shadow'),
    formatHydrationMismatchMessage(base, false),
  );
  assertEquals(
    formatHydrationMismatchMessage(base, true, 'shadow'),
    formatHydrationMismatchMessage(base, true),
  );
});

Deno.test('light-root mismatch wording names the light DOM subtree, never "shadow root" (ADR-0142, #1148)', () => {
  const prod = formatHydrationMismatchMessage(base, false, 'light');
  assertEquals(
    prod,
    '[OPEN_ELEMENT_HYDRATION_MISMATCH] SSR/hydration mismatch (marker-count) on ' +
      '<x-counter>; falling back to client-side render for this light DOM subtree.',
  );
  const dev = formatHydrationMismatchMessage(base, true, 'light');
  assertStringIncludes(dev, 'the SSR light DOM diverged from the client VNode.');
  assertStringIncludes(dev, 'Falling back to client-side render for this light DOM subtree.');
  assertEquals(dev.includes('shadow root'), false);
});

Deno.test('dev marker-id message lists expected vs actual marker ids (#1148)', () => {
  const detail: HydrationMismatchDetail = {
    ...base,
    reason: 'marker-id',
    expectedMarkers: 2,
    actualMarkers: 2,
    expectedMarkerIds: ['e0', 'e1'],
    actualMarkerIds: ['e0', 'e0'],
  };
  const message = formatHydrationMismatchMessage(detail, true, 'light');
  assertStringIncludes(message, '[OPEN_ELEMENT_HYDRATION_MISMATCH]');
  assertStringIncludes(
    message,
    'expected exactly [e0, e1] (client VNode), found [e0, e0] (SSR DOM)',
  );
  assertEquals(
    message.includes('expected tokens:'),
    false,
    'marker-id does not print the oe-branch token lines',
  );
  // Production stays a coded one-liner: reason + host, no id dump.
  const prod = formatHydrationMismatchMessage(detail, false, 'light');
  assertStringIncludes(prod, '(marker-id)');
  assertEquals(prod.includes('\n'), false);
  assertEquals(prod.includes('e0'), false);
});
