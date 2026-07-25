/**
 * Compatibility wrapper for the SSG render pipeline.
 *
 * The implementation is internal to adapter-vite in v0.40.x.
 * adapter-vite keeps this module so existing imports continue to work while
 * build orchestration uses the local SSG helpers.
 */

import { resolveDynamicRoutePath, ssgRender as ssgRenderCore } from '../internal/ssg/index.ts';
import type {
  SsgRenderEvidence,
  SsgRenderOptions,
  SsgRenderSummary,
  SsrBundle,
} from '../internal/protocol/ssg.ts';
import { printBuildManifest } from '../build-manifest.ts';
import type { OpenElementBuildContext } from '../build-context.ts';

export { resolveDynamicRoutePath };
export type {
  SsgPageOutput,
  SsgRenderEvidence,
  SsgRenderOptions,
  SsgRenderSummary,
  SsrBundle,
} from '../internal/protocol/ssg.ts';

export async function ssgRender(
  module: SsrBundle,
  options: SsgRenderOptions,
  ctx?: OpenElementBuildContext,
): Promise<SsgRenderSummary> {
  return await ssgRenderCore(module, options, createSsgRenderEvidence(ctx));
}

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
