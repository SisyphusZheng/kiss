/**
 * @openelement/ssg - Adapter-agnostic SSG engine.
 *
 * Provides parallel SSG rendering, entry code generation, route scanning,
 * island manifest generation, and HTML post-processing.
 *
 * This engine depends on protocol, core, router, and content — never on
 * Vite or adapter-vite. Build adapters (e.g. adapter-vite) delegate SSG
 * orchestration to this package.
 *
 * Architecture:
 *   - Sequential rendering (baseline): render pages one at a time
 *   - Parallel rendering (pool-based): render pages with concurrency limit
 *
 * @module @openelement/ssg
 */

export type {
  ClientIslandEntry,
  ExternalManifest,
  ParallelRenderOptions,
  ParallelRenderPageOutput,
  ParallelRenderResult,
  SsgIslandDeclForReport,
  SsgPageInput,
  SsgRenderOptions,
} from '@openelement/protocol/ssg-contracts';
import { formatError } from '@openelement/core/errors';

// ─── Sequential Renderer (baseline) ────────────────────────────

import type {
  ParallelRenderOptions,
  ParallelRenderPageOutput,
  ParallelRenderResult,
} from '@openelement/protocol/ssg-contracts';

/**
 * Render pages sequentially. Useful for debugging and as a
 * performance baseline.
 */
export async function renderSequential(
  options: ParallelRenderOptions,
): Promise<ParallelRenderResult> {
  const start = performance.now();
  const results: ParallelRenderPageOutput[] = [];

  for (const page of options.pages) {
    const pageStart = performance.now();
    try {
      const html = await options.renderPage(page);
      results.push({
        path: page.path,
        html,
        durationMs: Math.round(performance.now() - pageStart),
      });
    } catch (err) {
      results.push({
        path: page.path,
        html: '',
        durationMs: Math.round(performance.now() - pageStart),
        error: formatError(err),
      });
    }
  }

  return {
    pages: results,
    totalDurationMs: Math.round(performance.now() - start),
    successCount: results.filter((r) => !r.error).length,
    errorCount: results.filter((r) => !!r.error).length,
  };
}

// ─── Parallel Renderer (pool-based) ────────────────────────────

/**
 * Render pages in parallel using a concurrency-limited pool.
 *
 * This uses Promise-based concurrency (not Workers) for simplicity.
 * For CPU-heavy rendering, consider Worker-based parallelism.
 */
export async function renderParallel(
  options: ParallelRenderOptions,
): Promise<ParallelRenderResult> {
  const concurrency = options.concurrency ?? 4;
  const start = performance.now();
  const results: ParallelRenderPageOutput[] = [];

  // Split pages into batches of `concurrency` size
  for (let i = 0; i < options.pages.length; i += concurrency) {
    const batch = options.pages.slice(i, i + concurrency);

    const batchResults = await Promise.all(
      batch.map(async (page) => {
        const pageStart = performance.now();
        try {
          const html = await options.renderPage(page);
          return {
            path: page.path,
            html,
            durationMs: Math.round(performance.now() - pageStart),
          } as ParallelRenderPageOutput;
        } catch (err) {
          return {
            path: page.path,
            html: '',
            durationMs: Math.round(performance.now() - pageStart),
            error: formatError(err),
          } as ParallelRenderPageOutput;
        }
      }),
    );

    results.push(...batchResults);
  }

  return {
    pages: results,
    totalDurationMs: Math.round(performance.now() - start),
    successCount: results.filter((r) => !r.error).length,
    errorCount: results.filter((r) => !!r.error).length,
  };
}

export { resolveDynamicRoutePath, ssgRender } from './ssg-render.ts';
export type { SsgPageOutput, SsgRenderEvidence, SsrBundle } from './ssg-render.ts';
export {
  buildIslandChunkMap,
  buildSpeculationRulesJson,
  injectClientScript,
  injectCspMeta,
  injectDsdPolyfill,
  injectSpeculationRules,
  injectViewTransitionMeta,
  insertAfterHead,
} from './postprocess.ts';
export type { SpeculationRulesOptions } from './postprocess.ts';

export { generateSsrPolyfillBanner } from './ssr-polyfills.ts';
export {
  buildFallbackManifest,
  completeExternalSpecifiers,
  extractExternalSpecifiers,
  resolveExternalManifest,
  resolvePackageExports,
  walkExports,
} from './external-resolver.ts';

export {
  detectAndClassifyCemPackages,
  fileToTagName,
  scanCemManifests,
  scanIslandMeta,
  scanIslands,
  scanPackageManifests,
  scanRoutes,
} from './route-scanner.ts';

export { generateRouteTypes } from './route-type-generator.ts';

export { buildEntryDescriptor, buildSsrAdmissionPlan } from './entry-descriptor.ts';
export type {
  ApiRouteDecl,
  AppShellDecl,
  AppShellPlan,
  CorsOriginConfig,
  CspConfig,
  DocumentConfig,
  EntryDescriptor,
  ImportDecl,
  IslandDecl,
  MiddlewareDecl,
  MiddlewareScopeDecl,
  PageRouteDecl,
  RendererDecl,
  ResolvedAppShell,
  RouteDecl,
  SsrAdmissionPlan,
} from './entry-descriptor.ts';

export { generateHonoEntryCode, renderEntry } from './entry-renderer.ts';
export type { HonoEntryOptions } from './entry-renderer.ts';

export {
  extractCustomElementTags,
  generateIslandManifests,
  writeIslandManifests,
} from './island-manifest.ts';

export { stableHash } from './ssg-helpers.ts';
export type {
  IslandLayerMap,
  IslandManifestEntry,
  IslandStrategyMap,
  PageIslandManifest,
} from './island-manifest.ts';

export { generateClientEntry, validateClientIslandEntry } from './entry-generators.ts';
