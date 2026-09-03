import { assert, assertEquals } from '@std/assert';
import {
  findReleaseTruthFailures,
  npmDistTag,
  type ReleaseState,
  type ReleaseTruthContext,
} from './check-release-truth.ts';

// Injected contexts keep the stable-line expectations regression-covered even
// while the repository itself sits on a prerelease line.
const STABLE: ReleaseTruthContext = {
  packageVersion: '0.43.3',
  packageVersionTag: 'v0.43.3',
  activeTarget: 'v0.43.3',
  nextPlannedTrain: 'v0.44.0-alpha.0',
};

const PRERELEASE: ReleaseTruthContext = {
  packageVersion: '0.44.0-beta.1',
  packageVersionTag: 'v0.44.0-beta.1',
  activeTarget: 'v0.44.0-beta.1',
  nextPlannedTrain: 'v0.44.0-beta.2',
};

function finalizedState(
  context: ReleaseTruthContext,
  maturity: ReleaseState['maturity'],
): ReleaseState {
  return {
    schemaVersion: 1,
    sourceVersion: context.packageVersion,
    publishedVersion: context.packageVersion,
    latestLandedTrain: context.packageVersionTag,
    activeTarget: context.activeTarget,
    nextPlannedTrain: context.nextPlannedTrain,
    maturity,
  };
}

// Prepare window: the docs and the package line already advanced, but the
// finalize-owned fields of release-state.json still describe the previously
// published line.
function prepareWindowState(context: ReleaseTruthContext, priorLine: string): ReleaseState {
  return {
    schemaVersion: 1,
    sourceVersion: priorLine,
    publishedVersion: priorLine,
    latestLandedTrain: `v${priorLine}`,
    activeTarget: context.activeTarget,
    nextPlannedTrain: context.nextPlannedTrain,
    maturity: 'stable',
  };
}

function stableFiles(context: ReleaseTruthContext): Record<string, string> {
  const v = context.packageVersion;
  return {
    'README.md':
      `Source package line: \`${v}\`\nnpm registry line: \`v${v}\`\npublished as stable \`${v}\``,
    'README.zh.md': `源码包行为 \`${v}\`\nnpm registry 行为 \`v${v}\`\nstable \`${v}\` 发布`,
    'docs/status/STATUS.md':
      `Active release target: \`${context.activeTarget}\`\nstable at\n\`${v}\``,
    'docs/roadmap/ROADMAP.md':
      `Active execution target: \`${context.activeTarget}\`.\n\`${v}\` is both the current source package line\n| \`0.43.0\` | shipped |`,
    'docs/current/VERSION_PLAN.md': `Active release target: \`${context.activeTarget}\``,
    'examples/supabase-cloudflare-starter/deno.json': `"version": "${v}"`,
  };
}

// The anchor shape PR #1283 wrote for the Beta.1 prerelease line.
function prereleaseFiles(context: ReleaseTruthContext): Record<string, string> {
  const v = context.packageVersion;
  const tag = npmDistTag(v);
  return {
    'README.md':
      `Source package line: \`${v}\` (\`${context.packageVersionTag}\`).\nnpm registry line: \`v${v}\` (prerelease, dist-tag \`${tag}\`); npm \`latest\` remains the stable \`0.43.3\` line.`,
    'README.zh.md':
      `源码包行为 \`${v}\`（\`${context.packageVersionTag}\`）\nnpm registry 行为 \`v${v}\`——预发布版本(dist-tag \`${tag}\`)；npm \`latest\` 仍为\n已发布的稳定 0.43 线。`,
    'docs/status/STATUS.md':
      `Active release target: \`${context.activeTarget}\`\nnpm registry line: \`v${v}\` (prerelease, dist-tag \`${tag}\`)\ndist-tag stays stable at\n\`0.43.3\``,
    'docs/roadmap/ROADMAP.md':
      `Active execution target: \`${context.activeTarget}\`.\nnpm registry line: \`v${v}\` (prerelease, dist-tag \`${tag}\`).\nThe npm \`latest\` dist-tag remains on the published stable 0.43 line.\n| \`0.43.0\` | shipped |`,
    'docs/current/VERSION_PLAN.md':
      `Active release target: \`${context.activeTarget}\`\nnpm registry line: \`v${v}\` (prerelease, dist-tag \`${tag}\`; npm \`latest\` remains the stable 0.43 line)`,
    'examples/supabase-cloudflare-starter/deno.json': `"version": "${v}"`,
  };
}

function reader(fixture: Record<string, string>) {
  return (path: string): string => {
    if (!(path in fixture)) throw new Deno.errors.NotFound();
    return fixture[path];
  };
}

Deno.test('npmDistTag mirrors npmPublishTag semantics', () => {
  assertEquals(npmDistTag('0.44.0-alpha.3'), 'alpha');
  assertEquals(npmDistTag('0.44.0-beta.1'), 'beta');
  assertEquals(npmDistTag('0.44.0-rc.1'), 'rc');
  assertEquals(npmDistTag('0.43.3'), 'latest');
});

Deno.test('release truth accepts the converged stable state', () => {
  assertEquals(
    findReleaseTruthFailures(finalizedState(STABLE, 'stable'), reader(stableFiles(STABLE)), STABLE),
    [],
  );
});

Deno.test('release truth rejects stale copy, deferred shipped claims, alpha starter, and missing roots', () => {
  const fixture = stableFiles(STABLE);
  fixture['README.md'] = fixture['README.md'].replace(STABLE.packageVersion, '0.42.0');
  fixture['docs/roadmap/ROADMAP.md'] = fixture['docs/roadmap/ROADMAP.md'].replace(
    '| `0.43.0` | shipped |',
    '| `0.43.0` | streaming SSR |',
  );
  fixture['examples/supabase-cloudflare-starter/deno.json'] = '"version": "0.43.0-alpha.1"';
  delete fixture['docs/status/STATUS.md'];
  const failures = findReleaseTruthFailures(
    finalizedState(STABLE, 'stable'),
    reader(fixture),
    STABLE,
  );
  assert(failures.some((failure) => failure.includes('README.md')));
  assert(failures.some((failure) => failure.includes('deferred capability')));
  assert(failures.some((failure) => failure.includes('deno.json')));
  assert(failures.some((failure) => failure.includes('missing release-truth scan target')));
});

Deno.test('release truth accepts the prerelease prepare window (state lags on the prior stable line)', () => {
  assertEquals(
    findReleaseTruthFailures(
      prepareWindowState(PRERELEASE, '0.43.3'),
      reader(prereleaseFiles(PRERELEASE)),
      PRERELEASE,
    ),
    [],
  );
});

Deno.test('release truth accepts the finalized prerelease state', () => {
  assertEquals(
    findReleaseTruthFailures(
      finalizedState(PRERELEASE, 'beta'),
      reader(prereleaseFiles(PRERELEASE)),
      PRERELEASE,
    ),
    [],
  );
});

Deno.test('release truth rejects a mixed prepare-window state', () => {
  const earlyPublish = {
    ...prepareWindowState(PRERELEASE, '0.43.3'),
    publishedVersion: PRERELEASE.packageVersion,
  };
  const earlyFailures = findReleaseTruthFailures(
    earlyPublish,
    reader(prereleaseFiles(PRERELEASE)),
    PRERELEASE,
  );
  assert(earlyFailures.some((failure) => failure.includes('publishedVersion')));

  const earlyMaturity = { ...prepareWindowState(PRERELEASE, '0.43.3'), maturity: 'beta' as const };
  const maturityFailures = findReleaseTruthFailures(
    earlyMaturity,
    reader(prereleaseFiles(PRERELEASE)),
    PRERELEASE,
  );
  assert(maturityFailures.some((failure) => failure.includes('maturity')));

  const earlyTrain = {
    ...prepareWindowState(PRERELEASE, '0.43.3'),
    latestLandedTrain: PRERELEASE.packageVersionTag,
  };
  const trainFailures = findReleaseTruthFailures(
    earlyTrain,
    reader(prereleaseFiles(PRERELEASE)),
    PRERELEASE,
  );
  assert(trainFailures.some((failure) => failure.includes('latestLandedTrain')));
});

Deno.test('release truth rejects stable-shaped published-line anchors for a prerelease', () => {
  const failures = findReleaseTruthFailures(
    prepareWindowState(PRERELEASE, '0.43.3'),
    reader(stableFiles(PRERELEASE)),
    PRERELEASE,
  );
  assert(failures.some((failure) => failure.includes('README.md') && failure.includes('dist-tag')));
  assert(
    failures.some((failure) => failure.includes('README.zh.md') && failure.includes('预发布版本')),
  );
  assert(failures.some((failure) => failure.includes('docs/status/STATUS.md')));
  assert(failures.some((failure) => failure.includes('docs/roadmap/ROADMAP.md')));
});

Deno.test('release truth rejects stable maturity once a prerelease is finalized', () => {
  const failures = findReleaseTruthFailures(
    finalizedState(PRERELEASE, 'stable'),
    reader(prereleaseFiles(PRERELEASE)),
    PRERELEASE,
  );
  assert(failures.some((failure) => failure.includes('maturity')));
});
