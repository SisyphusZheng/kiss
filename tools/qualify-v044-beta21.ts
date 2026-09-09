#!/usr/bin/env -S deno run -A
/**
 * qualify-v044-beta21.ts — the Beta.2.1 release qualification lane (#1343).
 *
 * One command that proves the Beta.2.1 contract end to end and, only when
 * every leg passed, writes ONE machine-readable evidence artifact tied to the
 * exact candidate SHA:
 *
 *   deno task v044:beta21:qualification
 *
 * Legs (executed as real subprocesses; nothing is inferred from prose):
 *   - urlPatternListRegistry  live npm provenance of the exact pinned fork
 *                             (tools/check-url-pattern-list-release.ts)
 *   - versionSemantics        checkpoint-grammar acceptance tables
 *                             (tools/lib/version.test.ts, tools/bump-version.test.ts)
 *   - router                  RouteTable / router-http / client-router /
 *                             url-pattern-list / projection-guard unit tests
 *   - ssg                     canonical routeInfo/SSG unit tests + the
 *                             request-time fixture built and exercised on
 *                             Chromium, Firefox and WebKit
 *   - navigation              www navigation/router-guard/spa-action specs on
 *                             Chromium, Firefox and WebKit (real browsers)
 *   - packagedStarter/Ui/Element  packed-tarball consumers; the Element proof
 *                             is the standalone authored-TSX → packed element
 *                             → build-time-only adapter → plain-HTML consumer
 *                             on all three engines, with the Router provably
 *                             absent from the install
 *   - runtime                 CI: consumed from the trusted `needs` results of
 *                             node-serve-smoke (Node 20 floor + Node 24),
 *                             bun-serve-smoke and workspace-qualification
 *                             (workerd) running on the same SHA. Local: the
 *                             nitro node/workers proofs run directly and the
 *                             CI-only legs are reported as not verified.
 *
 * Non-vacuity: a leg is not "pass" because a command exited 0. Test legs
 * require the number of passed tests to cover every Deno.test declared in the
 * target files; browser legs require per-engine pass counts from the
 * machine-readable Playwright report; the packaged-Element leg requires the
 * structured per-engine proof line. Zero selected tests, a missing browser
 * project or a missing tarball fail the lane.
 *
 * The artifact (v044-beta21-qualification.json) is written ONLY after all
 * required legs pass; any failure exits non-zero without writing. In CI the
 * recorded SHA must equal the trusted HEAD_SHA workflow context, so the
 * artifact cannot attest a different commit than the one the run checked out.
 *
 * Usage:
 *   deno task v044:beta21:qualification              # full lane
 *   deno run -A tools/qualify-v044-beta21.ts --only router,versionSemantics
 *                                                    # development: subset, no artifact
 */

import { nextCheckpointVersion } from './lib/version.ts';
import { PACKAGE_VERSION } from './project-constants.ts';

export const QUALIFICATION_ARTIFACT = 'v044-beta21-qualification.json';
export const NAVIGATION_SPECS = [
  'navigation-routing.spec.ts',
  'router-guard.spec.ts',
  'spa-action.spec.ts',
] as const;
export const BROWSER_PROJECTS = ['chromium', 'firefox', 'webkit'] as const;

const ROUTER_TEST_FILES = [
  // URL winner before method dispatch, 405/Allow from the winning route,
  // HEAD fallback with explicit-HEAD precedence, Hono never rematching.
  'packages/app/__tests__/router-http.test.ts',
  // Duplicate route identity rejection, query/path isolation,
  // pattern.pathname rejection, URLPatternList precedence.
  'packages/app/__tests__/route-resolution.test.ts',
  'packages/app/__tests__/url-pattern-list.test.ts',
  'packages/app/__tests__/route-pattern.test.ts',
  // Canonical RouteTable driving browser routing (client router, guards,
  // latest-wins sequencing) and the SPA shell.
  'packages/app/__tests__/client-router.test.ts',
  'packages/app/__tests__/router-browser.test.ts',
  'packages/app/__tests__/spa.test.ts',
] as const;

const SSG_TEST_FILES = [
  // SSG synthetic projection is discovery-only; the canonical dispatcher owns
  // real matching/rendering; static failures surface.
  'packages/app/__tests__/spa-projection-guard.test.ts',
  'packages/app/__tests__/spa-projection-alpha10-verifier.test.ts',
  // routeInfo-driven page discovery and canonical render authority.
  'packages/adapter-vite/__tests__/ssg-render.test.ts',
  'packages/adapter-vite/__tests__/page-route-tag-resolution.test.ts',
] as const;

const VERSION_TEST_FILES = [
  'tools/lib/version.test.ts',
  'tools/bump-version.test.ts',
] as const;

const REQUEST_TIME_FIXTURE = 'packages/adapter-vite/__fixtures__/request-time';

export type LegResult = 'pass';

export interface LegOutcome {
  result: LegResult;
  detail: Record<string, unknown>;
}

interface CommandResult {
  code: number;
  stdout: string;
  stderr: string;
}

type Runner = (cmd: readonly string[]) => Promise<CommandResult>;

async function defaultRunner(cmd: readonly string[]): Promise<CommandResult> {
  const output = await new Deno.Command(cmd[0], {
    args: cmd.slice(1),
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  return {
    code: output.code,
    stdout: new TextDecoder().decode(output.stdout),
    stderr: new TextDecoder().decode(output.stderr),
  };
}

function assertCommand(ok: CommandResult, label: string): CommandResult {
  if (ok.code !== 0) {
    const tail = (ok.stdout + '\n' + ok.stderr).split('\n').slice(-25).join('\n');
    throw new Error(`${label} failed (exit ${ok.code}):\n${tail}`);
  }
  return ok;
}

// ---------------------------------------------------------------------------
// Non-vacuity parsers
// ---------------------------------------------------------------------------

export interface DenoTestSummary {
  passed: number;
  failed: number;
}

/** Parse Deno's final `ok | N passed (M steps) | K failed` summary line. */
export function parseDenoTestSummary(output: string): DenoTestSummary {
  const match = output.match(
    /(?:^|\n)(?:ok|FAILED) \| (\d+) passed(?: \((\d+) steps\))? \| (\d+) failed/,
  );
  if (!match) {
    throw new Error('deno test output has no summary line — no tests were selected?');
  }
  return { passed: Number(match[1]) + Number(match[2] ?? 0), failed: Number(match[3]) };
}

/** Count declared Deno.test blocks; the passed count must cover them all. */
export async function declaredTestCount(files: readonly string[]): Promise<number> {
  let total = 0;
  for (const file of files) {
    const text = await Deno.readTextFile(file);
    total += (text.match(/\bDeno\.test\s*\(/g) ?? []).length;
  }
  return total;
}

export interface BrowserLegSummary {
  passed: number;
  failed: number;
  skipped: number;
}

/** Per-project pass/fail counts from the machine-readable Playwright report. */
export function parsePlaywrightJson(reportText: string): Record<string, BrowserLegSummary> {
  let report: unknown;
  try {
    report = JSON.parse(reportText);
  } catch (error) {
    throw new Error(`playwright JSON report is not parseable: ${error}`);
  }
  const summary: Record<string, BrowserLegSummary> = {};
  interface JsonSpec {
    ok?: boolean;
    tests?: Array<{
      projectName?: string;
      status?: string;
      results?: Array<{ status?: string }>;
    }>;
    suites?: JsonSpec[];
    specs?: JsonSpec[];
  }
  const visit = (suite: JsonSpec): void => {
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        const project = test.projectName ?? 'unknown';
        const slot = summary[project] ??= { passed: 0, failed: 0, skipped: 0 };
        const status = test.status ??
          test.results?.[test.results.length - 1]?.status ?? 'unexpected';
        if (status === 'expected' || status === 'flaky') slot.passed++;
        else if (status === 'skipped') slot.skipped++;
        else slot.failed++;
      }
    }
    for (const child of suite.suites ?? []) visit(child);
  };
  const root = report as { suites?: JsonSpec[] };
  for (const suite of root.suites ?? []) visit(suite);
  if (Object.keys(summary).length === 0) {
    throw new Error('playwright JSON report contains no specs — nothing ran');
  }
  return summary;
}

/** Every required browser project must be present with real passes. */
export function requireBrowserProjects(
  summary: Record<string, BrowserLegSummary>,
  label: string,
): Record<string, BrowserLegSummary> {
  for (const project of BROWSER_PROJECTS) {
    const slot = summary[project];
    if (!slot) {
      throw new Error(`${label}: Playwright project "${project}" is absent from the report`);
    }
    if (slot.passed < 1) {
      throw new Error(`${label}: "${project}" passed 0 tests (skipped=${slot.skipped}) — vacuous`);
    }
    if (slot.failed > 0) throw new Error(`${label}: "${project}" has ${slot.failed} failure(s)`);
  }
  return summary;
}

// ---------------------------------------------------------------------------
// Artifact assembly (fail closed; trusted-context only)
// ---------------------------------------------------------------------------

export interface QualificationContext {
  sha: string;
  release: string;
  tier: 'ci' | 'local';
  repository?: string;
  runId?: number;
  runAttempt?: number;
  url?: string;
}

export function buildQualificationArtifact(
  context: QualificationContext,
  legs: Record<string, LegOutcome>,
  requiredLegs: readonly string[],
): string {
  if (!/^[0-9a-f]{40}$/iu.test(context.sha)) {
    throw new Error(`refusing to attest: untrusted SHA ${context.sha}`);
  }
  for (const name of requiredLegs) {
    const leg = legs[name];
    if (!leg) throw new Error(`refusing to attest: leg ${name} did not run`);
    if (leg.result !== 'pass') throw new Error(`refusing to attest: leg ${name} did not pass`);
  }
  const record = {
    schemaVersion: 1,
    kind: 'v044-beta21-qualification',
    release: context.release,
    sha: context.sha.toLowerCase(),
    tier: context.tier,
    conclusion: 'pass',
    repository: context.repository,
    runId: context.runId,
    runAttempt: context.runAttempt,
    url: context.url,
    legs: Object.fromEntries(
      Object.entries(legs).map(([name, leg]) => [name, { result: leg.result, ...leg.detail }]),
    ),
  };
  return `${JSON.stringify(record, null, 2)}\n`;
}

// ---------------------------------------------------------------------------
// Legs
// ---------------------------------------------------------------------------

interface LaneRuntime {
  runner: Runner;
  log: (message: string) => void;
}

async function denoTestLeg(
  runtime: LaneRuntime,
  label: string,
  files: readonly string[],
): Promise<LegOutcome> {
  const declared = await declaredTestCount(files);
  if (declared === 0) {
    throw new Error(`${label}: no Deno.test declarations found — wrong file set?`);
  }
  const result = assertCommand(
    // Same permission envelope as `deno task test`: router-browser.test.ts
    // launches real browsers through Playwright (needs --allow-sys).
    await runtime.runner([
      'deno',
      'test',
      '--allow-read',
      '--allow-write',
      '--allow-env',
      '--allow-run',
      '--allow-net',
      '--allow-ffi',
      '--allow-sys',
      ...files,
    ]),
    label,
  );
  const summary = parseDenoTestSummary(result.stdout + '\n' + result.stderr);
  if (summary.failed > 0) throw new Error(`${label}: ${summary.failed} test(s) failed`);
  if (summary.passed < declared) {
    throw new Error(
      `${label}: only ${summary.passed} of ${declared} declared tests passed — vacuous or filtered run`,
    );
  }
  return {
    result: 'pass',
    detail: { files: [...files], declaredTests: declared, passed: summary.passed },
  };
}

async function playwrightLeg(
  label: string,
  cwd: string,
  config: string,
  specFilters: readonly string[],
): Promise<LegOutcome> {
  const reportPath = await Deno.makeTempFile({ prefix: 'oe-pw-report-', suffix: '.json' });
  try {
    const env = { PLAYWRIGHT_JSON_OUTPUT_NAME: reportPath };
    const cmd = [
      'deno',
      'run',
      '-A',
      'npm:@playwright/test@1.59.1',
      'test',
      '--config',
      config,
      '--reporter',
      'json',
      ...specFilters,
    ];
    const output = await new Deno.Command(cmd[0], {
      args: cmd.slice(1),
      cwd,
      env,
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    const text = new TextDecoder().decode(output.stdout) + new TextDecoder().decode(output.stderr);
    if (output.code !== 0) {
      throw new Error(
        `${label} failed (exit ${output.code}):\n${text.split('\n').slice(-25).join('\n')}`,
      );
    }
    const summary = requireBrowserProjects(
      parsePlaywrightJson(await Deno.readTextFile(reportPath)),
      label,
    );
    return {
      result: 'pass',
      detail: { specs: [...specFilters], browsers: summary },
    };
  } finally {
    await Deno.remove(reportPath).catch(() => {});
  }
}

async function legUrlPatternListRegistry(runtime: LaneRuntime): Promise<LegOutcome> {
  const result = assertCommand(
    await runtime.runner([
      'deno',
      'run',
      '--allow-read',
      '--allow-net=registry.npmjs.org',
      'tools/check-url-pattern-list-release.ts',
      '--json',
    ]),
    'urlPatternListRegistry',
  );
  const report = JSON.parse(result.stdout) as {
    ok?: boolean;
    package?: string;
    version?: string;
    integrity?: string;
    repositoryUrl?: string;
    license?: string;
    fileCount?: number;
  };
  if (
    report.ok !== true || report.package !== '@openelement/url-pattern-list' ||
    !report.integrity?.startsWith('sha512-') || !report.fileCount
  ) {
    throw new Error('urlPatternListRegistry: provenance report is malformed or not ok');
  }
  return {
    result: 'pass',
    detail: {
      package: report.package,
      version: report.version,
      integrity: report.integrity,
      repository: report.repositoryUrl,
      license: report.license,
      fileCount: report.fileCount,
    },
  };
}

async function legSsgFixture(runtime: LaneRuntime): Promise<LegOutcome> {
  assertCommand(
    await runtime.runner(['deno', 'task', 'fixture:request-time:build']),
    'ssg fixture build',
  );
  return await playwrightLeg(
    'ssg request-time fixture',
    REQUEST_TIME_FIXTURE,
    'e2e/playwright.config.ts',
    [],
  );
}

async function legNavigation(runtime: LaneRuntime): Promise<LegOutcome> {
  // The specs serve www/dist; a fresh checkout must build first. Reuse an
  // existing build only when it is present (local iteration).
  const built = await Deno.stat('www/dist/index.html').then(() => true, () => false);
  if (!built) {
    runtime.log('www/dist missing — building the site for the navigation leg');
    assertCommand(await runtime.runner(['deno', 'task', 'build']), 'www build');
  }
  return await playwrightLeg('navigation', 'www/e2e', 'playwright.config.ts', [
    ...NAVIGATION_SPECS,
  ]);
}

async function legPackagedArtifacts(runtime: LaneRuntime): Promise<LegOutcome> {
  assertCommand(
    await runtime.runner(['deno', 'task', 'package-artifacts:check']),
    'package-artifacts:check',
  );
  const tarballs: Array<{ path: string; bytes: number }> = [];
  for (const pkg of ['element', 'ui', 'adapter-vite', 'create', 'app']) {
    const path = `packages/${pkg}/openelement-${pkg}-${PACKAGE_VERSION}.tgz`;
    const info = await Deno.stat(path).catch(() => undefined);
    if (!info || info.size === 0) {
      throw new Error(`packed tarball missing after package-artifacts:check: ${path}`);
    }
    tarballs.push({ path, bytes: info.size });
  }
  return { result: 'pass', detail: { version: PACKAGE_VERSION, tarballs } };
}

async function legPackagedElement(runtime: LaneRuntime): Promise<LegOutcome> {
  const result = assertCommand(
    await runtime.runner(['deno', 'task', 'consumer:packaged-element']),
    'consumer:packaged-element',
  );
  // Non-vacuity: the proof prints one PASS line per launched browser engine;
  // all three must be present with their versions.
  const browsers = [...result.stdout.matchAll(/^PASS (chromium|firefox|webkit) ([^\s:]+):/gm)]
    .map((match) => ({ engine: match[1], version: match[2] }));
  for (const project of BROWSER_PROJECTS) {
    if (!browsers.some((browser) => browser.engine === project)) {
      throw new Error(`packagedElement: no ${project} proof line in the consumer output`);
    }
  }
  if (!result.stdout.includes('Router absent')) {
    throw new Error('packagedElement: the Router-absence assertion did not report');
  }
  return { result: 'pass', detail: { browsers, routerAbsent: true } };
}

function legRuntimeCi(needsJson: string): LegOutcome {
  let needs: Record<string, { result?: string }>;
  try {
    needs = JSON.parse(needsJson) as Record<string, { result?: string }>;
  } catch (error) {
    throw new Error(`runtime leg: NEEDS_JSON is not parseable: ${error}`);
  }
  const requireJob = (name: string): void => {
    const result = needs[name]?.result;
    if (result !== 'success') {
      throw new Error(`runtime leg: required job ${name} ended ${String(result)} on this SHA`);
    }
  };
  requireJob('node-serve-smoke');
  requireJob('bun-serve-smoke');
  requireJob('workspace-qualification');
  return {
    result: 'pass',
    detail: {
      node20Floor: { result: 'pass', source: 'job:node-serve-smoke (matrix node 20)' },
      node24: { result: 'pass', source: 'job:node-serve-smoke (matrix node 24)' },
      bun: { result: 'pass', source: 'job:bun-serve-smoke' },
      workerd: { result: 'pass', source: 'job:workspace-qualification' },
    },
  };
}

async function legRuntimeLocal(runtime: LaneRuntime): Promise<LegOutcome> {
  assertCommand(await runtime.runner(['deno', 'task', 'nitro:proof:node']), 'nitro:proof:node');
  assertCommand(
    await runtime.runner(['deno', 'task', 'nitro:proof:workers']),
    'nitro:proof:workers',
  );
  return {
    result: 'pass',
    detail: {
      nitroNode: { result: 'pass', source: 'local nitro:proof:node' },
      nitroWorkers: { result: 'pass', source: 'local nitro:proof:workers' },
      node20Floor: { result: 'not-verified-locally', source: 'CI job node-serve-smoke' },
      bun: { result: 'not-verified-locally', source: 'CI job bun-serve-smoke' },
    },
  };
}

// ---------------------------------------------------------------------------
// Lane
// ---------------------------------------------------------------------------

export const LEG_ORDER = [
  'urlPatternListRegistry',
  'versionSemantics',
  'router',
  'ssg',
  'navigation',
  'packagedStarter',
  'packagedUi',
  'packagedElement',
  'runtime',
] as const;

type LegName = typeof LEG_ORDER[number];

async function runLeg(
  name: LegName,
  runtime: LaneRuntime,
  ci: boolean,
): Promise<LegOutcome> {
  switch (name) {
    case 'urlPatternListRegistry':
      return await legUrlPatternListRegistry(runtime);
    case 'versionSemantics':
      return await denoTestLeg(runtime, 'versionSemantics', VERSION_TEST_FILES);
    case 'router':
      return await denoTestLeg(runtime, 'router', ROUTER_TEST_FILES);
    case 'ssg': {
      const unit = await denoTestLeg(runtime, 'ssg unit', SSG_TEST_FILES);
      const fixture = await legSsgFixture(runtime);
      return { result: 'pass', detail: { unit: unit.detail, requestTimeFixture: fixture.detail } };
    }
    case 'navigation':
      return await legNavigation(runtime);
    case 'packagedStarter': {
      const artifacts = await legPackagedArtifacts(runtime);
      assertCommand(
        await runtime.runner(['deno', 'task', 'consumer:packaged']),
        'consumer:packaged',
      );
      return { result: 'pass', detail: { ...artifacts.detail, consumer: 'consumer:packaged' } };
    }
    case 'packagedUi':
      assertCommand(
        await runtime.runner(['deno', 'task', 'consumer:packaged-ui']),
        'consumer:packaged-ui',
      );
      return { result: 'pass', detail: { consumer: 'consumer:packaged-ui' } };
    case 'packagedElement':
      return await legPackagedElement(runtime);
    case 'runtime':
      return ci
        ? await legRuntimeCi(Deno.env.get('NEEDS_JSON') ?? '')
        : await legRuntimeLocal(runtime);
  }
}

async function gitHead(): Promise<string> {
  const output = await new Deno.Command('git', {
    args: ['rev-parse', 'HEAD'],
    stdout: 'piped',
  }).output();
  if (output.code !== 0) throw new Error('git rev-parse HEAD failed');
  return new TextDecoder().decode(output.stdout).trim();
}

async function main(): Promise<void> {
  const onlyIndex = Deno.args.indexOf('--only');
  const only = onlyIndex === -1 ? undefined : Deno.args[onlyIndex + 1]?.split(',');
  const selected: readonly LegName[] = only
    ? LEG_ORDER.filter((leg) => only.includes(leg))
    : LEG_ORDER;
  if (only && selected.length === 0) throw new Error(`--only matched no legs: ${only}`);
  const ci = Deno.env.get('CI') === 'true';
  const log = (message: string) => console.log(`[beta21] ${message}`);

  const sha = await gitHead();
  if (ci) {
    const trusted = Deno.env.get('HEAD_SHA') ?? '';
    if (trusted !== sha) {
      throw new Error(`CI attestation mismatch: HEAD_SHA=${trusted} but checkout is ${sha}`);
    }
  }
  // The version under qualification is derived, never hardcoded: the admitted
  // checkpoint successor of the version the packages currently carry.
  const release = nextCheckpointVersion(PACKAGE_VERSION);
  log(`qualifying ${release} at ${sha} (tier: ${ci ? 'ci' : 'local'})`);

  const legs: Record<string, LegOutcome> = {};
  for (const name of selected) {
    log(`leg ${name} …`);
    legs[name] = await runLeg(name, { runner: defaultRunner, log }, ci);
    log(`leg ${name}: pass`);
  }

  if (only) {
    log(`--only subset run (${selected.join(', ')}); no artifact written`);
    return;
  }
  const artifact = buildQualificationArtifact(
    {
      sha,
      release,
      tier: ci ? 'ci' : 'local',
      repository: Deno.env.get('REPOSITORY') || undefined,
      runId: Number(Deno.env.get('RUN_ID')) || undefined,
      runAttempt: Number(Deno.env.get('RUN_ATTEMPT')) || undefined,
      url: Deno.env.get('RUN_URL') || undefined,
    },
    legs,
    LEG_ORDER,
  );
  await Deno.writeTextFile(QUALIFICATION_ARTIFACT, artifact);
  log(`wrote ${QUALIFICATION_ARTIFACT} (conclusion: pass, ${LEG_ORDER.length} legs)`);
}

if (import.meta.main) {
  try {
    await main();
  } catch (error) {
    console.error(
      `\n[beta21] QUALIFICATION FAILED: ${error instanceof Error ? error.message : error}`,
    );
    Deno.exit(1);
  }
}
