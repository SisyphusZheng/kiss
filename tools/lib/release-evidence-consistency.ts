export interface ReleaseClosureRecord {
  tagCommit: string;
  finalEvidenceCommit: string;
  successfulReleaseRun: string;
  releaseUrl: string;
}

export interface ReleaseEvidenceSnapshot {
  id: string;
  kind?: string;
  targetVersion: string;
  status: string;
  completedAt?: string;
  steps: Array<{ name: string; status: string }>;
}

export interface ReleaseEvidenceClosureInput {
  version: string;
  record: ReleaseClosureRecord;
  tagIsAncestorOfFinal: boolean;
  finalIsAncestorOfHead: boolean;
  tagEvidence: ReleaseEvidenceSnapshot;
  finalEvidence: ReleaseEvidenceSnapshot;
  releaseNote: string;
}

export function validateReleaseEvidenceClosure(input: ReleaseEvidenceClosureInput): string[] {
  const failures: string[] = [];
  // Same-run flow: the tag snapshot and the final record share one run id.
  // Two-phase flow: an earlier run tagged the version and a later CI
  // publish-existing run closed it, so the tag snapshot carries the tagging
  // record while the final record is publish-existing. Seen as
  // `patch-release` -> `publish-existing` (0.41.2) and
  // `release` (PR-merge tag) -> `publish-existing` (0.42.0-alpha.9, #647).
  const sameRun = input.tagEvidence.id === input.finalEvidence.id;
  const twoPhase =
    (input.tagEvidence.kind === 'patch-release' || input.tagEvidence.kind === 'release') &&
    input.finalEvidence.kind === 'publish-existing';
  if (!sameRun && !twoPhase) {
    failures.push('tag and final evidence ids differ');
  }
  if (
    input.tagEvidence.targetVersion !== input.version ||
    input.finalEvidence.targetVersion !== input.version
  ) {
    failures.push(`evidence target version must be ${input.version}`);
  }
  if (!input.tagIsAncestorOfFinal) failures.push('tag is not an ancestor of final evidence');
  if (!input.finalIsAncestorOfHead) failures.push('final evidence is not an ancestor of HEAD');
  if (!['running', 'completed'].includes(input.tagEvidence.status)) {
    failures.push('tag evidence must be a running snapshot or completed evidence');
  }
  if (input.finalEvidence.status !== 'completed' || !input.finalEvidence.completedAt) {
    failures.push('final evidence must be completed with completedAt');
  }
  if (input.finalEvidence.steps.length === 0) failures.push('final evidence has no release steps');
  const failedStep = input.finalEvidence.steps.find((step) => step.status !== 'passed');
  if (failedStep) failures.push(`final evidence step is not passed: ${failedStep.name}`);
  // A prerelease published to npm must prove the publish happened. A `release` /
  // `approved-release` snapshot used as the durable record for an npm-published
  // prerelease without any npm-publish / verification step is exactly the
  // α8-style version hole (audit 2026-07-30, #647): the tag + GitHub release
  // exist but the registry is empty. `publish-existing` is exempt — its kind
  // asserts the publish; `patch-release` is the two-phase tag phase whose final
  // evidence is the publish-existing run instead.
  const isPrerelease = /-(alpha|beta|rc)\b/i.test(input.version);
  const kind = input.finalEvidence.kind;
  const isReleasePath = kind === 'release' || kind === 'approved-release';
  const recordsNpmPublish = input.finalEvidence.steps.some((step) =>
    /publish npm|verify npm|npm (consumer|third-party)|npm versions|dist-tag/i.test(step.name),
  );
  if (isPrerelease && isReleasePath && !recordsNpmPublish) {
    failures.push(
      'prerelease release evidence must record an npm publish/verification step (version-hole risk)',
    );
  }
  if (!input.releaseNote.includes(input.record.finalEvidenceCommit)) {
    failures.push('release note does not reference the final evidence commit');
  }
  if (!input.releaseNote.includes(input.record.successfulReleaseRun)) {
    failures.push('release note does not reference the successful release run');
  }
  if (!input.releaseNote.includes(input.record.releaseUrl)) {
    failures.push('release note does not reference the GitHub release');
  }
  return failures;
}
