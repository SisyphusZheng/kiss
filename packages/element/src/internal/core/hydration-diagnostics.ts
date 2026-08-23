/** Stable diagnostic code for SSR/hydration mismatches (#631). */
export const HYDRATION_MISMATCH_CODE = 'OPEN_ELEMENT_HYDRATION_MISMATCH';
export type HydrationMismatchReason = 'marker-count' | 'branch-count' | 'branch-token';

export interface HydrationMismatchDetail {
  reason: HydrationMismatchReason;
  hostTag: string;
  expectedMarkers: number;
  actualMarkers: number;
  expectedBranches: string[];
  actualBranches: string[];
  divergedAt?: number;
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
): string {
  if (!dev) {
    return `[${HYDRATION_MISMATCH_CODE}] SSR/hydration mismatch (${detail.reason}) on ` +
      `<${detail.hostTag}>; falling back to client-side render for this shadow root.`;
  }
  const lines = [
    `[${HYDRATION_MISMATCH_CODE}] SSR/hydration mismatch on <${detail.hostTag}>: ` +
    'the SSR shadow root diverged from the client VNode.',
  ];
  if (detail.reason === 'marker-count') {
    lines.push(
      `  data-eid event markers: expected ${detail.expectedMarkers} (client VNode), ` +
        `found ${detail.actualMarkers} (SSR DOM).`,
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
  if (detail.reason !== 'marker-count') {
    lines.push(`  expected tokens: [${detail.expectedBranches.join(', ')}]`);
    lines.push(`  actual tokens:   [${detail.actualBranches.join(', ')}]`);
  }
  lines.push('Falling back to client-side render for this shadow root.');
  return lines.join('\n');
}

const selfHydratedElements = new WeakSet<Element>();

export function markSelfHydrated(el: Element): void {
  selfHydratedElements.add(el);
}

export function hasSelfHydrated(el: Element): boolean {
  return selfHydratedElements.has(el);
}
