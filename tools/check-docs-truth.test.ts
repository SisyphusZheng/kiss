import { assert, assertEquals } from '@std/assert';
import { isInEvidenceWindow } from './check-docs-truth.ts';
import { PACKAGE_VERSION, PACKAGE_VERSION_TAG } from './project-constants.ts';

Deno.test('docs-truth evidence window: prerelease ordering is semver, not lexicographic', () => {
  // Lexicographic order ranks '0.41.0-alpha.2' above '0.41.0-alpha.14'; the
  // window must exclude every release before the first tagged one.
  assertEquals(isInEvidenceWindow('0.41.0-alpha.2'), false);
  assertEquals(isInEvidenceWindow('0.41.0-alpha.13'), false);
  assertEquals(isInEvidenceWindow('0.41.0-alpha.14'), true);
  assertEquals(isInEvidenceWindow('0.42.0-alpha.1'), true);
  assertEquals(isInEvidenceWindow('0.40.9'), false);
});

const CHECK_SCRIPT = new URL('./check-docs-truth.ts', import.meta.url);

async function git(root: string, args: string[]): Promise<string> {
  const result = await new Deno.Command('git', {
    args,
    cwd: root,
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  if (!result.success) {
    throw new Error(`git ${args.join(' ')} failed: ${new TextDecoder().decode(result.stderr)}`);
  }
  return new TextDecoder().decode(result.stdout).trim();
}

// Drives the evidence gate as a subprocess against a minimal git fixture: the
// closure record exists but the release note does not, so the gate must fail
// closed instead of silently skipping the note checks.
Deno.test('docs-truth evidence: missing release note fails the gate', async () => {
  const root = await Deno.makeTempDir();
  try {
    await Deno.mkdir(`${root}/docs/release/autoflow3`, { recursive: true });
    await git(root, ['init', '-q']);
    await git(root, ['config', 'user.email', 'test@example.com']);
    await git(root, ['config', 'user.name', 'test']);
    const evidencePath = `${root}/docs/release/autoflow3/${PACKAGE_VERSION_TAG}.json`;
    const tagEvidence = {
      id: 'run-1',
      kind: 'release',
      targetVersion: PACKAGE_VERSION,
      status: 'running',
      steps: [],
    };
    await Deno.writeTextFile(evidencePath, JSON.stringify(tagEvidence));
    await git(root, ['add', '-A']);
    await git(root, ['commit', '-q', '-m', 'tag evidence']);
    await git(root, ['tag', PACKAGE_VERSION_TAG]);
    const tagCommit = await git(root, ['rev-parse', PACKAGE_VERSION_TAG]);
    const finalEvidence = {
      id: 'run-1',
      kind: 'publish-existing',
      targetVersion: PACKAGE_VERSION,
      status: 'completed',
      completedAt: '2026-08-20T00:00:00.000Z',
      steps: [{ name: 'publish npm', status: 'passed' }],
    };
    await Deno.writeTextFile(evidencePath, JSON.stringify(finalEvidence));
    await git(root, ['add', '-A']);
    await git(root, ['commit', '-q', '-m', 'final evidence']);
    const finalEvidenceCommit = await git(root, ['rev-parse', 'HEAD']);
    await Deno.writeTextFile(
      `${root}/docs/release/${PACKAGE_VERSION_TAG}-closure.json`,
      JSON.stringify({
        tagCommit,
        finalEvidenceCommit,
        successfulReleaseRun: 'https://example.test/run/1',
        releaseUrl: 'https://example.test/release',
      }),
    );
    const result = await new Deno.Command(Deno.execPath(), {
      args: ['run', '--allow-read', '--allow-run=git', CHECK_SCRIPT.pathname, '--check=evidence'],
      cwd: root,
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    const stderr = new TextDecoder().decode(result.stderr);
    assertEquals(result.code, 1);
    assert(stderr.includes('missing its release note'), stderr);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
