import { assert, assertEquals } from '@std/assert';
import { findReleaseTruthFailures, type ReleaseState } from './check-release-truth.ts';
import {
  ACTIVE_EXECUTION_VERSION,
  LATEST_LANDED_TRAIN,
  NEXT_EXECUTION_VERSION,
  PACKAGE_VERSION,
} from './project-constants.ts';

const state: ReleaseState = {
  schemaVersion: 1,
  sourceVersion: PACKAGE_VERSION,
  publishedVersion: PACKAGE_VERSION,
  latestLandedTrain: LATEST_LANDED_TRAIN,
  activeTarget: ACTIVE_EXECUTION_VERSION,
  nextPlannedTrain: NEXT_EXECUTION_VERSION,
  maturity: 'stable',
};

function files() {
  return {
    'README.md':
      `Source package line: \`${state.sourceVersion}\`\nnpm registry line: \`v${state.publishedVersion}\``,
    'docs/status/STATUS.md': `Active release target: \`${state.activeTarget}\``,
    'docs/roadmap/ROADMAP.md':
      `Active execution target: \`${state.activeTarget}\`.\n| \`0.43.0\` | shipped |`,
    'docs/current/VERSION_PLAN.md': `Active release target: \`${state.activeTarget}\``,
    'examples/supabase-cloudflare-starter/deno.json': `"version": "${state.sourceVersion}"`,
  };
}

Deno.test('release truth accepts the converged state', () => {
  const fixture = files();
  assertEquals(
    findReleaseTruthFailures(state, (path) => fixture[path as keyof typeof fixture]),
    [],
  );
});

Deno.test('release truth rejects stale copy, deferred shipped claims, alpha starter, and missing roots', () => {
  const fixture: Record<string, string> = files();
  fixture['README.md'] = fixture['README.md'].replace(state.sourceVersion, '0.42.0');
  fixture['docs/roadmap/ROADMAP.md'] = fixture['docs/roadmap/ROADMAP.md'].replace(
    '| `0.43.0` | shipped |',
    '| `0.43.0` | streaming SSR |',
  );
  fixture['examples/supabase-cloudflare-starter/deno.json'] = '"version": "0.43.0-alpha.1"';
  delete fixture['docs/status/STATUS.md'];
  const failures = findReleaseTruthFailures(state, (path) => {
    if (!(path in fixture)) throw new Deno.errors.NotFound();
    return fixture[path];
  });
  assert(failures.some((failure) => failure.includes('README.md')));
  assert(failures.some((failure) => failure.includes('deferred capability')));
  assert(failures.some((failure) => failure.includes('deno.json')));
  assert(failures.some((failure) => failure.includes('missing release-truth scan target')));
});
