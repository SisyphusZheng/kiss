/**
 * check-frozen-semantics.ts — mechanical gate for the ADR-0122 Consequences
 * rule (issue #972): "any PR touching frozen semantics must reference an
 * amendment ADR". Until now the rule was enforced by prose only (PR template
 * field, agent instructions); this tool makes it a hard check.
 *
 * The change set comes from `git diff --name-only <base>`:
 *   - PR CI: base is the merge-base of HEAD with origin/$GITHUB_BASE_REF
 *   - local: base is origin/main...HEAD
 * An amendment reference is any of:
 *   1. a changed/added file under docs/adr/ (the amendment path itself),
 *   2. an `ADR-\d+` token OTHER than the frozen baselines (ADR-0119,
 *      ADR-0122) in the last commit message — citing the frozen ADR itself
 *      is not an amendment,
 *   3. same as (2) for the PR body (GITHUB_EVENT_PATH, CI only).
 *
 * Frozen-semantics path list (extend here, with the ADR citation):
 *
 *   ADR-0122 §1 — loop contract (fail/redirect/loader/action algebra):
 *     packages/app/src/authoring.ts
 *   ADR-0122 §2 — action protocol (header contract, form enhance, morph):
 *     packages/adapter-vite/src/internal/ssg/entry-codegen.ts
 *     packages/adapter-vite/src/internal/ssg/form-enhance.ts
 *     packages/adapter-vite/src/internal/ssg/morph-*.ts
 *     packages/element/src/internal/protocol/data.ts
 *   ADR-0122 §3 — CSRF fail-closed default (same entry-codegen.ts block)
 *   ADR-0122 §4 — first-mile start/build contract:
 *     packages/adapter-vite/src/cli/start.ts
 *     packages/adapter-vite/src/cli/build.ts
 *   ADR-0119 — 0.41.x static freeze: the export surface is already gated by
 *     interface:snapshot (docs/release/public-interface-snapshot.json), so
 *     this gate deliberately targets semantics files, not exports.
 *
 * Usage: deno task freeze:semantics:check
 * Exit code 1 when a frozen path changed without an amendment reference.
 */

const FROZEN_PATHS: ReadonlyArray<{ pattern: RegExp; citation: string }> = [
  // ADR-0122 §1 — loop contract.
  { pattern: /^packages\/app\/src\/authoring\.ts$/, citation: 'ADR-0122 §1 (loop contract)' },
  // ADR-0122 §2/§3 — action protocol + CSRF default.
  {
    pattern: /^packages\/adapter-vite\/src\/internal\/ssg\/entry-codegen\.ts$/,
    citation: 'ADR-0122 §2/§3 (action protocol / CSRF default)',
  },
  {
    pattern: /^packages\/adapter-vite\/src\/internal\/ssg\/form-enhance\.ts$/,
    citation: 'ADR-0122 §2 (action protocol)',
  },
  {
    pattern: /^packages\/adapter-vite\/src\/internal\/ssg\/morph-[^/]*\.ts$/,
    citation: 'ADR-0122 §2 (morph client contract)',
  },
  {
    pattern: /^packages\/element\/src\/internal\/protocol\/data\.ts$/,
    citation: 'ADR-0122 §2 (action protocol)',
  },
  // ADR-0122 §4 — first-mile start.
  {
    pattern: /^packages\/adapter-vite\/src\/cli\/(start|build)\.ts$/,
    citation: 'ADR-0122 §4 (first-mile start)',
  },
];

const ADR_TOKEN_RE = /\bADR-(\d+)\b/gi;

/**
 * The frozen baselines themselves (ADR-0119: 0.41.x static freeze;
 * ADR-0122: loop/action/start semantics). Citing one of these alone merely
 * acknowledges the freeze — it is NOT an amendment reference.
 */
const FROZEN_BASELINE_ADRS = new Set(['0119', '0122']);

/** Pure: does free text cite an amendment ADR (not just a frozen baseline)? */
function mentionsAmendmentAdr(text: string): boolean {
  for (const match of text.matchAll(ADR_TOKEN_RE)) {
    if (!FROZEN_BASELINE_ADRS.has(match[1])) return true;
  }
  return false;
}

export interface AmendmentSignals {
  changedPaths: string[];
  commitMessage?: string;
  prBody?: string;
}

/** Pure: which changed paths land on the frozen-semantics list. */
export function findFrozenChanges(
  changedPaths: string[],
): Array<{ path: string; citation: string }> {
  const hits: Array<{ path: string; citation: string }> = [];
  for (const path of changedPaths) {
    for (const { pattern, citation } of FROZEN_PATHS) {
      if (pattern.test(path)) {
        hits.push({ path, citation });
        break;
      }
    }
  }
  return hits;
}

/** Pure: does the change set carry an amendment ADR reference? */
export function hasAmendmentReference(signals: AmendmentSignals): boolean {
  if (signals.changedPaths.some((p) => p.startsWith('docs/adr/'))) return true;
  if (signals.commitMessage && mentionsAmendmentAdr(signals.commitMessage)) return true;
  if (signals.prBody && mentionsAmendmentAdr(signals.prBody)) return true;
  return false;
}

export interface GateResult {
  ok: boolean;
  frozenChanges: Array<{ path: string; citation: string }>;
  reason: string;
}

/** Pure: full gate decision for a change set. */
export function evaluate(signals: AmendmentSignals): GateResult {
  const frozenChanges = findFrozenChanges(signals.changedPaths);
  if (frozenChanges.length === 0) {
    return { ok: true, frozenChanges, reason: 'no frozen-semantics paths changed' };
  }
  if (hasAmendmentReference(signals)) {
    return { ok: true, frozenChanges, reason: 'amendment ADR reference present' };
  }
  return {
    ok: false,
    frozenChanges,
    reason: 'frozen semantics changed without an amendment ADR reference (ADR-0122 Consequences)',
  };
}

export function failureMessage(result: GateResult): string {
  const lines = result.frozenChanges.map((h) => `  - ${h.path}  (${h.citation})`);
  return [
    'freeze:semantics:check FAILED — this change touches frozen semantics.',
    '',
    'Frozen paths changed:',
    ...lines,
    '',
    'Rule (ADR-0122 Consequences): a PR touching frozen semantics must',
    'reference an amendment ADR. To comply, do one of:',
    '  1. author/commit an amendment ADR under docs/adr/ in this change, or',
    '  2. cite the amendment ADR (an `ADR-NNNN` token whose number differs',
    '     from the frozen baselines ADR-0119/ADR-0122) in the commit message',
    '     or PR body.',
    'Citing a frozen baseline ADR alone is not an amendment reference.',
    'If this change does not alter the frozen semantics, the file is',
    'misclassified: extend the list header in tools/check-frozen-semantics.ts',
    'via an amendment ADR instead of weakening the gate.',
  ].join('\n');
}

async function runGit(args: string[]): Promise<string | null> {
  try {
    const out = await new Deno.Command('git', { args, stdout: 'piped', stderr: 'piped' })
      .output();
    if (!out.success) return null;
    return new TextDecoder().decode(out.stdout);
  } catch {
    return null;
  }
}

async function changedPathsFromGit(): Promise<string[]> {
  const baseRef = Deno.env.get('GITHUB_BASE_REF');
  const remoteRef = baseRef ? `origin/${baseRef}` : 'origin/main';
  let mergeBase = (await runGit(['merge-base', 'HEAD', remoteRef]))?.trim();
  if (!mergeBase && !baseRef) {
    // Fresh clone without origin/main: fall back to the local main branch.
    mergeBase = (await runGit(['merge-base', 'HEAD', 'main']))?.trim();
  }
  if (!mergeBase) throw new Error(`could not resolve merge-base against ${remoteRef}`);
  const diff = await runGit(['diff', '--name-only', mergeBase, 'HEAD']);
  if (diff === null) throw new Error('git diff failed');
  return diff.split('\n').map((l) => l.trim()).filter(Boolean);
}

async function prBody(): Promise<string | undefined> {
  const eventPath = Deno.env.get('GITHUB_EVENT_PATH');
  if (!eventPath) return undefined;
  try {
    const event = JSON.parse(await Deno.readTextFile(eventPath));
    return typeof event?.pull_request?.body === 'string' ? event.pull_request.body : undefined;
  } catch {
    return undefined;
  }
}

if (import.meta.main) {
  const changedPaths = await changedPathsFromGit();
  const commitMessage = (await runGit(['log', '-1', '--format=%B', 'HEAD'])) ?? undefined;
  const result = evaluate({
    changedPaths,
    commitMessage,
    prBody: await prBody(),
  });
  if (result.ok) {
    console.log(`freeze:semantics:check OK — ${result.reason}.`);
    if (result.frozenChanges.length > 0) {
      for (const h of result.frozenChanges) console.log(`  - ${h.path}  (${h.citation})`);
    }
  } else {
    console.error(failureMessage(result));
    Deno.exit(1);
  }
}
