import { assert, assertEquals } from '@std/assert';
import { findReleaseTruthFailures, type ReleaseState } from './check-release-truth.ts';

const state: ReleaseState = {
  schemaVersion: 1,
  sourceVersion: '0.43.0',
  publishedVersion: '0.43.0',
  latestLandedTrain: 'v0.43.0',
  activeTarget: 'v0.43.1',
  nextPlannedTrain: 'not scheduled (maintenance mode)',
  maturity: 'stable',
};

function files() {
  return {
    'README.md': 'Source package line: `0.43.0`\nnpm registry line: `v0.43.0`',
    'docs/status/STATUS.md': 'Active release target: `v0.43.1`',
    'docs/roadmap/ROADMAP.md': 'Active execution target: `v0.43.1`.\n| `0.43.0` | shipped |',
    'docs/current/VERSION_PLAN.md': 'Active release target: `v0.43.1`',
    'examples/supabase-cloudflare-starter/deno.json': '"version": "0.43.0"',
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
  fixture['README.md'] = fixture['README.md'].replace('0.43.0', '0.42.0');
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
