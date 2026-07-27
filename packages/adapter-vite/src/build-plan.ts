import { join, relative } from 'node:path';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import type { BuildArtifacts, BuildPlan } from './internal/protocol/ssg.ts';
import type { OpenElementBuildContext } from './build-context.ts';
import { fsPathToModuleSpecifier } from './internal/ssg/module-specifier.ts';
import { resolveIslandHydrate } from './internal/ssg/island-scanner.ts';
import { formatJson } from '@openelement/element/build-utils';
import { DEFAULT_OUT_DIR, OPEN_ELEMENT_DIR } from './internal/paths.ts';

export function createProductionBuildPlan(ctx: OpenElementBuildContext): BuildPlan {
  const root = ctx.phase3.root;
  return {
    options: ctx.options,
    routes: ctx.phase1.cachedRoutes
      .filter((route) => route.type === 'page' || route.type === 'api')
      .map((route) => ({
        kind: route.type as 'page' | 'api',
        path: route.path,
        filePath: route.filePath,
        importPath: route.filePath,
        tagName: route.tagName,
        paramNames: route.params,
      })),
    islands: [
      ...ctx.phase1.islandTagNames.map((tagName, index) => ({
        tagName,
        // #460: join() emits drive-letter backslash paths on Windows; convert
        // to a Vite-resolvable specifier (root-relative or /@fs/).
        modulePath: fsPathToModuleSpecifier(
          join(root, ctx.phase3.islandsDir, ctx.phase1.islandFiles[index] ?? ''),
          root,
        ),
        hydrate: resolveIslandHydrate(
          ctx.phase1.islandMeta[tagName]?.hydrate,
          ctx.options.island?.upgradeStrategy,
        ),
        ssr: ctx.phase1.islandMeta[tagName]?.ssr,
        source: 'local' as const,
      })),
      ...ctx.phase1.packageIslandDecls.map((island) => ({
        tagName: island.tagName,
        modulePath: island.modulePath,
        hydrate: island.hydrate,
        ssr: island.ssr,
        source: 'package' as const,
      })),
    ],
    output: {
      root,
      outDir: ctx.phase3.outDir,
      base: ctx.phase3.base,
      spa: ctx.options.mode === 'spa',
    },
    i18n: ctx.plugins.i18nOptions
      ? {
        locales: ctx.plugins.i18nOptions.locales,
        defaultLocale: ctx.plugins.i18nOptions.defaultLocale,
      }
      : undefined,
    packageIslands: { packages: ctx.options.packageIslands ?? [] },
  };
}

function files(root: string): string[] {
  const result: string[] = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) result.push(...files(path));
    else result.push(path);
  }
  return result;
}

/**
 * Request-time route evidence for the build manifest, derived from the
 * emitted dist/server/server-manifest.json (0.42.0-alpha.1 / ADR-0120).
 * Returns {} for pure-static builds so their evidence shape is unchanged.
 */
function readRequestTimeRouteEvidence(outputDir: string): { requestTimeRoutes?: string[] } {
  try {
    const manifest = JSON.parse(
      readFileSync(join(outputDir, 'server', 'server-manifest.json'), 'utf8'),
    ) as { requestTimeRoutes?: Array<{ path?: unknown }> };
    const paths = (manifest.requestTimeRoutes ?? [])
      .map((route) => route.path)
      .filter((path): path is string => typeof path === 'string');
    return paths.length > 0 ? { requestTimeRoutes: paths } : {};
  } catch {
    return {};
  }
}

export function collectBuildArtifacts(plan: BuildPlan): BuildArtifacts {
  const root = plan.output.root ?? (typeof Deno !== 'undefined' ? Deno.cwd() : process.cwd());
  const outputDir = join(root, plan.output.outDir ?? DEFAULT_OUT_DIR);
  try {
    const emitted = files(outputDir);
    const pages = emitted.filter((path) => path.endsWith('.html')).map((path) => ({
      path: '/' +
        relative(outputDir, path).replaceAll('\\', '/').replace(/(?:\/index)?\.html$/, ''),
      html: readFileSync(path, 'utf8'),
      errors: [],
    }));
    const clientAssets = emitted.filter((path) => /\.(?:js|css)$/.test(path)).map((path) => ({
      fileName: relative(outputDir, path).replaceAll('\\', '/'),
      source: readFileSync(path),
      sizeBytes: statSync(path).size,
    }));
    return {
      pages,
      manifest: {
        routes: plan.routes.map((route) => ({
          kind: route.kind,
          path: route.path,
          tagName: route.tagName,
          isDynamic: (route.paramNames?.length ?? 0) > 0,
        })),
        islands: plan.islands,
        ...readRequestTimeRouteEvidence(outputDir),
      },
      clientAssets,
      warnings: [],
      errors: [],
      success: true,
    };
  } catch (error) {
    return {
      pages: [],
      manifest: { routes: [], islands: plan.islands },
      clientAssets: [],
      warnings: [],
      errors: [error instanceof Error ? error.message : String(error)],
      success: false,
    };
  }
}

export function writeBuildEvidence(plan: BuildPlan, artifacts: BuildArtifacts): void {
  const root = plan.output.root ?? (typeof Deno !== 'undefined' ? Deno.cwd() : process.cwd());
  const evidence = {
    success: artifacts.success,
    pages: artifacts.pages.map(({ path, errors }) => ({ path, errors })),
    manifest: artifacts.manifest,
    clientAssets: artifacts.clientAssets.map(({ fileName, sizeBytes }) => ({
      fileName,
      sizeBytes,
    })),
    warnings: artifacts.warnings,
    errors: artifacts.errors,
  };
  writeFileSync(
    join(root, OPEN_ELEMENT_DIR, 'build-artifacts.json'),
    formatJson(evidence),
  );
}
