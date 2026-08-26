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

const selfHydratedElements = new WeakSet<Element>();

export function markSelfHydrated(el: Element): void {
  selfHydratedElements.add(el);
}

export function hasSelfHydrated(el: Element): boolean {
  return selfHydratedElements.has(el);
}
