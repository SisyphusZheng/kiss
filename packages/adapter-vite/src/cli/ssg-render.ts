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
import { generateSitemap } from '../internal/content/sitemap/generator.ts';
import type { SitemapOptions } from '../internal/content/types.ts';

export function createSsgRenderEvidence(
  ctx?: OpenElementBuildContext,
): SsgRenderEvidence {
  if (!ctx) return {};

  return {
    i18nOptions: ctx.plugins.i18nOptions,
    admissionDecisions: ctx.phase1.ssrAdmissionPlan?.decisions || [],
    onPrintBuildManifest: (input) => {
      printBuildManifest(input);
    },
    onGenerateSitemap: (outputDir) => {
      if (!ctx.plugins.sitemapOptions) return;
      generateSitemap(outputDir, ctx.plugins.sitemapOptions as unknown as SitemapOptions);
    },
  };
}
