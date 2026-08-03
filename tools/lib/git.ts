/**
 * Shared git helpers for openElement tooling.
 */

import { normalizeSlashes } from './path.ts';

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
