/**
 * Evidence-record machinery for the release flow: the ReleaseEvidence record
 * shape, the file paths under docs/release/ it persists to (autoflow3 JSON
 * records, the release note, the closure record), and the read/write helpers
 * that keep those records durable across resume attempts. Extracted from
 * release.ts as a pure move; the plan builder and executor stay in release.ts
 * and import the record IO from here, mirroring the version-anchors.ts split.
 */

import { PACKAGE_VERSION, PREVIOUS_PACKAGE_VERSION } from '../project-constants.ts';
import { formatJson } from '@openelement/element/build-utils';
import type { ReleaseClosureRecord } from '../lib/release-evidence-consistency.ts';
import { releaseTag } from './version-anchors.ts';

export type { ReleaseClosureRecord };

export interface ReleaseStepEvidence {
  name: string;
  command?: string[];
  cwd?: string;
  status: 'pending' | 'passed' | 'failed' | 'skipped';
  startedAt?: string;
  completedAt?: string;
  exitCode?: number;
}

export interface ReleaseEvidence {
  id: string;
  kind: 'patch-release' | 'approved-release' | 'release-prepare' | 'publish-existing';
  policyVersion: string;
  currentVersion: string;
  targetVersion: string;
  status: 'planned' | 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  approvalId?: string;
  /**
   * Successful CI run that gates this release. Set by the
   * 'verify main CI success for HEAD' step on the local publish-existing
   * path; CI releases use GITHUB_RUN_ID instead (see currentWorkflowRunUrl).
   */
  releaseRunUrl?: string;
  steps: ReleaseStepEvidence[];
}

/**
 * The package line a release replaces. publish-existing runs after the bump
 * is already merged, so PACKAGE_VERSION equals the target; the true previous
 * line is the bump-maintained PREVIOUS_PACKAGE_VERSION.
 */
export function evidenceCurrentVersion(kind: ReleaseEvidence['kind']): string {
  return kind === 'publish-existing' ? PREVIOUS_PACKAGE_VERSION : PACKAGE_VERSION;
}

/**
 * Read a JSON evidence file. A missing file means no prior attempt (returns
 * undefined); a corrupt file is rejected loudly — silently discarding it
 * would let a stale or hand-edited record be overwritten without notice.
 */
async function readJsonOrUndefined<T>(path: string, label: string): Promise<T | undefined> {
  let text: string;
  try {
    text = await Deno.readTextFile(path);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return undefined;
    throw error;
  }
  try {
    return JSON.parse(text) as T;
  } catch (error) {
    throw new Error(
      `${label} ${path} is not readable JSON; repair or remove it before ` +
        `re-running: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Read the evidence record for a version regardless of release kind, so the
 * patch-release entrypoint can detect an in-flight release before deriving
 * its target. Missing file means no prior attempt; a corrupt file is
 * rejected loudly, matching readPriorReleaseEvidence's trust model.
 */
export async function readReleaseEvidenceForVersion(
  version: string,
): Promise<ReleaseEvidence | undefined> {
  return await readJsonOrUndefined(evidenceFile(version), 'Release evidence');
}

export function evidenceFile(version: string): string {
  return `docs/release/autoflow3/${releaseTag(version)}.json`;
}

/**
 * Durable record left by the release-prepare phase (#684). Kept apart from
 * evidenceFile: publish-existing overwrites <tag>.json with its own evidence
 * on every attempt, so the prepare proof must live in a file the publish phase
 * never writes, or a resume could no longer re-verify it.
 */
export function prepareRecordFile(version: string): string {
  return `docs/release/autoflow3/${releaseTag(version)}-prepare.json`;
}

export function releaseNoteFile(version: string): string {
  return `docs/release/${releaseTag(version)}.md`;
}

export function closureFile(version: string): string {
  return `docs/release/${releaseTag(version)}-closure.json`;
}

/** Durable closure section appended to the release note at finalize time. */
export function renderClosureSection(record: ReleaseClosureRecord): string {
  return [
    '## Durable closure',
    '',
    `- Immutable tag commit: \`${record.tagCommit}\``,
    `- Final completed evidence commit: \`${record.finalEvidenceCommit}\``,
    `- Successful release run: ${record.successfulReleaseRun}`,
    `- GitHub release: ${record.releaseUrl}`,
    '',
  ].join('\n');
}

const CLOSURE_SECTION_MARKER = '## Durable closure';

/** Insert or replace the Durable closure section of a release note (idempotent). */
export function mergeClosureSection(noteText: string, record: ReleaseClosureRecord): string {
  const markerIndex = noteText.indexOf(CLOSURE_SECTION_MARKER);
  const base = markerIndex === -1 ? noteText : noteText.slice(0, markerIndex);
  return `${base.trimEnd()}\n\n${renderClosureSection(record)}`;
}

/** Write the closure record JSON and fold its section into the release note. */
export async function writeReleaseClosure(
  version: string,
  record: ReleaseClosureRecord,
): Promise<void> {
  await Deno.writeTextFile(closureFile(version), formatJson(record));
  const notePath = releaseNoteFile(version);
  const note = await Deno.readTextFile(notePath);
  await Deno.writeTextFile(notePath, mergeClosureSection(note, record));
}

export async function writeReleaseEvidence(evidence: ReleaseEvidence): Promise<void> {
  await Deno.mkdir('docs/release/autoflow3', { recursive: true });
  await Deno.writeTextFile(
    evidenceFile(evidence.targetVersion),
    formatJson(evidence),
  );
}

export function renderReleaseNote(evidence: ReleaseEvidence, manualSections = ''): string {
  const manual = manualSections.trim();
  const lines = [
    `# ${releaseTag(evidence.targetVersion)}`,
    '',
    // Hand-written sections (e.g. curated migration notes) sit between the
    // title and the evidence header; writeReleaseNote preserves them across
    // rewrites instead of clobbering them.
    ...(manual === '' ? [] : [manual, '']),
    `AutoFlow3 patch release evidence: \`${evidence.id}\`.`,
    '',
    `- Previous package line: \`${evidence.currentVersion}\``,
    `- Released package line: \`${evidence.targetVersion}\``,
    `- Policy version: \`${evidence.policyVersion}\``,
    `- Status: \`${evidence.status}\``,
    '',
    '`/@fs/` Windows verification status: see `docs/current/HYDRATION_CONTRACT.md` ' +
    '(Known limitations).',
    '',
    '## Evidence',
    '',
    ...evidence.steps.map((step) =>
      `- ${step.status}: ${step.name}${
        step.exitCode === undefined ? '' : ` (exit ${step.exitCode})`
      }`
    ),
    '',
  ];
  return lines.join('\n');
}

const EVIDENCE_HEADER_MARKER = 'AutoFlow3 patch release evidence:';

/**
 * Extract the hand-written sections of an existing release note: everything
 * between the `# <tag>` title and the evidence header line. Returns '' when
 * the note carries no manual content. #855: a note without an evidence header
 * yet (pre-seeded prose) treats everything after the title as manual.
 */
export function extractManualNoteSections(noteText: string): string {
  const lines = noteText.split('\n');
  const titleIndex = lines.findIndex((line) => line.startsWith('# '));
  if (titleIndex === -1) return '';
  const headerIndex = lines.findIndex((line) => line.startsWith(EVIDENCE_HEADER_MARKER));
  if (headerIndex === -1) {
    return lines.slice(titleIndex + 1).join('\n').trim();
  }
  if (headerIndex <= titleIndex + 1) return '';
  return lines.slice(titleIndex + 1, headerIndex).join('\n').trim();
}

export async function writeReleaseNote(evidence: ReleaseEvidence): Promise<void> {
  const path = releaseNoteFile(evidence.targetVersion);
  // Preserve curated sections written between the title and the evidence
  // header (e.g. migration notes); a re-run only regenerates the evidence
  // part of the note.
  let manual = '';
  try {
    manual = extractManualNoteSections(await Deno.readTextFile(path));
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
  }
  await Deno.writeTextFile(path, renderReleaseNote(evidence, manual));
}

/**
 * Snapshot the in-memory prepare evidence as the durable prepare record. Every
 * step is recorded as passed: the record asserts the completed, gated prepare
 * flow and only becomes durable once the following stage/commit steps land it
 * in the release commit (#684).
 */
export async function writePrepareRecord(evidence: ReleaseEvidence): Promise<void> {
  const record: ReleaseEvidence = {
    ...evidence,
    status: 'completed',
    completedAt: new Date().toISOString(),
    steps: evidence.steps.map((step) => ({ ...step, status: 'passed' })),
  };
  await Deno.mkdir('docs/release/autoflow3', { recursive: true });
  await Deno.writeTextFile(prepareRecordFile(record.targetVersion), formatJson(record));
}

/**
 * Read the prepare record for a version. Missing file means no prepare ran
 * (the caller refuses); a corrupt file is rejected loudly, matching
 * readPriorReleaseEvidence's trust model.
 */
export async function readPrepareRecord(
  version: string,
): Promise<ReleaseEvidence | undefined> {
  return await readJsonOrUndefined(prepareRecordFile(version), 'Prepare record');
}

/**
 * Load the evidence a previous attempt of the same release left behind, if
 * any. The file is only reused for the same kind and target version; anything
 * else starts a fresh run with a fresh evidence id.
 *
 * Trust model: the evidence file is written by the operator's own previous
 * run on the same machine, so well-formed JSON with a matching kind/target
 * and a steps array is trusted as-is — there is no integrity check on
 * statuses or provenance. A corrupt (unparseable) file is rejected loudly
 * instead of being silently discarded.
 */
export async function readPriorReleaseEvidence(
  kind: ReleaseEvidence['kind'],
  targetVersion: string,
): Promise<ReleaseEvidence | undefined> {
  const prior = await readJsonOrUndefined<ReleaseEvidence>(
    evidenceFile(targetVersion),
    'Prior release evidence',
  );
  if (
    prior === undefined || prior.kind !== kind || prior.targetVersion !== targetVersion ||
    !Array.isArray(prior.steps)
  ) {
    return undefined;
  }
  return prior;
}
