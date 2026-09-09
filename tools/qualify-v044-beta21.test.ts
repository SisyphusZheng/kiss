import { assert, assertEquals, assertRejects, assertThrows } from '@std/assert';
import {
  buildQualificationArtifact,
  declaredTestCount,
  parseDenoTestSummary,
  parsePlaywrightJson,
  requireBrowserProjects,
} from './qualify-v044-beta21.ts';

const SHA = 'a'.repeat(40);

Deno.test('parseDenoTestSummary parses plain and stepped summaries', () => {
  assertEquals(parseDenoTestSummary('ok | 25 passed | 0 failed (36ms)'), { passed: 25, failed: 0 });
  assertEquals(parseDenoTestSummary('ok | 5 passed (12 steps) | 0 failed (1s)'), {
    passed: 17,
    failed: 0,
  });
  assertEquals(parseDenoTestSummary('FAILED | 3 passed | 1 failed (10ms)'), {
    passed: 3,
    failed: 1,
  });
  assertThrows(
    () => parseDenoTestSummary('no tests ran here'),
    Error,
    'no tests were selected',
  );
});

Deno.test('declaredTestCount counts Deno.test declarations in real files', async () => {
  const count = await declaredTestCount(['tools/lib/version.test.ts']);
  assert(count >= 15, `version.test.ts declares ${count} tests`);
  await assertRejects(
    () => declaredTestCount(['tools/does-not-exist.test.ts']),
    Deno.errors.NotFound,
  );
});

Deno.test('parsePlaywrightJson aggregates per-project outcomes', () => {
  const report = JSON.stringify({
    suites: [{
      title: 'router-guard.spec.ts',
      specs: [{
        title: 'guard blocks',
        ok: true,
        tests: [
          { projectName: 'chromium', status: 'expected' },
          { projectName: 'firefox', status: 'expected' },
          { projectName: 'webkit', status: 'unexpected' },
        ],
      }, {
        title: 'guard redirects',
        ok: true,
        tests: [
          { projectName: 'chromium', status: 'flaky' },
          { projectName: 'firefox', status: 'skipped' },
          { projectName: 'webkit', status: 'expected' },
        ],
      }],
    }],
  });
  assertEquals(parsePlaywrightJson(report), {
    chromium: { passed: 2, failed: 0, skipped: 0 },
    firefox: { passed: 1, failed: 0, skipped: 1 },
    webkit: { passed: 1, failed: 1, skipped: 0 },
  });
  assertThrows(() => parsePlaywrightJson('{'), Error, 'not parseable');
  assertThrows(() => parsePlaywrightJson('{"suites": []}'), Error, 'nothing ran');
});

Deno.test('requireBrowserProjects fails closed on absent, vacuous or failed engines', () => {
  const all = {
    chromium: { passed: 3, failed: 0, skipped: 0 },
    firefox: { passed: 3, failed: 0, skipped: 0 },
    webkit: { passed: 3, failed: 0, skipped: 0 },
  };
  assertEquals(requireBrowserProjects(all, 'navigation'), all);
  const missing = { ...all } as Record<string, unknown>;
  delete missing.webkit;
  assertThrows(
    () => requireBrowserProjects(missing as typeof all, 'navigation'),
    Error,
    'project "webkit" is absent',
  );
  assertThrows(
    () =>
      requireBrowserProjects(
        { ...all, firefox: { passed: 0, failed: 0, skipped: 3 } },
        'navigation',
      ),
    Error,
    'vacuous',
  );
  assertThrows(
    () =>
      requireBrowserProjects(
        { ...all, chromium: { passed: 2, failed: 1, skipped: 0 } },
        'navigation',
      ),
    Error,
    'failure',
  );
});

Deno.test('buildQualificationArtifact attests only a complete pass on a trusted SHA', () => {
  const legs = {
    router: { result: 'pass', detail: { passed: 60 } },
    navigation: { result: 'pass', detail: {} },
  } as const;
  const artifact = JSON.parse(
    buildQualificationArtifact(
      { sha: SHA, release: '0.44.0-beta.2.1', tier: 'ci', runId: 7 },
      { ...legs },
      ['router', 'navigation'],
    ),
  );
  assertEquals(artifact.schemaVersion, 1);
  assertEquals(artifact.kind, 'v044-beta21-qualification');
  assertEquals(artifact.release, '0.44.0-beta.2.1');
  assertEquals(artifact.sha, SHA);
  assertEquals(artifact.conclusion, 'pass');
  assertEquals(artifact.legs.router.result, 'pass');
  assertEquals(artifact.legs.router.passed, 60);

  assertThrows(
    () => buildQualificationArtifact({ sha: 'not-a-sha', release: 'x', tier: 'ci' }, {}, []),
    Error,
    'untrusted SHA',
  );
  assertThrows(
    () =>
      buildQualificationArtifact(
        { sha: SHA, release: 'x', tier: 'ci' },
        { ...legs },
        ['router', 'navigation', 'runtime'],
      ),
    Error,
    'leg runtime did not run',
  );
  assertThrows(
    () =>
      buildQualificationArtifact(
        { sha: SHA, release: 'x', tier: 'ci' },
        { router: { result: 'fail', detail: {} } } as never,
        ['router'],
      ),
    Error,
    'did not pass',
  );
});
