/**
 * @openelement/ssg - DSD report assembly
 *
 * Builds the dsd-report.json contents from render diagnostics,
 * hydration strategy summary, manifest decisions, and CEM
 * compatibility classifications.
 */

import { join } from 'node:path';
import { writeFileSync } from 'node:fs';
import { createLogger } from '@openelement/core/logger';
import type { CemCompatibilityReport } from '@openelement/protocol/manifest';
import type { CompatibilityClassification } from '@openelement/protocol/framework';
import type {
  DsdBuildReport,
  DsdHydrationStrategySummary,
  ManifestDecision,
} from '@openelement/protocol/render';
import type { SsgRenderEvidence } from '@openelement/protocol/ssg';
import type { PageDiagnostic } from './ssg-helpers.ts';

const log = createLogger('ssg');

// ─── Hydration Strategy Summary ────────────────────────────────

/**
 * Build a summary of hydration strategies used across all components.
 */
export function buildHydrationStrategySummary(
  evidence: SsgRenderEvidence,
): DsdHydrationStrategySummary {
  const summary: DsdHydrationStrategySummary = {
    load: 0,
    idle: 0,
    visible: 0,
    only: 0,
    clientOnlyExcluded: 0,
  };
  const decisions = evidence.admissionDecisions || [];
  const localMeta = evidence.localIslandMeta || {};

  for (const meta of Object.values(localMeta)) {
    const strategy = meta.hydrate || 'idle';
    if (strategy in summary) {
      summary[strategy as keyof typeof summary]++;
    }
  }
  for (const decl of evidence.packageIslandDecls || []) {
    const strategy = decl.hydrate || 'idle';
    if (strategy in summary) {
      summary[strategy as keyof typeof summary]++;
    }
  }
  summary.clientOnlyExcluded = decisions.filter((d) => d.renderPath === 'client-only').length;
  return summary;
}

// ─── Manifest Decisions Builder (v0.17.2) ───────────────────────

/**
 * Build manifest-driven render decisions from ctx.
 *
 * For each package island declaration, records how the pipeline resolved
 * manifest flags (ssr, dsd, hydrate) into a concrete render path:
 * - 'ssr+client': component is SSR-rendered + client-upgraded
 * - 'client-only': component is client-only (ssr === false)
 *
 * When ctx or packageIslandDecls is absent, returns an empty array.
 */
export function buildManifestDecisions(
  evidence: SsgRenderEvidence,
): ManifestDecision[] {
  const decls = evidence.packageIslandDecls;
  const manifests = evidence.packageManifests;
  if (!decls?.length || !manifests?.length) return [];

  // Build a tagName -> packageName lookup from manifests
  const tagNameToPackage = new Map<string, string>();
  for (const pkg of manifests) {
    for (const decl of pkg.declarations) {
      tagNameToPackage.set(decl.tagName, pkg.packageName);
    }
  }

  return decls.map((island) => {
    const admission = evidence.admissionDecisions?.find(
      (d) => d.tagName === island.tagName,
    );
    const ssr = admission?.renderPath === 'ssr+client';
    const dsd = island.dsd !== false; // default: true
    const renderPath: ManifestDecision['renderPath'] = ssr ? 'ssr+client' : 'client-only';

    return {
      tagName: island.tagName,
      packageName: tagNameToPackage.get(island.tagName) || 'unknown',
      ssr,
      dsd,
      hydrate: island.hydrate,
      renderPath,
      reason: admission?.reason,
      source: 'package',
    };
  });
}

// ─── CEM Compatibility Report Builder (v0.18.0) ─────────────────

/**
 * Build a CEM compatibility report from CEM classifications.
 *
 * Summarizes how the compatibility classifier classified each third-party
 * WC package component into a tier (ssr-capable, client-only, rejected,
 * experimental-dom). Written to dsd-report.json for CI assertion.
 *
 * Returns undefined when no CEM classifications exist.
 */
export function buildCemCompatibilityReport(
  classifications?: CompatibilityClassification[],
): CemCompatibilityReport | undefined {
  if (!classifications?.length) return undefined;

  const ssrCapableCount = classifications.filter((c) => c.tier === 'ssr-capable').length;
  const clientOnlyCount = classifications.filter((c) => c.tier === 'client-only').length;
  const rejectedCount = classifications.filter((c) => c.tier === 'rejected').length;
  const experimentalDomCount = classifications.filter((c) => c.tier === 'experimental-dom').length;

  // Order: rejected first (most critical), then ssr-capable, client-only, experimental-dom
  const sortedClassifications = [...classifications].sort((a, b) => {
    const tierOrder = {
      rejected: 0,
      'ssr-capable': 1,
      'client-only': 2,
      'experimental-dom': 3,
    };
    return (tierOrder[a.tier] ?? 99) - (tierOrder[b.tier] ?? 99);
  });

  const summaryParts: string[] = [];
  if (ssrCapableCount > 0) summaryParts.push(`${ssrCapableCount} ssr-capable`);
  if (clientOnlyCount > 0) summaryParts.push(`${clientOnlyCount} client-only`);
  if (rejectedCount > 0) summaryParts.push(`${rejectedCount} rejected`);
  if (experimentalDomCount > 0) summaryParts.push(`${experimentalDomCount} experimental-dom`);

  return {
    totalClassified: classifications.length,
    ssrCapableCount,
    clientOnlyCount,
    rejectedCount,
    experimentalDomCount,
    classifications: sortedClassifications,
    summary: summaryParts.length > 0
      ? `CEM: ${summaryParts.join(', ')}`
      : 'CEM: no components classified',
  };
}

// ─── Report Assembly ────────────────────────────────────────────

/**
 * Assemble the full dsd-report.json object from page diagnostics and evidence.
 */
export function assembleDsdReport(
  pageDiagnostics: PageDiagnostic[],
  evidence: SsgRenderEvidence,
): DsdBuildReport {
  const totalErrors = pageDiagnostics.reduce(
    (sum, p) => sum + p.errors.length,
    0,
  );
  const totalComponents = pageDiagnostics.reduce(
    (sum, p) => sum + p.componentCount,
    0,
  );
  const totalRenderTimeMs = pageDiagnostics.reduce(
    (sum, p) => sum + p.renderTimeMs,
    0,
  );
  const totalTemplateSize = pageDiagnostics.reduce(
    (sum, p) => sum + p.hydrationHints.length,
    0,
  );
  const errorComponentCount = pageDiagnostics.filter(
    (p) => p.errors.length > 0,
  ).length;
  const maxNestingDepth = 0; // Determined from collector, not per-page
  const interactiveCount = pageDiagnostics.reduce(
    (sum, p) => sum + p.hydrationHints.filter((h) => h.layer === 'dsd-interactive').length,
    0,
  );
  const pureIslandCount = pageDiagnostics.reduce(
    (sum, p) => sum + p.hydrationHints.filter((h) => h.layer === 'pure-island').length,
    0,
  );
  const totalHints = pageDiagnostics.reduce(
    (sum, p) => sum + p.hydrationHints.length,
    0,
  );
  const strategySummary = buildHydrationStrategySummary(evidence);

  return {
    reportVersion: '1.2.0',
    timestamp: new Date().toISOString(),
    totalPages: pageDiagnostics.length,
    totalErrors,
    renderErrors: pageDiagnostics.map((p) => ({
      path: p.path,
      errors: p.errors,
      hydrationHints: p.hydrationHints,
      componentCount: p.componentCount,
      renderTimeMs: p.renderTimeMs,
    })),
    metricsSummary: {
      totalComponents,
      totalRenderTimeMs,
      avgRenderTimeMs: totalComponents > 0
        ? Math.round(totalRenderTimeMs / totalComponents * 100) / 100
        : 0,
      totalTemplateSize,
      maxNestingDepth,
      errorComponentCount,
    },
    hydrationHintSummary: {
      totalHints,
      interactiveCount,
      pureIslandCount,
    },
    hydrationStrategySummary: strategySummary,
    manifestDecisions: buildManifestDecisions(evidence),
    admissionDecisions: evidence.admissionDecisions || [],
    cemCompatibility: buildCemCompatibilityReport(
      evidence.cemClassifications,
    ),
  };
}

/**
 * Write the DSD report to the output directory.
 */
export function writeDsdReport(
  outputDir: string,
  report: DsdBuildReport,
): void {
  const reportPath = join(outputDir, 'dsd-report.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
  log.info(
    `DSD report -> ${reportPath} (${report.totalPages} pages, ${report.totalErrors} errors)`,
  );
}
