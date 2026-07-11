/**
 * adapter-vite internal SSG render pipeline (ADR 0022).
 *
 * Shared SSG rendering logic used by both:
 *   - build-ssg.ts (Vite inline mode, called from closeBundle)
 *   - ssg.ts (standalone CLI, loads SSR bundle via importmap)
 *
 * This module has zero Vite dependency - it only needs the SSR bundle module.
 *
 * Thin orchestrator that imports focused sub-modules for:
 *   - Dynamic route expansion (ssg-dynamic.ts)
 *   - i18n locale expansion (ssg-dynamic.ts)
 *   - Utility helpers (ssg-helpers.ts)
 */

import { join } from 'node:path';
import { cwd } from 'node:process';
import { existsSync, mkdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import type {
  SsgPageOutput,
  SsgRenderEvidence,
  SsgRenderOptions,
  SsrBundle,
} from '@openelement/protocol/ssg';
import { createLogger } from '@openelement/core/logger';
import { expandDynamicRoutes, expandI18nLocales } from './ssg-dynamic.ts';
import { buildIsrManifestEntries, findHtmlFiles } from './ssg-helpers.ts';
import { formatJson } from '@openelement/core/write-json';

const log = createLogger('ssg');

// ─── Core render pipeline ──────────────────────────────────────

export async function ssgRender(
  module: SsrBundle,
  options: SsgRenderOptions,
  evidence: SsgRenderEvidence = {},
): Promise<void> {
  const root = options.root || cwd();
  const outDir = options.outDir || 'dist';
  const basePath = options.base || '/';

  // ── Dynamic route expansion via bundle.getStaticPaths() ──────
  const routeInfo = (module.routeInfo ?? []) as Array<{
    path: string;
    tagName: string;
    isDynamic: boolean;
    paramNames: string[];
    revalidate?: number;
  }>;
  if (!module.routeInfo || !Array.isArray(module.routeInfo)) {
    throw new Error(
      'SSR bundle does not export routeInfo; SSG cannot generate routes.',
    );
  }
  const renderRoute = module.renderRoute as
    | ((path: string, opts?: Record<string, unknown>) => Promise<SsgPageOutput>)
    | undefined;
  const getStaticPaths = module.getStaticPaths as
    | ((path: string) => Promise<Array<Record<string, string>>>)
    | undefined;

  if (routeInfo.length === 0) {
    throw new Error(
      '[openElement] SSG failed: routeInfo is empty. No routes were exported by the SSR bundle.',
    );
  }

  const dynamicRoutes = routeInfo.filter((r) => r.isDynamic);
  log.info(
    `Routes: ${routeInfo.length} total` +
      (dynamicRoutes.length > 0
        ? ` (${dynamicRoutes.length} dynamic: ${dynamicRoutes.map((r) => r.path).join(', ')})`
        : ''),
  );

  const staticPathParamsByRoute = await expandDynamicRoutes(
    dynamicRoutes,
    renderRoute,
    getStaticPaths,
    options,
    root,
    outDir,
  );

  // ── Main SSG via Hono's toSSG() ────────────────────────────
  const { toSSG } = await import('hono/ssg');
  const nodeFs = await import('node:fs/promises');
  const nodePath = await import('node:path');

  const fsModule = {
    writeFile: async (path: string, data: string | Uint8Array) => {
      const dir = nodePath.dirname(path);
      await nodeFs.mkdir(dir, { recursive: true }).catch(() => {});
      await nodeFs.writeFile(path, data);
    },
    mkdir: async (path: string) => {
      await nodeFs.mkdir(path, { recursive: true }).catch(() => {});
    },
    isDirectory: async (path: string) => {
      try {
        return (await nodeFs.stat(path)).isDirectory();
      } catch {
        return false;
      }
    },
  };

  const outputDir = join(root, outDir);
  const app = module.default as
    | { fetch: (req: Request, ...args: unknown[]) => Promise<Response> }
    | undefined;
  if (!app) {
    throw new Error(
      'SSR bundle loaded but no Hono app found (no default export)',
    );
  }

  const result = await toSSG(app as never, fsModule, { dir: outputDir });

  if (!result.success) throw result.error;

  const isrRoutes = buildIsrManifestEntries(routeInfo, staticPathParamsByRoute);
  if (isrRoutes.length > 0) {
    writeFileSync(
      join(outputDir, 'isr-manifest.json'),
      formatJson(isrRoutes),
      'utf-8',
    );
    log.info(
      `ISR manifest -> ${join(outputDir, 'isr-manifest.json')} (${isrRoutes.length} route(s))`,
    );
  }

  // ── Post-processing ─────────────────────────────────────────

  // Rename 404/index.html -> 404.html for GitHub Pages
  const _404Dir = join(outputDir, '404');
  const _404Html = join(outputDir, '404.html');
  const _404Index = join(_404Dir, 'index.html');
  if (existsSync(_404Index)) {
    if (existsSync(_404Html)) {
      log.warn(
        '404.html already exists in output dir - removing before rename',
      );
      rmSync(_404Html, { force: true });
    }
    renameSync(_404Index, _404Html);
    if (existsSync(_404Dir)) {
      rmSync(_404Dir, { recursive: true, force: true });
    }
    log.info('404 page -> dist/404.html (GitHub Pages)');
  }

  // Convert flat HTML files to clean URLs: about.html -> about/index.html
  const allHtmlFiles = findHtmlFiles(outputDir);
  for (const filePath of allHtmlFiles) {
    const rel = nodePath.relative(outputDir, filePath);
    if (rel.endsWith('index.html') || rel === '404.html') continue;
    const baseName = rel.replace(/\.html$/, '');
    const urlBaseName = baseName.replace(/\\/g, '/');
    const dirPath = join(outputDir, baseName);
    const indexPath = join(dirPath, 'index.html');
    if (existsSync(dirPath)) continue;
    mkdirSync(dirPath, { recursive: true });
    renameSync(filePath, indexPath);
    log.info(`Clean URL: /${urlBaseName} -> ${urlBaseName}/index.html`);
  }

  log.info(`Static site generated -> ${outputDir}`);

  // ── i18n locale expansion (if ctx available) ────────────────
  await expandI18nLocales(
    evidence,
    renderRoute,
    routeInfo,
    getStaticPaths,
    options,
    root,
    outDir,
  );

  // ── Post-processing modules ─────────────────────────────────
  const {
    buildIslandChunkMap,
    injectCspMeta,
    injectDsdPolyfill,
    injectViewTransitionMeta,
    injectSpeculationRules,
    buildSpeculationRulesJson,
  } = await import('./postprocess.ts');

  const islandTagNames = options.islandTagNames || [];
  const _islandChunkMap = buildIslandChunkMap(
    root,
    outDir,
    islandTagNames,
    basePath,
  );

  if (options.viewTransition !== false) {
    injectViewTransitionMeta(outputDir);
    log.info('View Transitions meta tag injected');
  }

  if (options.speculation) {
    const specOpts = typeof options.speculation === 'boolean'
      ? {}
      : (options.speculation as Record<string, unknown>);
    const rulesJson = buildSpeculationRulesJson(
      specOpts,
      routeInfo.map((r) => ({ path: r.path, type: 'page' as const })),
    );
    if (rulesJson) {
      injectSpeculationRules(outputDir, rulesJson);
      log.info('Speculation Rules injected');
    }
  }

  const cspPolicy = options.middleware?.csp?.policy;
  if (cspPolicy) {
    injectCspMeta(
      outputDir,
      cspPolicy,
      options.middleware?.csp?.reportOnly || false,
      options.middleware?.csp?.nonce || false,
    );
    log.info('CSP meta tag injected');
  }

  if (options.legacyDsdPolyfill) {
    injectDsdPolyfill(outputDir);
    log.warn('Legacy DSD fallback injected; it requires an explicit CSP exception.');
  }

  // ── Sitemap (via ctx) ──────────────────────────────────────
  await evidence.onPrintBuildManifest?.({
    root,
    outDir,
    phase: 3,
    headExtras: options.headExtras,
  });

  try {
    await evidence.onGenerateSitemap?.(join(root, outDir));
  } catch {
    log.debug('Sitemap generation skipped or failed');
  }
}

// Re-export resolveDynamicRoutePath for consumers who import from ssg-render.ts
export { resolveDynamicRoutePath } from './ssg-helpers.ts';
