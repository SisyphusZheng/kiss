import { assert } from '@std/assert';

// Integration test for the release state machine replay (1.2, #855).
// Runs against the real repo: 0.41.0-alpha.15 is an immutable published
// version whose history is record(running) -> finalize(completed) with a
// degraded event (#460) in the release note.

function runScript(args: string[]): { code: number; stdout: string } {
  const script = new URL('./check-release-state-machine.ts', import.meta.url).pathname;
  const result = new Deno.Command(Deno.execPath(), {
    args: ['run', '--allow-read', '--allow-run', script, ...args],
    stdout: 'piped',
    stderr: 'piped',
  }).outputSync();
  return {
    code: result.code,
    stdout: new TextDecoder().decode(result.stdout),
  };
}

Deno.test('release state machine: replays the published alpha.15 chain', () => {
  const run = runScript(['--to', '0.41.0-alpha.15']);
  assert(run.code === 0, run.stdout);
  assert(run.stdout.includes('publish-existing/running'));
  assert(run.stdout.includes('publish-existing/completed'));
  assert(run.stdout.includes('tracked by #460'));
});

Deno.test('release state machine: rejects an unpublished version', () => {
  const run = runScript(['--to', '0.99.0-alpha.99']);
  assert(run.code !== 0);
});

Deno.test('release state machine: a failed unpublished attempt leaves the line in flight', async () => {
  // The current line carries a failed publish attempt but no shipped tag:
  // nothing was published, so the retry is the recovery and the gate must
  // replay the previous completed line instead of deadlocking the release.
  const { PACKAGE_VERSION_TAG, PREVIOUS_PACKAGE_VERSION } = await import(
    './project-constants.ts'
  );
  const current = PACKAGE_VERSION_TAG.replace(/^v/u, '');
  const root = await Deno.makeTempDir({ prefix: 'state-machine-inflight-' });
  const work = `${root}/work`;
  await Deno.mkdir(work, { recursive: true });
  try {
    const git = (args: string[]): void => {
      const result = new Deno.Command('git', { args, cwd: work, stdout: 'piped' }).outputSync();
      if (result.code !== 0) throw new Error(`git ${args.join(' ')} failed`);
    };
    git(['init', '-b', 'dev', '.']);
    git(['config', 'user.email', 'release-test@example.com']);
    git(['config', 'user.name', 'Release Test']);
    await Deno.mkdir(`${work}/docs/release/autoflow3`, { recursive: true });
    // Previous line: completed.
    await Deno.writeTextFile(
      `${work}/docs/release/autoflow3/v${PREVIOUS_PACKAGE_VERSION}.json`,
      JSON.stringify({ kind: 'publish-existing', status: 'completed' }),
    );
    await Deno.writeTextFile(
      `${work}/docs/release/v${PREVIOUS_PACKAGE_VERSION}.md`,
      `# v${PREVIOUS_PACKAGE_VERSION}\n`,
    );
    git(['add', '.']);
    git(['commit', '-m', `docs(release): record v${PREVIOUS_PACKAGE_VERSION} evidence`]);
    // Current line: failed attempt, note present, no tag.
    await Deno.writeTextFile(
      `${work}/docs/release/autoflow3/v${current}.json`,
      JSON.stringify({ kind: 'publish-existing', status: 'failed' }),
    );
    await Deno.writeTextFile(`${work}/docs/release/v${current}.md`, `# v${current}\n`);
    git(['add', '.']);
    git(['commit', '-m', `docs(release): record failed v${current} evidence`]);

    const previousCwd = Deno.cwd();
    Deno.chdir(work);
    try {
      const run = new Deno.Command(Deno.execPath(), {
        args: [
          'run',
          '--allow-read',
          '--allow-run',
          new URL('./check-release-state-machine.ts', import.meta.url).pathname,
        ],
        stdout: 'piped',
        stderr: 'piped',
      }).outputSync();
      const stdout = new TextDecoder().decode(run.stdout);
      assert(run.code === 0, stdout);
      assert(stdout.includes('in flight'), stdout);
    } finally {
      Deno.chdir(previousCwd);
    }
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('release state machine: rejects a version whose history ends without completion', async () => {
  // A record-only chain (running, never finalized) must fail the replay.
  const root = await Deno.makeTempDir({ prefix: 'state-machine-' });
  const work = `${root}/work`;
  await Deno.mkdir(work, { recursive: true });
  try {
    const git = (args: string[]): void => {
      const result = new Deno.Command('git', { args, cwd: work, stdout: 'piped' }).outputSync();
      if (result.code !== 0) throw new Error(`git ${args.join(' ')} failed`);
    };
    git(['init', '-b', 'dev', '.']);
    git(['config', 'user.email', 'release-test@example.com']);
    git(['config', 'user.name', 'Release Test']);
    await Deno.mkdir(`${work}/docs/release/autoflow3`, { recursive: true });
    const evidence = JSON.stringify({
      kind: 'publish-existing',
      status: 'running',
    });
    await Deno.writeTextFile(
      `${work}/docs/release/autoflow3/v0.99.0-alpha.99.json`,
      evidence,
    );
    git(['add', 'docs/release/autoflow3/v0.99.0-alpha.99.json']);
    git(['commit', '-m', 'docs(release): record v0.99.0-alpha.99 evidence']);
    await Deno.writeTextFile(`${work}/docs/release/v0.99.0-alpha.99.md`, '# v0.99.0-alpha.99\n');
    git(['add', '.']);
    git(['commit', '-m', 'docs(release): note for v0.99.0-alpha.99']);

    const previousCwd = Deno.cwd();
    Deno.chdir(work);
    try {
      const run = new Deno.Command(Deno.execPath(), {
        args: [
          'run',
          '--allow-read',
          '--allow-run',
          new URL('./check-release-state-machine.ts', import.meta.url).pathname,
          '--to',
          '0.99.0-alpha.99',
        ],
        stdout: 'piped',
      }).outputSync();
      assert(run.code !== 0);
    } finally {
      Deno.chdir(previousCwd);
    }
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
