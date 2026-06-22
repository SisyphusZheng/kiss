/**
 * Compatibility wrapper for the SSG render pipeline.
 *
 * The implementation is internal to adapter-vite in v0.40.x.
 * adapter-vite keeps this module so existing imports continue to work while
 * build orchestration uses the local SSG helpers.
 */

import { resolveDynamicRoutePath, ssgRender as ssgRenderCore } from '@openelement/ssg';
import type { SsgRenderEvidence, SsgRenderOptions, SsrBundle } from '@openelement/protocol/ssg';
import { printBuildManifest } from '../build-manifest.js';
import type { OpenElementBuildContext } from '../build-context.js';

export { resolveDynamicRoutePath };
export type {
  SsgPageOutput,
  SsgRenderEvidence,
  SsgRenderOptions,
  SsrBundle,
} from '@openelement/protocol/ssg';

export async function ssgRender(
  module: SsrBundle,
  options: SsgRenderOptions,
  ctx?: OpenElementBuildContext,
): Promise<void> {
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
      const { generateSitemap } = await import('@openelement/content/sitemap') as {
        generateSitemap: (dir: string, opts: unknown) => string[];
      };
      generateSitemap(outputDir, ctx.plugins.sitemapOptions);
    },
  };
}
