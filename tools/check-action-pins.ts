/** Enforce immutable SHA pins for every actual third-party GitHub Action step. */

import { parse } from 'yaml';

import { walk } from './lib/fs.ts';

const WORKFLOW_ROOTS = ['.github/workflows', '.github/actions'];
const SHA_PATTERN = /@[0-9a-f]{40}$/i;

/**
 * Approved action releases. The version comment immediately preceding a use
 * step is intentionally checked with its SHA: Dependabot updates cannot leave
 * the human-readable audit trail stale.
 */
const ACTION_VERSION_PINS = new Map([
  ['actions/checkout@9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0', 'v7.0.0'],
  ['actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a', 'v7.0.1'],
  ['actions/setup-node@48b55a011bda9f5d6aeb4c2d9c7362e8dae4041e', 'v6.4.0'],
  [
    'actions/dependency-review-action@a1d282b36b6f3519aa1f3fc636f609c47dddb294',
    'v5.0.0',
  ],
]);

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
    for await (const file of walk(root, { extensions: /\.ya?ml$/ })) {
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
