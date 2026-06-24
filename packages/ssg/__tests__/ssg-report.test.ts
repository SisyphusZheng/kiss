/**
 * @openelement/ssg - DSD report assembly tests
 *
 * Tests for assembleDsdReport, buildHydrationStrategySummary,
 * buildManifestDecisions, buildCemCompatibilityReport from ssg-report.ts
 */

import { assertEquals } from 'jsr:@std/assert@^1.0.0';
import {
  assembleDsdReport,
  buildCemCompatibilityReport,
  buildHydrationStrategySummary,
  buildManifestDecisions,
} from '../src/ssg-report.ts';
import type { PageDiagnostic } from '../src/ssg-helpers.ts';
import type { CompatibilityClassification, HydrationHint, RenderError } from '@openelement/core';

// Minimum viable admission decision for tests
function adm(
  tagName: string,
  renderPath: 'client-only' | 'ssr+client' | 'rejected',
  reason: string,
) {
  return { tagName, renderPath, reason, modulePath: '', source: 'package' as const };
}

// ─── buildHydrationStrategySummary ─────────────────────────────

Deno.test('buildHydrationStrategySummary empty evidence', () => {
  const summary = buildHydrationStrategySummary({});
  assertEquals(summary.load, 0);
  assertEquals(summary.idle, 0);
  assertEquals(summary.visible, 0);
  assertEquals(summary.only, 0);
  assertEquals(summary.clientOnlyExcluded, 0);
});

Deno.test('buildHydrationStrategySummary counts local island strategies', () => {
  const summary = buildHydrationStrategySummary({
    localIslandMeta: {
      'my-counter': { hydrate: 'load' },
      'lazy-image': { hydrate: 'visible' },
      'client-only-widget': { hydrate: 'only' },
    },
  });
  assertEquals(summary.load, 1);
  assertEquals(summary.visible, 1);
  assertEquals(summary.only, 1);
  assertEquals(summary.idle, 0);
});

Deno.test('buildHydrationStrategySummary counts package island strategies', () => {
  const summary = buildHydrationStrategySummary({
    packageIslandDecls: [
      { tagName: 'open-layout', hydrate: 'load' },
      { tagName: 'open-button', hydrate: 'idle' },
      { tagName: 'open-modal', hydrate: 'visible' },
    ],
  });
  assertEquals(summary.load, 1);
  assertEquals(summary.idle, 1);
  assertEquals(summary.visible, 1);
});

Deno.test('buildHydrationStrategySummary counts client-only exclusions', () => {
  const summary = buildHydrationStrategySummary({
    admissionDecisions: [adm('client-widget', 'client-only', 'ssr=false')],
    localIslandMeta: { 'client-widget': { hydrate: 'only' } },
  });
  assertEquals(summary.clientOnlyExcluded, 1);
  assertEquals(summary.only, 1);
});

// ─── buildManifestDecisions ────────────────────────────────────

Deno.test('buildManifestDecisions returns empty for no evidence', () => {
  const decisions = buildManifestDecisions({});
  assertEquals(decisions, []);
});

Deno.test('buildManifestDecisions returns empty for no manifests', () => {
  const decisions = buildManifestDecisions({
    packageIslandDecls: [{ tagName: 'open-button' }],
  });
  assertEquals(decisions, []);
});

Deno.test('buildManifestDecisions builds decisions from manifests', () => {
  const decisions = buildManifestDecisions({
    packageIslandDecls: [
      { tagName: 'open-layout', hydrate: 'load' },
      { tagName: 'open-button', hydrate: 'idle' },
    ],
    packageManifests: [
      {
        schemaVersion: '1.0.0',
        packageName: '@openelement/ui',
        version: '0.40.0',
        declarations: [
          {
            tagName: 'open-layout',
            className: 'OpenLayout',
            openElement: { module: '@openelement/ui/open-layout' },
          },
          {
            tagName: 'open-button',
            className: 'OpenButton',
            openElement: { module: '@openelement/ui/open-button' },
          },
        ],
      },
    ],
  });

  assertEquals(decisions.length, 2);
  assertEquals(decisions[0].tagName, 'open-layout');
  assertEquals(decisions[0].packageName, '@openelement/ui');
  assertEquals(decisions[0].source, 'package');
});

Deno.test('buildManifestDecisions resolves render path from admission', () => {
  const decisions = buildManifestDecisions({
    packageIslandDecls: [{ tagName: 'open-layout', hydrate: 'load' }],
    packageManifests: [
      {
        schemaVersion: '1.0.0',
        packageName: '@openelement/ui',
        version: '0.40.0',
        declarations: [
          {
            tagName: 'open-layout',
            className: 'OpenLayout',
            openElement: { module: '@openelement/ui/open-layout' },
          },
        ],
      },
    ],
    admissionDecisions: [adm('open-layout', 'ssr+client', 'ssr=true')],
  });

  assertEquals(decisions[0].ssr, true);
  assertEquals(decisions[0].renderPath, 'ssr+client');
  assertEquals(decisions[0].reason, 'ssr=true');
});

// ─── buildCemCompatibilityReport ───────────────────────────────

Deno.test('buildCemCompatibilityReport returns undefined for empty classifications', () => {
  const report = buildCemCompatibilityReport();
  assertEquals(report, undefined);
});

Deno.test('buildCemCompatibilityReport returns undefined for empty array', () => {
  const report = buildCemCompatibilityReport([]);
  assertEquals(report, undefined);
});

Deno.test('buildCemCompatibilityReport classifies components', () => {
  const report = buildCemCompatibilityReport([
    {
      tagName: 'sl-button',
      tier: 'ssr-capable',
      reason: 'has shadow dom',
      source: 'package',
    },
    {
      tagName: 'sl-dialog',
      tier: 'client-only',
      reason: 'uses document',
      source: 'package',
    },
  ] as CompatibilityClassification[]);

  assertEquals(report?.totalClassified, 2);
  assertEquals(report?.ssrCapableCount, 1);
  assertEquals(report?.clientOnlyCount, 1);
  assertEquals(report?.rejectedCount, 0);
  assertEquals(report?.summary, 'CEM: 1 ssr-capable, 1 client-only');
});

Deno.test('buildCemCompatibilityReport sorts rejected first', () => {
  const report = buildCemCompatibilityReport([
    { tagName: 'c1', tier: 'ssr-capable', reason: 'test', source: 'package' },
    {
      tagName: 'c2',
      tier: 'rejected',
      reason: 'unsafe',
      source: 'package',
    },
    { tagName: 'c3', tier: 'client-only', reason: 'test', source: 'package' },
  ] as CompatibilityClassification[]);

  assertEquals(report?.classifications[0].tier, 'rejected');
  assertEquals(report?.classifications[1].tier, 'ssr-capable');
  assertEquals(report?.classifications[2].tier, 'client-only');
  assertEquals(report?.rejectedCount, 1);
});

// ─── assembleDsdReport ─────────────────────────────────────────

Deno.test('assembleDsdReport produces a valid report', () => {
  const diagnostics: PageDiagnostic[] = [
    { path: '/', errors: [], hydrationHints: [], componentCount: 2, renderTimeMs: 10 },
    {
      path: '/about',
      errors: [],
      hydrationHints: [{
        tagName: 'my-counter',
        layer: 'dsd-interactive',
        hydrate: 'idle',
        sourceInfo: {},
      } as unknown as HydrationHint],
      componentCount: 1,
      renderTimeMs: 5,
    },
  ];

  const report = assembleDsdReport(diagnostics, {});

  assertEquals(report.reportVersion, '1.2.0');
  assertEquals(report.totalPages, 2);
  assertEquals(report.totalErrors, 0);
  assertEquals(report.metricsSummary.totalComponents, 3);
  assertEquals(report.metricsSummary.totalRenderTimeMs, 15);
  assertEquals(report.metricsSummary.errorComponentCount, 0);
  assertEquals(report.hydrationHintSummary.totalHints, 1);
  assertEquals(report.hydrationHintSummary.interactiveCount, 1);
});

Deno.test('assembleDsdReport counts errors', () => {
  const diagnostics: PageDiagnostic[] = [
    {
      path: '/fail',
      errors: [{
        tagName: 'bad-component',
        message: 'render failed',
        severity: 'error',
      }] as unknown as RenderError[],
      hydrationHints: [],
      componentCount: 0,
      renderTimeMs: 0,
    },
  ];

  const report = assembleDsdReport(diagnostics, {});

  assertEquals(report.totalErrors, 1);
  assertEquals(report.metricsSummary.errorComponentCount, 1);
  assertEquals(report.renderErrors.length, 1);
  assertEquals(report.renderErrors[0].path, '/fail');
});

Deno.test('assembleDsdReport includes cem compatibility', () => {
  const diagnostics: PageDiagnostic[] = [
    { path: '/', errors: [], hydrationHints: [], componentCount: 0, renderTimeMs: 0 },
  ];

  const report = assembleDsdReport(diagnostics, {
    cemClassifications: [
      {
        packageName: 'pkg',
        componentName: 'c1',
        tier: 'ssr-capable',
        confidence: 0.9,
        reasons: [],
      },
    ] as unknown as CompatibilityClassification[],
  });

  assertEquals(report.cemCompatibility?.totalClassified, 1);
  assertEquals(report.cemCompatibility?.ssrCapableCount, 1);
});

Deno.test('assembleDsdReport includes admission decisions', () => {
  const diagnostics: PageDiagnostic[] = [
    { path: '/', errors: [], hydrationHints: [], componentCount: 0, renderTimeMs: 0 },
  ];

  const report = assembleDsdReport(diagnostics, {
    admissionDecisions: [adm('my-counter', 'ssr+client', 'ssr=true')],
  });

  assertEquals(report.admissionDecisions!.length, 1);
  assertEquals(report.admissionDecisions![0].tagName, 'my-counter');
});
