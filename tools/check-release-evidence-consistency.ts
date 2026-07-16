import { PACKAGE_VERSION, PACKAGE_VERSION_TAG } from './project-constants.ts';
import {
  type ReleaseClosureRecord,
  type ReleaseEvidenceSnapshot,
  validateReleaseEvidenceClosure,
} from './lib/release-evidence-consistency.ts';

async function git(args: string[]): Promise<string> {
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

async function isAncestor(ancestor: string, descendant: string): Promise<boolean> {
  const result = await new Deno.Command('git', {
    args: ['merge-base', '--is-ancestor', ancestor, descendant],
    stdout: 'null',
    stderr: 'null',
  }).output();
  return result.success;
}

const tag = PACKAGE_VERSION_TAG;
const evidencePath = `docs/release/autoflow3/${tag}.json`;
const closurePath = `docs/release/${tag}-closure.json`;
const releaseNotePath = `docs/release/${tag}.md`;
const tagExists = (await new Deno.Command('git', {
  args: ['rev-parse', '--verify', '--quiet', `refs/tags/${tag}`],
  stdout: 'null',
  stderr: 'null',
}).output()).success;

try {
  await Deno.stat(closurePath);
} catch (error) {
  if (!(error instanceof Deno.errors.NotFound)) throw error;
  if (tagExists) {
    throw new Error(
      `Published release tag ${tag} is missing its required closure record: ${closurePath}`,
    );
  }
  console.log(
    `Release evidence closure is pending for unpublished ${tag}; no tag exists yet.`,
  );
  Deno.exit(0);
}

const record = JSON.parse(await Deno.readTextFile(closurePath)) as ReleaseClosureRecord;
const actualTagCommit = await git(['rev-parse', tag]);
if (actualTagCommit !== record.tagCommit) {
  throw new Error(`Release tag ${tag} moved: expected ${record.tagCommit}, got ${actualTagCommit}`);
}
await git(['cat-file', '-e', `${record.finalEvidenceCommit}^{commit}`]);

const tagEvidence = JSON.parse(
  await git(['show', `${record.tagCommit}:${evidencePath}`]),
) as ReleaseEvidenceSnapshot;
const finalEvidence = JSON.parse(
  await git(['show', `${record.finalEvidenceCommit}:${evidencePath}`]),
) as ReleaseEvidenceSnapshot;
const failures = validateReleaseEvidenceClosure({
  version: PACKAGE_VERSION,
  record,
  tagIsAncestorOfFinal: await isAncestor(record.tagCommit, record.finalEvidenceCommit),
  finalIsAncestorOfHead: await isAncestor(record.finalEvidenceCommit, 'HEAD'),
  tagEvidence,
  finalEvidence,
  releaseNote: await Deno.readTextFile(releaseNotePath),
});

if (failures.length > 0) {
  console.error('Release evidence consistency check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  Deno.exit(1);
}

console.log(
  `Release evidence consistency passed for ${tag}: immutable tag snapshot -> completed ${record.finalEvidenceCommit}.`,
);
