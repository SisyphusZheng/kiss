/** Enforce immutable SHA pins for every actual third-party GitHub Action step. */

import { parse } from 'yaml';

import { walk } from '@std/fs/walk';

const WORKFLOW_ROOTS = ['.github/workflows', '.github/actions'];
const SHA_PATTERN = /@[0-9a-f]{40}$/i;

/**
 * Approved action releases. The version comment immediately preceding a use
 * step is intentionally checked with its SHA: Dependabot updates cannot leave
 * the human-readable audit trail stale.
 */
const ACTION_VERSION_PINS = new Map([
  ['actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1', 'v7.0.1'],
  ['actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a', 'v7.0.1'],
  ['actions/setup-node@820762786026740c76f36085b0efc47a31fe5020', 'v7.0.0'],
  ['actions/cache@0057852bfaa89a56745cba8c7296529d2fc39830', 'v4.3.0'],
  [
    'actions/dependency-review-action@a1d282b36b6f3519aa1f3fc636f609c47dddb294',
    'v5.0.0',
  ],
  ['github/codeql-action/init@5595ccaf912efad79be6eef63a5619ff05969be3', 'v4.37.6'],
  ['github/codeql-action/analyze@5595ccaf912efad79be6eef63a5619ff05969be3', 'v4.37.6'],
]);

// Repos that carry an approved pin above. A full-SHA use of one of these repos
// that is missing from the map is an unvetted bump (e.g. Dependabot) that
// would otherwise silently skip the version-comment audit (#1065). Repos with
// no registered pin keep the old behavior: SHA-shape check only.
const PINNED_REPOS = new Set(
  [...ACTION_VERSION_PINS.keys()].map((action) => action.slice(0, action.indexOf('@'))),
);

export interface WorkflowInspection {
  failures: string[];
  hasDependencyReview: boolean;
}

function collectUses(value: unknown, uses: string[]): void {
  if (Array.isArray(value)) {
    for (const item of value) collectUses(item, uses);
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (key === 'uses' && typeof item === 'string') uses.push(item);
    else collectUses(item, uses);
  }
}

function collectVersionCommentFailures(file: string, source: string): string[] {
  const failures: string[] = [];
  const lines = source.split(/\r?\n/);
  for (let index = 0; index < lines.length; index++) {
    const action = lines[index].match(/\buses:\s*([^\s#]+)/)?.[1];
    if (!action) continue;
    const expectedVersion = ACTION_VERSION_PINS.get(action);
    if (!expectedVersion) continue;
    const previousLine = lines[index - 1]?.trim();
    if (previousLine !== `# ${expectedVersion}`) {
      failures.push(
        `${file}:${index + 1}: ${action} must be immediately preceded by # ${expectedVersion}`,
      );
    }
  }
  return failures;
}

export function inspectWorkflowSource(file: string, source: string): WorkflowInspection {
  const uses: string[] = [];
  collectUses(parse(source), uses);
  const failures: string[] = [];
  for (const action of uses) {
    if (action.startsWith('./') || action.startsWith('docker://')) continue;
    if (!SHA_PATTERN.test(action)) {
      failures.push(`${file}: ${action} is not pinned to a full commit SHA`);
      continue;
    }
    const repo = action.slice(0, action.indexOf('@'));
    if (PINNED_REPOS.has(repo) && !ACTION_VERSION_PINS.has(action)) {
      failures.push(
        `${file}: ${action} is not an approved pin for ${repo} — register the SHA in ACTION_VERSION_PINS with its release version`,
      );
    }
  }
  failures.push(...collectVersionCommentFailures(file, source));
  return {
    failures,
    hasDependencyReview: uses.some((action) =>
      action.startsWith('actions/dependency-review-action@')
    ),
  };
}

async function main(): Promise<void> {
  const failures: string[] = [];
  let hasDependencyReview = false;
  for (const root of WORKFLOW_ROOTS) {
    for await (const entry of walk(root, { includeDirs: false, match: [/\.ya?ml$/] })) {
      const file = entry.path;
      const result = inspectWorkflowSource(file, await Deno.readTextFile(file));
      failures.push(...result.failures);
      if (file === '.github/workflows/autoflow-ci.yml') {
        hasDependencyReview = result.hasDependencyReview;
      }
    }
  }
  if (!hasDependencyReview) {
    failures.push('autoflow-ci.yml must run dependency-review-action for pull requests');
  }
  if (failures.length > 0) {
    console.error('Action pin check failed:');
    for (const failure of failures) console.error(`- ${failure}`);
    Deno.exit(1);
  }
  console.log('Action pin check passed.');
}

if (import.meta.main) await main();
