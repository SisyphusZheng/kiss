/** Enforce immutable SHA pins for every actual third-party GitHub Action step. */

import { parse } from 'yaml';

const WORKFLOW_ROOTS = ['.github/workflows', '.github/actions'];
const SHA_PATTERN = /@[0-9a-f]{40}$/i;

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
  return {
    failures,
    hasDependencyReview: uses.some((action) =>
      action.startsWith('actions/dependency-review-action@')
    ),
  };
}

async function walk(directory: string): Promise<string[]> {
  const files: string[] = [];
  for await (const entry of Deno.readDir(directory)) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory) files.push(...await walk(path));
    else if (entry.isFile && /\.ya?ml$/.test(entry.name)) files.push(path);
  }
  return files;
}

async function main(): Promise<void> {
  const failures: string[] = [];
  let hasDependencyReview = false;
  for (const root of WORKFLOW_ROOTS) {
    for (const file of await walk(root)) {
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
