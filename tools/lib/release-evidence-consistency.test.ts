import { assertEquals } from 'jsr:@std/assert@^1.0.0';
import { validateReleaseEvidenceClosure } from './release-evidence-consistency.ts';

Deno.test('release evidence closure accepts an immutable running tag snapshot finalized on main', () => {
  const failures = validateReleaseEvidenceClosure({
    version: '0.41.0-alpha.14',
    record: {
      tagCommit: 'tag-sha',
      finalEvidenceCommit: 'final-sha',
      successfulReleaseRun: 'https://github.com/example/actions/runs/1',
      releaseUrl: 'https://github.com/example/releases/tag/v0.41.0-alpha.14',
    },
    tagIsAncestorOfFinal: true,
    finalIsAncestorOfHead: true,
    tagEvidence: {
      id: 'release-id',
      targetVersion: '0.41.0-alpha.14',
      status: 'running',
      steps: [{ name: 'publish npm packages', status: 'passed' }],
    },
    finalEvidence: {
      id: 'release-id',
      targetVersion: '0.41.0-alpha.14',
      status: 'completed',
      completedAt: '2026-07-15T16:50:58.805Z',
      steps: [{ name: 'publish npm packages', status: 'passed' }],
    },
    releaseNote:
      'Final evidence: final-sha\nRun: https://github.com/example/actions/runs/1\nRelease: https://github.com/example/releases/tag/v0.41.0-alpha.14',
  });

  assertEquals(failures, []);
});

Deno.test('release evidence closure rejects mismatched ids and unfinished final steps', () => {
  const failures = validateReleaseEvidenceClosure({
    version: '0.41.0-alpha.14',
    record: {
      tagCommit: 'tag-sha',
      finalEvidenceCommit: 'final-sha',
      successfulReleaseRun: 'https://github.com/example/actions/runs/1',
      releaseUrl: 'https://github.com/example/releases/tag/v0.41.0-alpha.14',
    },
    tagIsAncestorOfFinal: true,
    finalIsAncestorOfHead: true,
    tagEvidence: {
      id: 'tag-id',
      targetVersion: '0.41.0-alpha.14',
      status: 'running',
      steps: [],
    },
    finalEvidence: {
      id: 'final-id',
      targetVersion: '0.41.0-alpha.14',
      status: 'completed',
      completedAt: '2026-07-15T16:50:58.805Z',
      steps: [{ name: 'create GitHub release', status: 'running' }],
    },
    releaseNote:
      'Final evidence: final-sha\nRun: https://github.com/example/actions/runs/1\nRelease: https://github.com/example/releases/tag/v0.41.0-alpha.14',
  });

  assertEquals(failures, [
    'tag and final evidence ids differ',
    'final evidence step is not passed: create GitHub release',
  ]);
});

Deno.test('release evidence closure requires durable final commit and workflow references', () => {
  const failures = validateReleaseEvidenceClosure({
    version: '0.41.0-alpha.14',
    record: {
      tagCommit: 'tag-sha',
      finalEvidenceCommit: 'final-sha',
      successfulReleaseRun: 'https://github.com/example/actions/runs/1',
      releaseUrl: 'https://github.com/example/releases/tag/v0.41.0-alpha.14',
    },
    tagIsAncestorOfFinal: false,
    finalIsAncestorOfHead: false,
    tagEvidence: {
      id: 'release-id',
      targetVersion: '0.41.0-alpha.14',
      status: 'running',
      steps: [],
    },
    finalEvidence: {
      id: 'release-id',
      targetVersion: '0.41.0-alpha.14',
      status: 'completed',
      completedAt: '2026-07-15T16:50:58.805Z',
      steps: [],
    },
    releaseNote: 'missing durable references',
  });

  assertEquals(failures, [
    'tag is not an ancestor of final evidence',
    'final evidence is not an ancestor of HEAD',
    'final evidence has no release steps',
    'release note does not reference the final evidence commit',
    'release note does not reference the successful release run',
    'release note does not reference the GitHub release',
  ]);
});

Deno.test('release evidence closure accepts the two-phase patch-release tag flow', () => {
  // 0.41.2: the local patch-release tagged the version (tag snapshot carries
  // the patch-release record), the CI publish-existing closed the release
  // with its own record. Different ids are valid across the two kinds.
  const failures = validateReleaseEvidenceClosure({
    version: '0.41.2',
    record: {
      tagCommit: 'tag-sha',
      finalEvidenceCommit: 'final-sha',
      successfulReleaseRun: 'https://github.com/example/actions/runs/2',
      releaseUrl: 'https://github.com/example/releases/tag/v0.41.2',
    },
    tagIsAncestorOfFinal: true,
    finalIsAncestorOfHead: true,
    tagEvidence: {
      id: 'patch-run-id',
      kind: 'patch-release',
      targetVersion: '0.41.2',
      status: 'running',
      steps: [{ name: 'tag release', status: 'passed' }],
    },
    finalEvidence: {
      id: 'publish-run-id',
      kind: 'publish-existing',
      targetVersion: '0.41.2',
      status: 'completed',
      completedAt: '2026-07-27T01:45:00.000Z',
      steps: [{ name: 'create GitHub release', status: 'passed' }],
    },
    releaseNote:
      'Final evidence: final-sha\nRun: https://github.com/example/actions/runs/2\nRelease: https://github.com/example/releases/tag/v0.41.2',
  });

  assertEquals(failures, []);
});
