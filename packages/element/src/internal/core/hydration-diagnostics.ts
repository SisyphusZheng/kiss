import {
  collectDomBranchMarkers,
  type EventBindingRecord,
  isInsideNestedLightHost,
} from './event-hydration.ts';
import { DATA_EID } from '../protocol/hydration-markers.ts';

/** Stable diagnostic code for SSR/hydration mismatches (#631). */
export const HYDRATION_MISMATCH_CODE = 'OPEN_ELEMENT_HYDRATION_MISMATCH';
export type HydrationMismatchReason =
  | 'marker-count'
  | 'branch-count'
  | 'branch-token'
  | 'marker-id';

/**
 * Which activation root a mismatch was detected on. Purely a wording input
 * for formatHydrationMismatchMessage: light-mode hosts carry no shadow root
 * (ADR-0142, #1148), so the message must name the actual root. Defaults to
 * 'shadow', which keeps the historical exact text.
 */
export type HydrationRootKind = 'shadow' | 'light';

export interface HydrationMismatchDetail {
  reason: HydrationMismatchReason;
  hostTag: string;
  expectedMarkers: number;
  actualMarkers: number;
  expectedBranches: string[];
  actualBranches: string[];
  divergedAt?: number;
  /** Reason 'marker-id' only: the exact VNode-derived id set (e0..e(N-1)). */
  expectedMarkerIds?: string[];
  /** Reason 'marker-id' only: the in-scope DOM data-eid values found. */
  actualMarkerIds?: string[];
}

interface ImportMetaWithEnv extends ImportMeta {
  env?: { DEV?: boolean };
}

export function isHydrationDevBuild(): boolean {
  return (import.meta as ImportMetaWithEnv).env?.DEV === true;
}

export function formatHydrationMismatchMessage(
  detail: HydrationMismatchDetail,
  dev: boolean,
  rootKind: HydrationRootKind = 'shadow',
): string {
  const rootLabel = rootKind === 'light' ? 'light DOM subtree' : 'shadow root';
  if (!dev) {
    return `[${HYDRATION_MISMATCH_CODE}] SSR/hydration mismatch (${detail.reason}) on ` +
      `<${detail.hostTag}>; falling back to client-side render for this ${rootLabel}.`;
  }
  const lines = [
    `[${HYDRATION_MISMATCH_CODE}] SSR/hydration mismatch on <${detail.hostTag}>: ` +
    `the SSR ${rootKind === 'light' ? 'light DOM' : 'shadow root'} diverged from the client VNode.`,
  ];
  if (detail.reason === 'marker-count') {
    lines.push(
      `  data-eid event markers: expected ${detail.expectedMarkers} (client VNode), ` +
        `found ${detail.actualMarkers} (SSR DOM).`,
    );
  } else if (detail.reason === 'marker-id') {
    lines.push(
      `  data-eid marker ids: expected exactly [${(detail.expectedMarkerIds ?? []).join(', ')}] ` +
        `(client VNode), found [${(detail.actualMarkerIds ?? []).join(', ')}] (SSR DOM); ` +
        'every id must be present exactly once (order is irrelevant).',
    );
  } else if (detail.reason === 'branch-count') {
    lines.push(
      `  oe-branch tokens: expected ${detail.expectedBranches.length} (client VNode), ` +
        `found ${detail.actualBranches.length} (SSR DOM).`,
    );
  } else {
    const at = detail.divergedAt ?? 0;
    lines.push(
      `  oe-branch token diverges at index ${at}: expected ` +
        `"${detail.expectedBranches[at]}", found "${detail.actualBranches[at]}".`,
    );
  }
  if (detail.reason === 'branch-count' || detail.reason === 'branch-token') {
    lines.push(`  expected tokens: [${detail.expectedBranches.join(', ')}]`);
    lines.push(`  actual tokens:   [${detail.actualBranches.join(', ')}]`);
  }
  lines.push(`Falling back to client-side render for this ${rootLabel}.`);
  return lines.join('\n');
}

/**
 * Determinism guard for marker-based event hydration.
 *
 * SSR (renderToNode) and hydration (collectEventBindings) assign `data-eid`
 * values in the same traversal order, so the marker count in the serialized
 * DOM must equal the binding count derived from the cached VNode, and the
 * `<!--oe-branch:...-->` token sequence must match exactly. Any drift means
 * runtime signal values changed between SSR and hydration (or the SSR HTML
 * was transformed), in which case position-based binding would be wrong.
 *
 * Light roots (ADR-0142 readiness, #1148) additionally validate the exact
 * in-scope id multiset: the DOM `data-eid` values must be precisely the
 * VNode-derived set `e0..e(N-1)`, so a duplicated, missing, or substituted
 * id degrades even when the count matches. Bindings are id-keyed
 * (hydrateEventMarkers looks records up by `data-eid`), so REORDERED ids
 * are fine — only membership and uniqueness matter. Shadow roots keep the
 * historical count-only check (frozen behavior).
 *
 * Returns null on a match; on divergence returns the structured detail used
 * for the #631 diagnostic (checks run cheapest-first: marker count, light
 * id multiset, branch count, then token equality).
 */
export function detectSsrMismatch(
  root: ShadowRoot | HTMLElement,
  host: Element | undefined,
  eventBindings: Map<string, EventBindingRecord[]>,
  expectedBranches: string[],
  scopeLightHost: boolean,
): HydrationMismatchDetail | null {
  const hostTag = host?.tagName?.toLowerCase() ?? '(unknown host)';
  const markerEls = root.querySelectorAll(`[${DATA_EID}]`);
  let actualMarkers = markerEls.length;
  if (scopeLightHost) {
    // ADR-0142 (#1148): markers inside a nested light host's subtree bind in
    // the nested host's own scope — count only markers in this scope.
    actualMarkers = 0;
    for (const el of markerEls) {
      if (!isInsideNestedLightHost(el, root)) actualMarkers++;
    }
  }
  if (actualMarkers !== eventBindings.size) {
    return {
      reason: 'marker-count',
      hostTag,
      expectedMarkers: eventBindings.size,
      actualMarkers,
      expectedBranches,
      actualBranches: [],
    };
  }

  if (scopeLightHost) {
    // ADR-0142 readiness (#1148): count equality is not enough for a light
    // root — the in-scope DOM ids must be EXACTLY the VNode-derived id set
    // (e0..e(N-1)). A duplicated, missing, or substituted id means the SSR
    // DOM was hand-authored or transformed, and id-keyed binding would
    // mis-wire handlers. Reordered ids are fine: only membership and
    // uniqueness matter.
    const expectedMarkerIds = [...eventBindings.keys()];
    const actualMarkerIds: string[] = [];
    for (const el of markerEls) {
      if (isInsideNestedLightHost(el, root)) continue;
      actualMarkerIds.push(el.getAttribute(DATA_EID) ?? '');
    }
    const byId = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);
    const sortedActual = [...actualMarkerIds].sort(byId).join('\n');
    const sortedExpected = [...expectedMarkerIds].sort(byId).join('\n');
    if (sortedActual !== sortedExpected) {
      return {
        reason: 'marker-id',
        hostTag,
        expectedMarkers: eventBindings.size,
        actualMarkers,
        expectedBranches,
        actualBranches: [],
        expectedMarkerIds,
        actualMarkerIds,
      };
    }
  }

  const actualBranches = collectDomBranchMarkers(root, { scopeLightHost });
  const base = {
    hostTag,
    expectedMarkers: eventBindings.size,
    actualMarkers,
    expectedBranches,
    actualBranches,
  };
  if (actualBranches.length !== expectedBranches.length) {
    return { reason: 'branch-count', ...base };
  }
  const divergedAt = expectedBranches.findIndex((token, i) => actualBranches[i] !== token);
  if (divergedAt !== -1) {
    return { reason: 'branch-token', ...base, divergedAt };
  }
  return null;
}

const selfHydratedElements = new WeakSet<Element>();

export function markSelfHydrated(el: Element): void {
  selfHydratedElements.add(el);
}

export function hasSelfHydrated(el: Element): boolean {
  return selfHydratedElements.has(el);
}
