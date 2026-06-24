/**
 * @openelement/adapter-vite - SSG Report Integration Test
 *
 * Verifies that ssgRender produces a valid dsd-report.json
 * with correct shape, error counts, and metrics.
 *
 * v0.15.3: DSD report + release gate SOP.
 */

import { assert, assertEquals, assertExists, assertStringIncludes } from 'jsr:@std/assert@^1.0.0';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { Hono } from 'hono';
import { ssgRender } from '@openelement/ssg';
import { RenderError } from '@openelement/core';
import type {
  SsgPageOutput,
  SsgRenderEvidence,
  SsgRenderOptions,
  SsrBundle,
} from '@openelement/ssg';

const TEST_OUT_DIR = './dist-test-ssg-report';

function createMockBundle(overrides: Partial<SsrBundle> = {}): SsrBundle {
  const app = new Hono();
  app.get('/', (c) => c.text('ok'));
  return {
    default: app,
    routeInfo: [
      { path: '/', tagName: 'index-page', isDynamic: false, paramNames: [] },
    ],
    ...overrides,
  };
}

function readReport(dir: string): Record<string, unknown> {
  const reportPath = join(dir, 'dsd-report.json');
  assert(existsSync(reportPath), 'dsd-report.json should exist');
  return JSON.parse(readFileSync(reportPath, 'utf-8'));
}

const defaultOptions: SsgRenderOptions = {
  root: Deno.cwd(),
  outDir: TEST_OUT_DIR,
};

Deno.test('SSG report: dsd-report.json is produced after ssgRender', async (t) => {
  // Clean up before test
  if (existsSync(TEST_OUT_DIR)) {
    rmSync(TEST_OUT_DIR, { recursive: true, force: true });
  }

  const bundle = createMockBundle();
  await ssgRender(bundle, defaultOptions);

  await t.step('dsd-report.json exists in output directory', () => {
    const reportPath = join(TEST_OUT_DIR, 'dsd-report.json');
    assert(existsSync(reportPath), 'dsd-report.json should exist');
  });

  await t.step('report shape is valid with required fields', () => {
    const report = readReport(TEST_OUT_DIR);
    assertEquals(typeof report.reportVersion, 'string');
    assertEquals(typeof report.timestamp, 'string');
    assertEquals(typeof report.totalPages, 'number');
    assertEquals(typeof report.totalErrors, 'number');
    assert(Array.isArray(report.renderErrors));
    assertEquals(typeof report.metricsSummary, 'object');
    assertEquals(typeof report.hydrationHintSummary, 'object');
  });

  await t.step('report version is 1.2.0', () => {
    const report = readReport(TEST_OUT_DIR);
    assertEquals(report.reportVersion, '1.2.0');
  });

  await t.step('timestamp is valid ISO 8601', () => {
    const report = readReport(TEST_OUT_DIR);
    const ts = report.timestamp as string;
    assert(!isNaN(Date.parse(ts)), 'timestamp should be a valid ISO date');
  });

  await t.step('metricsSummary has required fields', () => {
    const report = readReport(TEST_OUT_DIR);
    const ms = report.metricsSummary as Record<string, unknown>;
    assertEquals(typeof ms.totalComponents, 'number');
    assertEquals(typeof ms.totalRenderTimeMs, 'number');
    assertEquals(typeof ms.avgRenderTimeMs, 'number');
    assertEquals(typeof ms.totalTemplateSize, 'number');
    assertEquals(typeof ms.maxNestingDepth, 'number');
    assertEquals(typeof ms.errorComponentCount, 'number');
  });

  await t.step('hydrationHintSummary has required fields', () => {
    const report = readReport(TEST_OUT_DIR);
    const hs = report.hydrationHintSummary as Record<string, unknown>;
    assertEquals(typeof hs.totalHints, 'number');
    assertEquals(typeof hs.interactiveCount, 'number');
    assertEquals(typeof hs.pureIslandCount, 'number');
  });

  await t.step('report is deterministic - no undefined or null values', () => {
    const report = readReport(TEST_OUT_DIR);
    const json = JSON.stringify(report);
    assertStringIncludes(json, '"reportVersion"');
    assertStringIncludes(json, '"timestamp"');
    assertStringIncludes(json, '"totalPages"');
    assertStringIncludes(json, '"totalErrors"');
    assertStringIncludes(json, '"metricsSummary"');
    assertStringIncludes(json, '"hydrationHintSummary"');
    // Ensure no undefined values leaked into JSON
    assertEquals(json.includes('undefined'), false);
  });

  // Clean up after test
  if (existsSync(TEST_OUT_DIR)) {
    rmSync(TEST_OUT_DIR, { recursive: true, force: true });
  }
});

Deno.test('SSG report: collects diagnostics from renderRoute', async (t) => {
  if (existsSync(TEST_OUT_DIR)) {
    rmSync(TEST_OUT_DIR, { recursive: true, force: true });
  }

  const renderError = new RenderError(
    'test-component',
    'test error',
    'LESS_RENDER_RENDER_FAILED',
    'test-el',
  );
  const mockOutput: SsgPageOutput = {
    html: '<html><body>dynamic page</body></html>',
    errors: [renderError],
    hydrationHints: [
      { tagName: 'test-el', layer: 'dsd-interactive' },
    ],
    componentCount: 1,
    renderTimeMs: 5.2,
  };

  const bundle = createMockBundle({
    routeInfo: [
      {
        path: '/blog/:slug',
        tagName: 'blog-page',
        isDynamic: true,
        paramNames: ['slug'],
      },
    ],
    renderRoute: (() => Promise.resolve(mockOutput)) as SsrBundle['renderRoute'],
    getStaticPaths: (() =>
      Promise.resolve([{ slug: 'hello-world' }])) as SsrBundle['getStaticPaths'],
  });

  await ssgRender(bundle, defaultOptions);

  await t.step('report captures page diagnostics from renderRoute', () => {
    const report = readReport(TEST_OUT_DIR);
    assertEquals(report.totalPages, 1);
    assertEquals(report.totalErrors, 1);
    const renderErrors = report.renderErrors as Array<Record<string, unknown>>;
    assertEquals(renderErrors.length, 1);
    assertEquals(renderErrors[0].path, '/blog/hello-world');
    assertEquals(renderErrors[0].componentCount, 1);
  });

  await t.step('error counts and metrics are not silently dropped', () => {
    const report = readReport(TEST_OUT_DIR);
    const ms = report.metricsSummary as Record<string, unknown>;
    assertEquals(ms.totalComponents, 1);
    assertEquals(ms.errorComponentCount, 1);
    const hs = report.hydrationHintSummary as Record<string, unknown>;
    assertEquals(hs.interactiveCount, 1);
    assertEquals(hs.totalHints, 1);
  });

  // Clean up
  if (existsSync(TEST_OUT_DIR)) {
    rmSync(TEST_OUT_DIR, { recursive: true, force: true });
  }
});

Deno.test('SSG report: handles string return from renderRoute (backward compat)', async () => {
  if (existsSync(TEST_OUT_DIR)) {
    rmSync(TEST_OUT_DIR, { recursive: true, force: true });
  }

  // Old-style renderRoute that returns just a string
  const bundle = createMockBundle({
    routeInfo: [
      {
        path: '/legacy/:id',
        tagName: 'legacy-page',
        isDynamic: true,
        paramNames: ['id'],
      },
    ],
    renderRoute: (() =>
      Promise.resolve('<html><body>legacy</body></html>')) as unknown as SsrBundle['renderRoute'],
    getStaticPaths: (() =>
      Promise.resolve([{ id: '1' }])) as SsrBundle['getStaticPaths'],
  });

  await ssgRender(bundle, defaultOptions);

  // Report should still exist with 0 page diagnostics
  // (string-only output doesn't contribute diagnostics)
  const report = readReport(TEST_OUT_DIR);
  assertEquals(typeof report.reportVersion, 'string');
  assertEquals(report.totalErrors, 0);

  // Clean up
  if (existsSync(TEST_OUT_DIR)) {
    rmSync(TEST_OUT_DIR, { recursive: true, force: true });
  }
});

// Section

Deno.test('SSG report: manifestDecisions is present (empty when no ctx)', async () => {
  if (existsSync(TEST_OUT_DIR)) {
    rmSync(TEST_OUT_DIR, { recursive: true, force: true });
  }

  const bundle = createMockBundle();
  // No ctx passed -> manifestDecisions should be empty array
  await ssgRender(bundle, defaultOptions);

  const report = readReport(TEST_OUT_DIR);
  assert(Array.isArray(report.manifestDecisions));
  assertEquals((report.manifestDecisions as unknown[]).length, 0);

  // Clean up
  if (existsSync(TEST_OUT_DIR)) {
    rmSync(TEST_OUT_DIR, { recursive: true, force: true });
  }
});

Deno.test('SSG report: manifestDecisions populated from ctx', async (t) => {
  if (existsSync(TEST_OUT_DIR)) {
    rmSync(TEST_OUT_DIR, { recursive: true, force: true });
  }

  // Create ctx with package island declarations
  const { OpenElementBuildContext } = await import('../src/build-context.js');
  const ctx = new OpenElementBuildContext({});
  ctx.phase1.packageManifests = [
    {
      schemaVersion: '1.0.0',
      packageName: '@openelement/ui',
      version: '0.17.2',
      declarations: [
        {
          tagName: 'open-layout',
          openElement: { module: '@openelement/ui/open-layout', hydrate: 'load', ssr: true },
        },
        {
          tagName: 'open-button',
          openElement: { module: '@openelement/ui/open-button', hydrate: 'idle', ssr: false },
        },
        { tagName: 'open-card', openElement: { module: '@openelement/ui/open-card' } }, // no ssr field -> default true
      ],
    },
  ];
  ctx.phase1.packageIslandDecls = [
    {
      tagName: 'open-layout',
      modulePath: '@openelement/ui/open-layout',
      isPackage: true,
      hydrate: 'load',
      ssr: true,
      dsd: true,
    },
    {
      tagName: 'open-button',
      modulePath: '@openelement/ui/open-button',
      isPackage: true,
      hydrate: 'idle',
      ssr: false,
      dsd: true,
    },
    {
      tagName: 'open-card',
      modulePath: '@openelement/ui/open-card',
      isPackage: true,
      hydrate: 'idle',
    }, // no ssr -> default true
  ];

  const bundle = createMockBundle();
  await ssgRender(bundle, defaultOptions, {
    packageManifests: ctx.phase1.packageManifests,
    packageIslandDecls: ctx.phase1.packageIslandDecls,
    cemClassifications: ctx.phase1.cemClassifications,
  } as SsgRenderEvidence);

  const report = readReport(TEST_OUT_DIR);
  const decisions = report.manifestDecisions as Array<Record<string, unknown>>;

  await t.step('has 3 decisions', () => {
    assertEquals(decisions.length, 3);
  });

  await t.step('package ssr:true is client-only before v0.18 admission', () => {
    const layout = decisions.find((d) => d.tagName === 'open-layout');
    assertExists(layout);
    assertEquals(layout.ssr, false);
    assertEquals(layout.dsd, true);
    assertEquals(layout.hydrate, 'load');
    assertEquals(layout.renderPath, 'client-only');
    assertEquals(layout.packageName, '@openelement/ui');
  });

  await t.step('ssr: false -> renderPath client-only', () => {
    const button = decisions.find((d) => d.tagName === 'open-button');
    assertExists(button);
    assertEquals(button.ssr, false);
    assertEquals(button.dsd, true);
    assertEquals(button.hydrate, 'idle');
    assertEquals(button.renderPath, 'client-only');
  });

  await t.step('undefined package ssr defaults to client-only', () => {
    const card = decisions.find((d) => d.tagName === 'open-card');
    assertExists(card);
    assertEquals(card.ssr, false);
    assertEquals(card.renderPath, 'client-only');
  });

  // Clean up
  if (existsSync(TEST_OUT_DIR)) {
    rmSync(TEST_OUT_DIR, { recursive: true, force: true });
  }
});

// Section

Deno.test('SSG report: cemCompatibility is absent when no CEM classifications', async () => {
  if (existsSync(TEST_OUT_DIR)) {
    rmSync(TEST_OUT_DIR, { recursive: true, force: true });
  }

  const bundle = createMockBundle();
  // No ctx -> no CEM classifications
  await ssgRender(bundle, defaultOptions);

  const report = readReport(TEST_OUT_DIR);
  // cemCompatibility should be undefined/absent when no CEM data
  assertEquals(report.cemCompatibility, undefined);

  if (existsSync(TEST_OUT_DIR)) {
    rmSync(TEST_OUT_DIR, { recursive: true, force: true });
  }
});

Deno.test('SSG report: cemCompatibility populated from ctx.phase1.cemClassifications', async (t) => {
  if (existsSync(TEST_OUT_DIR)) {
    rmSync(TEST_OUT_DIR, { recursive: true, force: true });
  }

  const { OpenElementBuildContext } = await import('../src/build-context.js');
  const ctx = new OpenElementBuildContext({});

  // Set up CEM classifications
  ctx.phase1.cemClassifications = [
    {
      tagName: 'ssr-button',
      tier: 'ssr-capable',
      reason: 'LitElement with ssr: true (openElement adapter required)',
      source: 'package',
      modulePath: './ssr-button.js',
      ssr: true,
      dsd: true,
      hydrate: 'load',
    },
    {
      tagName: 'client-button',
      tier: 'client-only',
      reason: 'CEM-only package (no openElement SSR declaration)',
      source: 'package',
      modulePath: './client-button.js',
      ssr: false,
      dsd: false,
      hydrate: 'idle',
    },
    {
      tagName: 'invalid-tag',
      tier: 'rejected',
      reason: 'Invalid tag name: invalid-tag (must contain a hyphen per HTML spec)',
      source: 'package',
      modulePath: './invalid.js',
      ssr: false,
      dsd: false,
    },
  ];

  const bundle = createMockBundle();
  await ssgRender(bundle, defaultOptions, {
    packageManifests: ctx.phase1.packageManifests,
    packageIslandDecls: ctx.phase1.packageIslandDecls,
    cemClassifications: ctx.phase1.cemClassifications,
  } as SsgRenderEvidence);

  const report = readReport(TEST_OUT_DIR);
  const cem = report.cemCompatibility as Record<string, unknown>;

  await t.step('cemCompatibility is present', () => {
    assertExists(cem);
  });

  await t.step('totalClassified is correct', () => {
    assertEquals(cem.totalClassified, 3);
  });

  await t.step('tier counts are correct', () => {
    assertEquals(cem.ssrCapableCount, 1);
    assertEquals(cem.clientOnlyCount, 1);
    assertEquals(cem.rejectedCount, 1);
    assertEquals(cem.experimentalDomCount, 0);
  });

  await t.step('classifications array is present', () => {
    assert(Array.isArray(cem.classifications));
    assertEquals((cem.classifications as unknown[]).length, 3);
  });

  await t.step('rejected tags appear first in classifications', () => {
    const classifications = cem.classifications as Array<Record<string, unknown>>;
    assertEquals(classifications[0].tier, 'rejected');
  });

  await t.step('summary is human-readable', () => {
    assertEquals(typeof cem.summary, 'string');
    assertStringIncludes(cem.summary as string, 'CEM:');
    assertStringIncludes(cem.summary as string, 'ssr-capable');
    assertStringIncludes(cem.summary as string, 'client-only');
    assertStringIncludes(cem.summary as string, 'rejected');
  });

  if (existsSync(TEST_OUT_DIR)) {
    rmSync(TEST_OUT_DIR, { recursive: true, force: true });
  }
});

Deno.test('SSG report: cemCompatibility with only ssr-capable components', async () => {
  if (existsSync(TEST_OUT_DIR)) {
    rmSync(TEST_OUT_DIR, { recursive: true, force: true });
  }

  const { OpenElementBuildContext } = await import('../src/build-context.js');
  const ctx = new OpenElementBuildContext({});

  ctx.phase1.cemClassifications = [
    {
      tagName: 'ssr-card',
      tier: 'ssr-capable',
      reason: 'LitElement with ssr: true',
      source: 'package',
      modulePath: './ssr-card.js',
      ssr: true,
      dsd: true,
    },
    {
      tagName: 'ssr-badge',
      tier: 'ssr-capable',
      reason: 'Custom element package declaration with ssr: true',
      source: 'package',
      modulePath: './ssr-badge.js',
      ssr: true,
      dsd: false,
    },
  ];

  const bundle = createMockBundle();
  await ssgRender(bundle, defaultOptions, {
    packageManifests: ctx.phase1.packageManifests,
    packageIslandDecls: ctx.phase1.packageIslandDecls,
    cemClassifications: ctx.phase1.cemClassifications,
  } as SsgRenderEvidence);

  const report = readReport(TEST_OUT_DIR);
  const cem = report.cemCompatibility as Record<string, unknown>;

  assertEquals(cem.totalClassified, 2);
  assertEquals(cem.ssrCapableCount, 2);
  assertEquals(cem.clientOnlyCount, 0);
  assertEquals(cem.rejectedCount, 0);
  assertStringIncludes(cem.summary as string, 'ssr-capable');

  if (existsSync(TEST_OUT_DIR)) {
    rmSync(TEST_OUT_DIR, { recursive: true, force: true });
  }
});

Deno.test('SSG report: reportVersion is 1.2.0 with hydration strategy summary', async () => {
  if (existsSync(TEST_OUT_DIR)) {
    rmSync(TEST_OUT_DIR, { recursive: true, force: true });
  }

  const bundle = createMockBundle();
  await ssgRender(bundle, defaultOptions);

  const report = readReport(TEST_OUT_DIR);
  assertEquals(report.reportVersion, '1.2.0');

  if (existsSync(TEST_OUT_DIR)) {
    rmSync(TEST_OUT_DIR, { recursive: true, force: true });
  }
});
