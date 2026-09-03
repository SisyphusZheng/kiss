import {
  ACTIVE_EXECUTION_VERSION,
  NEXT_EXECUTION_VERSION,
  PACKAGE_VERSION,
  PACKAGE_VERSION_TAG,
} from './project-constants.ts';

export interface ReleaseState {
  schemaVersion: number;
  sourceVersion: string;
  publishedVersion: string;
  latestLandedTrain: string;
  activeTarget: string;
  nextPlannedTrain: string;
  maturity: 'alpha' | 'beta' | 'stable';
}

/**
 * The release line a checker run validates against. Defaults to the project
 * constants; tests inject other lines so stable-line expectations stay
 * regression-covered while the repository itself sits on a prerelease line.
 */
export interface ReleaseTruthContext {
  packageVersion: string;
  packageVersionTag: string;
  activeTarget: string;
  nextPlannedTrain: string;
}

const DEFAULT_CONTEXT: ReleaseTruthContext = {
  packageVersion: PACKAGE_VERSION,
  packageVersionTag: PACKAGE_VERSION_TAG,
  activeTarget: ACTIVE_EXECUTION_VERSION,
  nextPlannedTrain: NEXT_EXECUTION_VERSION,
};

/**
 * The npm dist-tag a version publishes under. Mirrors npmPublishTag
 * (tools/publish-npm.ts): prereleases publish with `--tag alpha|beta|rc` and
 * never move `latest`; stable releases keep npm's default `latest` tag.
 */
export function npmDistTag(version: string): 'alpha' | 'beta' | 'rc' | 'latest' {
  return (version.match(/-(alpha|beta|rc)(?:\.|$)/u)?.[1] as 'alpha' | 'beta' | 'rc' | undefined) ??
    'latest';
}

/**
 * The maturity the release state file records for a published line. Mirrors
 * advancePublishedReleaseStateText (tools/autoflow/version-anchors.ts): the
 * state enum has no 'rc', so an rc line finalizes as 'stable' there.
 */
function publishedMaturity(version: string): ReleaseState['maturity'] {
  const tag = npmDistTag(version);
  return tag === 'alpha' || tag === 'beta' ? tag : 'stable';
}

export function findReleaseTruthFailures(
  state: ReleaseState,
  read: (path: string) => string,
  context: ReleaseTruthContext = DEFAULT_CONTEXT,
): string[] {
  const failures: string[] = [];
  const { packageVersion, activeTarget, nextPlannedTrain } = context;
  const distTag = npmDistTag(packageVersion);
  const planningExpected = {
    schemaVersion: 1,
    activeTarget,
    nextPlannedTrain,
  } as const;
  for (const [key, value] of Object.entries(planningExpected)) {
    if (state[key as keyof ReleaseState] !== value) {
      failures.push(`release state ${key} != ${value}`);
    }
  }
  // The published-line fields are finalize-owned
  // (advancePublishedReleaseStateText): prepare intentionally leaves them on
  // the previously published line until the publish finalize proves npm, the
  // immutable tag and the GitHub release. Accept exactly the two consistent
  // windows — finalized on the current line, or prepare-window lag on the
  // prior line — and reject every mixed state.
  const finalized = state.sourceVersion === packageVersion;
  const publishedLine = finalized ? packageVersion : state.sourceVersion;
  const window = finalized ? 'finalized' : 'prepare-window';
  const windowExpected = {
    publishedVersion: publishedLine,
    latestLandedTrain: `v${publishedLine}`,
    maturity: publishedMaturity(publishedLine),
  } as const;
  for (const [key, value] of Object.entries(windowExpected)) {
    if (state[key as keyof ReleaseState] !== value) {
      failures.push(`release state ${key} != ${value} (${window} expectation)`);
    }
  }
  const anchors: Array<[string, string]> = [
    ['README.md', `Source package line: \`${packageVersion}\``],
    ['README.zh.md', `源码包行为 \`${packageVersion}\``],
    ['docs/status/STATUS.md', `Active release target: \`${activeTarget}\``],
    ['docs/roadmap/ROADMAP.md', `Active execution target: \`${activeTarget}\``],
    ['docs/current/VERSION_PLAN.md', `Active release target: \`${activeTarget}\``],
    ['examples/supabase-cloudflare-starter/deno.json', `"version": "${packageVersion}"`],
  ];
  if (distTag === 'latest') {
    anchors.push(
      ['README.md', `npm registry line: \`v${packageVersion}\``],
      ['README.md', `published as stable \`${packageVersion}\``],
      ['README.zh.md', `npm registry 行为 \`v${packageVersion}\``],
      ['README.zh.md', `stable \`${packageVersion}\` 发布`],
      ['docs/status/STATUS.md', `stable at\n\`${packageVersion}\``],
      [
        'docs/roadmap/ROADMAP.md',
        `\`${packageVersion}\` is both the current source package line`,
      ],
    );
  } else {
    // Prerelease line: the registry anchors carry the prerelease dist-tag and
    // every governed doc keeps `latest` pinned on the stable line.
    anchors.push(
      [
        'README.md',
        `npm registry line: \`v${packageVersion}\` (prerelease, dist-tag \`${distTag}\`)`,
      ],
      ['README.md', 'npm `latest` remains the stable'],
      [
        'README.zh.md',
        `npm registry 行为 \`v${packageVersion}\`——预发布版本(dist-tag \`${distTag}\`)`,
      ],
      ['README.zh.md', 'npm `latest` 仍为'],
      [
        'docs/status/STATUS.md',
        `npm registry line: \`v${packageVersion}\` (prerelease, dist-tag \`${distTag}\`)`,
      ],
      ['docs/status/STATUS.md', 'dist-tag stays stable at'],
      [
        'docs/roadmap/ROADMAP.md',
        `npm registry line: \`v${packageVersion}\` (prerelease, dist-tag \`${distTag}\`)`,
      ],
      ['docs/roadmap/ROADMAP.md', 'npm `latest` dist-tag remains on the published stable'],
      [
        'docs/current/VERSION_PLAN.md',
        `npm registry line: \`v${packageVersion}\` (prerelease, dist-tag \`${distTag}\`; npm \`latest\` remains the stable`,
      ],
    );
  }
  for (const [path, anchor] of anchors) {
    let text: string;
    try {
      text = read(path);
    } catch {
      failures.push(`${path}: missing release-truth scan target`);
      continue;
    }
    if (!text.includes(anchor)) failures.push(`${path}: missing release anchor ${anchor}`);
  }
  let roadmap = '';
  try {
    roadmap = read('docs/roadmap/ROADMAP.md');
  } catch {
    return failures;
  }
  const row = roadmap.split('\n').find((line) => line.includes('| `0.43.0`')) ?? '';
  for (const deferred of ['streaming SSR', 'validateAction', 'cross-runtime start CLI']) {
    if (row.includes(deferred)) {
      failures.push(`0.43 shipped row contains deferred capability: ${deferred}`);
    }
  }
  return failures;
}

if (import.meta.main) {
  const state = JSON.parse(
    await Deno.readTextFile('docs/release/release-state.json'),
  ) as ReleaseState;
  const failures = findReleaseTruthFailures(state, Deno.readTextFileSync);
  if (failures.length) throw new Error(failures.join('\n'));
  console.log('Release truth check passed.');
}
