import { assert, assertEquals, assertRejects } from 'jsr:@std/assert@^1.0.0';
import {
  createReleaseEvidence,
  executeReleasePlan,
  extractManualNoteSections,
  readPriorReleaseEvidence,
  type ReleaseCommandStep,
  type ReleaseEvidence,
  writeReleaseEvidence,
  writeReleaseNote,
} from '../release.ts';

async function git(cwd: string, args: string[]): Promise<string> {
  const output = await new Deno.Command('git', {
    args,
    cwd,
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  if (output.code !== 0) {
    throw new Error(
      `git ${args.join(' ')} failed (${output.code}): ${new TextDecoder().decode(output.stderr)}`,
    );
  }
  return new TextDecoder().decode(output.stdout).trim();
}

/** A plain work repo on dev with a single seed commit (no origin). */
async function initWorkRepo(): Promise<{ root: string; work: string }> {
  const root = await Deno.makeTempDir({ prefix: 'release-executor-orchestration-' });
  const work = `${root}/work`;
  await git(root, ['init', '-b', 'dev', work]);
  await git(work, ['config', 'user.email', 'release-test@example.com']);
  await git(work, ['config', 'user.name', 'Release Test']);
  await Deno.writeTextFile(`${work}/seed.txt`, 'seed\n');
  await git(work, ['add', 'seed.txt']);
  await git(work, ['commit', '-m', 'seed']);
  return { root, work };
}

function priorEvidence(target: string, steps: ReleaseEvidence['steps']): ReleaseEvidence {
  return {
    id: `patch-release-v${target}-test-run`,
    kind: 'patch-release',
    policyVersion: 'autoflow3-v0',
    currentVersion: '9.9.8',
    targetVersion: target,
    status: 'failed',
    startedAt: '2026-01-01T00:00:00.000Z',
    completedAt: '2026-01-01T00:10:00.000Z',
    steps,
  };
}

Deno.test('readPriorReleaseEvidence: corrupt evidence JSON is rejected loudly', async () => {
  const root = await Deno.makeTempDir({ prefix: 'release-evidence-corrupt-' });
  const previousCwd = Deno.cwd();
  try {
    Deno.chdir(root);
    await Deno.mkdir('docs/release/autoflow3', { recursive: true });
    await Deno.writeTextFile('docs/release/autoflow3/v9.9.9.json', '{ not json');
    const error = await assertRejects(
      () => readPriorReleaseEvidence('patch-release', '9.9.9'),
      Error,
      'is not readable JSON',
    );
    assert(error.message.includes('docs/release/autoflow3/v9.9.9.json'));
  } finally {
    Deno.chdir(previousCwd);
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('readPriorReleaseEvidence: missing file and mismatched record start fresh', async () => {
  const root = await Deno.makeTempDir({ prefix: 'release-evidence-missing-' });
  const previousCwd = Deno.cwd();
  try {
    Deno.chdir(root);
    assertEquals(await readPriorReleaseEvidence('patch-release', '9.9.9'), undefined);
    await Deno.mkdir('docs/release/autoflow3', { recursive: true });
    await Deno.writeTextFile(
      'docs/release/autoflow3/v9.9.9.json',
      JSON.stringify(priorEvidence('9.9.9', [])),
    );
    // A different kind must not be resumed as a patch-release.
    assertEquals(await readPriorReleaseEvidence('approved-release', '9.9.9'), undefined);
  } finally {
    Deno.chdir(previousCwd);
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('executeReleasePlan: a resume skips passed steps and persists completion', async () => {
  const { root, work } = await initWorkRepo();
  const previousCwd = Deno.cwd();
  try {
    Deno.chdir(work);
    const executed: string[] = [];
    const plan: ReleaseCommandStep[] = [
      {
        name: 'step one',
        run: () => {
          executed.push('one');
          return Promise.resolve();
        },
      },
      {
        name: 'step two',
        run: () => {
          executed.push('two');
          return Promise.resolve();
        },
      },
    ];
    await writeReleaseEvidence(
      priorEvidence('9.9.9', [
        { name: 'step one', status: 'passed', startedAt: 's1', completedAt: 'e1', exitCode: 0 },
        { name: 'step two', status: 'failed', startedAt: 's2', completedAt: 'e2', exitCode: 1 },
      ]),
    );
    // Commit the prior evidence: a real resume starts from a clean worktree.
    await git(work, ['add', 'docs']);
    await git(work, ['commit', '-m', 'prior evidence']);

    // The finalize push has no origin to reach; finalize downgrades that to a
    // warning, so the run itself completes.
    await executeReleasePlan('patch-release', '9.9.9', undefined, false, plan, 'dev');

    assertEquals(executed, ['two']);
    const persisted = JSON.parse(
      await Deno.readTextFile('docs/release/autoflow3/v9.9.9.json'),
    ) as ReleaseEvidence;
    assertEquals(persisted.status, 'completed');
    assertEquals(persisted.steps.map((step) => step.status), ['passed', 'passed']);
  } finally {
    Deno.chdir(previousCwd);
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('executeReleasePlan: a failed finalize checkout does not flip a completed release', async () => {
  const { root, work } = await initWorkRepo();
  const previousCwd = Deno.cwd();
  try {
    Deno.chdir(work);
    // Fully passed plan whose last checkout target (main) does not exist in
    // this repo: the finalize checkout fails and must only warn.
    const plan: ReleaseCommandStep[] = [
      { name: 'checkout main', command: ['git', 'checkout', 'main'] },
      { name: 'tag release' },
    ];
    await writeReleaseEvidence(
      priorEvidence('9.9.9', [
        { name: 'checkout main', status: 'passed' },
        { name: 'tag release', status: 'passed' },
      ]),
    );
    // Commit the prior evidence: a real resume starts from a clean worktree.
    await git(work, ['add', 'docs']);
    await git(work, ['commit', '-m', 'prior evidence']);

    await executeReleasePlan('patch-release', '9.9.9', undefined, false, plan, 'dev');

    const persisted = JSON.parse(
      await Deno.readTextFile('docs/release/autoflow3/v9.9.9.json'),
    ) as ReleaseEvidence;
    assertEquals(persisted.status, 'completed');
    assertEquals(await git(work, ['rev-parse', '--abbrev-ref', 'HEAD']), 'dev');
  } finally {
    Deno.chdir(previousCwd);
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('writeReleaseNote: curated sections before the evidence header survive rewrites', async () => {
  const root = await Deno.makeTempDir({ prefix: 'release-note-manual-' });
  const previousCwd = Deno.cwd();
  try {
    Deno.chdir(root);
    await Deno.mkdir('docs/release', { recursive: true });
    const evidence = createReleaseEvidence('patch-release', '9.9.8', '9.9.9');
    await writeReleaseNote(evidence);

    // An operator adds a curated migration section between the title and the
    // evidence header.
    const path = 'docs/release/v9.9.9.md';
    const seeded = (await Deno.readTextFile(path)).replace(
      'AutoFlow3 patch release evidence:',
      '## Breaking changes and migration\n\n- `unwrap` was removed; migrate to X.\n\n' +
        'AutoFlow3 patch release evidence:',
    );
    await Deno.writeTextFile(path, seeded);

    // A re-run rewrites the note (status flips to completed).
    evidence.status = 'completed';
    evidence.completedAt = new Date().toISOString();
    await writeReleaseNote(evidence);

    const rewritten = await Deno.readTextFile(path);
    assert(rewritten.includes('## Breaking changes and migration'));
    assert(rewritten.includes('- `unwrap` was removed; migrate to X.'));
    assert(rewritten.includes('- Status: `completed`'));
    assertEquals(rewritten.match(/AutoFlow3 patch release evidence:/g)?.length, 1);
  } finally {
    Deno.chdir(previousCwd);
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('extractManualNoteSections: only the block before the evidence header is kept', () => {
  const note = [
    '# v9.9.9',
    '',
    '## Breaking changes and migration',
    '',
    '- curated line',
    '',
    'AutoFlow3 patch release evidence: `id`.',
    '',
    '- Status: `completed`',
    '',
    '## Evidence',
    '',
  ].join('\n');
  const manual = extractManualNoteSections(note);
  assert(manual.includes('## Breaking changes and migration'));
  assert(manual.includes('- curated line'));
  assert(!manual.includes('AutoFlow3 patch release evidence'));
  assertEquals(
    extractManualNoteSections('# v9.9.9\n\nAutoFlow3 patch release evidence: `id`.'),
    '',
  );
});
