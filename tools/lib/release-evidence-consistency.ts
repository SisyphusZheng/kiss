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
  // Two-phase flow: a local patch-release tagged the version and the CI
  // publish-existing closed it, so the tag snapshot carries the
  // patch-release record while the final record is publish-existing (0.41.2).
  const sameRun = input.tagEvidence.id === input.finalEvidence.id;
  const twoPhase = input.tagEvidence.kind === 'patch-release' &&
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
