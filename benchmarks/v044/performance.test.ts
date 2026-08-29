import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import {
  evaluateV044Performance,
  loadV044Definition,
  runV044Qualification,
  type V044PerformanceReport,
} from '../../tools/check-v044-performance.ts';

const fixtureRoot = new URL('./', import.meta.url);

Deno.test('alpha.7 qualification covers the frozen v0.44 performance matrix', async () => {
  const report = await runV044Qualification({
    fixtureRoot,
    browsers: [],
    writeEvidence: false,
  });

  assertEquals(evaluateV044Performance(report, undefined, { requireBrowsers: false }), []);
  assertEquals(report.scenarios.map((scenario) => scenario.id), [
    'fixed-only',
    'conditional',
    'keyed-list',
    'nested-real-app',
  ]);
  assertEquals(report.staticOutput.runtimeBytes, 0);
  assert(report.candidate.interactiveJsBytes < report.baseline.interactiveJsBytes);
  assert(report.resources.maxRetainedSubscriptions === 0);
  assert(report.resources.maxRetainedListeners === 0);
});

Deno.test('alpha.7 qualification rejects critical regressions and incomplete evidence', async () => {
  const definition = await loadV044Definition(fixtureRoot);
  const report = await runV044Qualification({
    fixtureRoot,
    browsers: [],
    writeEvidence: false,
  });
  const regressed = structuredClone(report) as V044PerformanceReport;
  const fixed = regressed.scenarios.find((scenario) => scenario.id === 'fixed-only')!;
  fixed.candidate.updateAllocations = Math.ceil(fixed.baseline.updateAllocations * 1.11);

  const failures = evaluateV044Performance(regressed, definition);
  assert(failures.some((failure) => failure.includes('fixed-only') && failure.includes('10%')));

  const missingBrowser = structuredClone(report) as V044PerformanceReport;
  missingBrowser.browser = [];
  const browserFailures = evaluateV044Performance(missingBrowser, definition, {
    requireBrowsers: true,
  });
  assertStringIncludes(browserFailures.join('\n'), 'browser evidence');

  const forgedBrowser = structuredClone(report) as V044PerformanceReport;
  forgedBrowser.browser = (['chromium', 'firefox', 'webkit'] as const).map((browser) => ({
    browser,
    passed: true,
    pageErrors: [],
    claimReady: true,
    identityPreserved: browser !== 'firefox',
    liveValuePreserved: true,
    serializedBytes: 384,
  }));
  const continuityFailures = evaluateV044Performance(forgedBrowser, definition, {
    requireBrowsers: true,
  });
  assertStringIncludes(continuityFailures.join('\n'), 'identity preservation');
});
