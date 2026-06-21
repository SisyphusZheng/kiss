/**
 * @openelement/ssg - Dynamic route expansion
 *
 * Handles dynamic route rendering using getStaticPaths() + renderRoute()
 * from the SSR bundle.
 */

import { join } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import type { SsgRenderOptions } from '@openelement/ssg';
import { createLogger } from '@openelement/core/logger';
import { formatError } from '@openelement/core/errors';
import type { SsgPageOutput } from './ssg-render.ts';
import { collectPageOutput, type PageDiagnostic, resolveDynamicRoutePath } from './ssg-helpers.ts';

const log = createLogger('ssg');

interface RouteInfoItem {
  path: string;
  tagName: string;
  isDynamic: boolean;
  paramNames: string[];
  revalidate?: number;
  params?: Record<string, string>;
}

/**
 * Expand dynamic routes by calling getStaticPaths() and renderRoute()
 * for each parameter set.
 *
 * Returns a map of static path params keyed by route path, which is
 * consumed later when building the ISR manifest.
 */
export async function expandDynamicRoutes(
  dynamicRoutes: RouteInfoItem[],
  renderRoute:
    | ((path: string, opts?: Record<string, unknown>) => Promise<SsgPageOutput>)
    | undefined,
  getStaticPaths:
    | ((path: string) => Promise<Array<Record<string, string>>>)
    | undefined,
  options: SsgRenderOptions,
  root: string,
  outDir: string,
  pageDiagnostics: PageDiagnostic[],
): Promise<Map<string, Array<Record<string, string>>>> {
  const staticPathParamsByRoute = new Map<string, Array<Record<string, string>>>();

  if (dynamicRoutes.length > 0 && renderRoute && getStaticPaths) {
    for (const route of dynamicRoutes) {
      const paramNames = route.paramNames;
      let paramsList: Array<Record<string, string>>;

      try {
        paramsList = await getStaticPaths(route.path);
      } catch (e) {
        log.warn(
          `Failed to get static paths for ${route.path}: ${formatError(e)}`,
        );
        continue;
      }
      staticPathParamsByRoute.set(route.path, paramsList);

      if (paramsList.length === 0) {
        log.info(`Dynamic route ${route.path} has no static paths - skipping`);
        continue;
      }

      for (const params of paramsList) {
        let resolvedPath: string;
        try {
          resolvedPath = resolveDynamicRoutePath(
            route.path,
            paramNames,
            params,
          );
        } catch (e) {
          log.warn(
            `Skipping unsafe dynamic route ${route.path}: ${formatError(e)}`,
          );
          continue;
        }

        try {
          const output = await renderRoute(route.path, {
            params,
            title: options.html?.title,
            lang: options.html?.lang,
            headExtras: options.headExtras,
          });
          const html = collectPageOutput(resolvedPath, output, pageDiagnostics);

          const outputDir = join(root, outDir);
          const pageDir = join(outputDir, resolvedPath);
          mkdirSync(pageDir, { recursive: true });
          writeFileSync(join(pageDir, 'index.html'), html, 'utf-8');
          log.info(
            `Dynamic route: ${resolvedPath} -> ${resolvedPath}/index.html`,
          );
        } catch (e) {
          log.warn(
            `Failed to render dynamic route ${resolvedPath}: ${formatError(e)}`,
          );
        }
      }
    }
  }

  return staticPathParamsByRoute;
}
