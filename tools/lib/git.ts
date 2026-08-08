/**
 * Shared git helpers for openElement tooling.
 */

import { normalizeSlashes } from './path.ts';
import { runCaptured } from './process.ts';

async function gitLsFiles(extraArgs: string[] = []): Promise<string[]> {
  const command = new Deno.Command('git', {
    args: ['-c', 'core.quotepath=false', 'ls-files', '-z', ...extraArgs],
    stdout: 'piped',
    stderr: 'piped',
  });
  const output = await command.output();
  if (!output.success) {
    throw new Error(new TextDecoder().decode(output.stderr).trim() || 'git ls-files failed');
  }
  return new TextDecoder()
    .decode(output.stdout)
    .split('\0')
    .filter(Boolean)
    .map(normalizeSlashes);
}

/** Return all tracked files. */
export function gitTrackedFiles(): Promise<string[]> {
  return gitLsFiles();
}

/** Return untracked files excluding ignored paths. */
export function gitUntrackedFiles(): Promise<string[]> {
  return gitLsFiles(['--others', '--exclude-standard']);
}

/** Return tracked files that are also ignored by .gitignore. */
export function gitTrackedIgnoredFiles(): Promise<string[]> {
  return gitLsFiles(['-ci', '--exclude-standard']);
}

/** Return true if `path` is tracked by git. */
export async function gitIsTracked(path: string): Promise<boolean> {
  const command = new Deno.Command('git', {
    args: ['ls-files', '--error-unmatch', '--', path],
    stdout: 'null',
    stderr: 'null',
  });
  return (await command.output()).success;
}

/** Run git capturing stdout; throws with stderr on failure. */
export async function runGit(args: string[]): Promise<string> {
  const result = await new Deno.Command('git', {
    args,
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  if (!result.success) {
    throw new Error(new TextDecoder().decode(result.stderr).trim());
  }
  return new TextDecoder().decode(result.stdout).trim();
}

/** True if the tag exists locally. */
export async function gitTagExists(tag: string): Promise<boolean> {
  const result = await new Deno.Command('git', {
    args: ['rev-parse', '--verify', '--quiet', `refs/tags/${tag}`],
    stdout: 'null',
    stderr: 'null',
  }).output();
  return result.success;
}

/** True if `ancestor` is an ancestor of (or equal to) `descendant`. */
export async function isAncestorCommit(ancestor: string, descendant: string): Promise<boolean> {
  const result = await new Deno.Command('git', {
    args: ['merge-base', '--is-ancestor', ancestor, descendant],
    stdout: 'null',
    stderr: 'null',
  }).output();
  return result.success;
}

export async function hasStagedChanges(): Promise<boolean> {
  const status = await new Deno.Command('git', {
    args: ['diff', '--cached', '--quiet'],
  }).spawn().status;
  if (status.code === 0) return false;
  if (status.code === 1) return true;
  throw new Error(`git diff --cached --quiet failed with exit ${status.code}`);
}

/**
 * Commit only when the staged tree differs from HEAD. A re-run whose earlier
 * attempt already created the commit stages nothing; an empty `git commit`
 * exits 1 and would block the resume.
 */
export async function commitIfStaged(message: string): Promise<void> {
  if (!(await hasStagedChanges())) {
    console.log('Nothing staged; skipping commit (already committed or unchanged).');
    return;
  }
  await runCaptured(['git', 'commit', '-m', message]);
}

/**
 * Amend the HEAD commit only when the staged tree differs from it. Used to
 * fold the prepare record into the bump commit (4→2, #869); a re-run whose
 * record already landed stages nothing and must not rewrite history.
 */
export async function amendIfStaged(): Promise<void> {
  if (!(await hasStagedChanges())) {
    console.log('Nothing staged; skipping amend (prepare record already in HEAD).');
    return;
  }
  await runCaptured(['git', 'commit', '--amend', '--no-edit']);
}

/** Whether HEAD's tree already carries the given path (resume idempotency). */
export async function pathExistsInHead(path: string): Promise<boolean> {
  const result = await new Deno.Command('git', {
    args: ['cat-file', '-e', `HEAD:${path}`],
    stdout: 'null',
    stderr: 'null',
  }).output();
  return result.success;
}

/** Branch the worktree is on, with a sane fallback for detached CI checkouts. */
export async function currentBranchName(fallback: string): Promise<string> {
  const branch = (await runCaptured(['git', 'rev-parse', '--abbrev-ref', 'HEAD'])).trim();
  // A release plan checks out branches explicitly when it switches, so a
  // detached HEAD means the plan never switched: the expected branch applies.
  return branch === 'HEAD' ? fallback : branch;
}
