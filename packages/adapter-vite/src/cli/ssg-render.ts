/**
 * SSG render evidence wiring for the adapter-vite build.
 *
 * build-ssg.ts delegates page rendering to the adapter-agnostic
 * internal/ssg pipeline and supplies the adapter-specific evidence
 * (build-manifest printing, sitemap generation) through this hook.
 */

import type { SsgRenderEvidence } from '../internal/protocol/ssg.ts';
import { printBuildManifest } from '../build-manifest.ts';
import type { OpenElementBuildContext } from '../build-context.ts';

export function createSsgRenderEvidence(
  ctx?: OpenElementBuildContext,
): SsgRenderEvidence {
  if (!ctx) return {};

  return {
    i18nOptions: ctx.plugins.i18nOptions,
    localIslandMeta: ctx.phase1.islandMeta,
    packageIslandDecls: ctx.phase1.packageIslandDecls,
    packageManifests: ctx.phase1.packageManifests,
    admissionDecisions: ctx.phase1.ssrAdmissionPlan?.decisions || [],
    cemClassifications: ctx.phase1.cemClassifications,
    onPrintBuildManifest: (input) => {
      printBuildManifest(input);
    },
    onGenerateSitemap: async (outputDir) => {
      if (!ctx.plugins.sitemapOptions) return;
      const { generateSitemap } = await import('../internal/content/sitemap/generator.ts') as {
        generateSitemap: (dir: string, opts: unknown) => string[];
      };
      generateSitemap(outputDir, ctx.plugins.sitemapOptions);
    },
  };
}
