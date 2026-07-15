/**
 * ./index.ts - Route expansion
 *
 * Handles dynamic route rendering using getStaticPaths() + renderRoute()
 * from the SSR bundle, and i18n locale expansion.
 */

import { join } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import type { SsgPageOutput, SsgRenderEvidence, SsgRenderOptions } from '../protocol/ssg.ts';
import { createLogger } from '@openelement/element';
import { formatError } from '@openelement/element';
import { resolveDynamicRoutePath } from './ssg-helpers.ts';

const log = createLogger('ssg');

interface RouteInfoItem {
  path: string;
  tagName: string;
  isDynamic: boolean;
  paramNames: string[];
  revalidate?: number;
  params?: Record<string, string>;
}

type RenderRouteFn =
  | ((path: string, opts?: Record<string, unknown>) => Promise<SsgPageOutput>)
  | undefined;

type GetStaticPathsFn =
  | ((path: string) => Promise<Array<Record<string, string>>>)
  | undefined;

function pageHtml(output: SsgPageOutput | string): string {
  return typeof output === 'string' ? output : output.html;
}

async function writeRenderedPage(
  routePath: string,
  resolvedPath: string,
  params: Record<string, string>,
  renderRoute: NonNullable<RenderRouteFn>,
  options: SsgRenderOptions,
  root: string,
  outDir: string,
  locale?: string,
): Promise<void> {
  const targetPath = locale ? '/' + locale + '/' + resolvedPath.replace(/^\//, '') : resolvedPath;

  const renderOpts: Record<string, unknown> = {
    params,
    title: options.html?.title,
    headExtras: options.headExtras,
  };
  if (locale) {
    renderOpts.locale = locale;
    renderOpts.lang = locale;
  } else {
    renderOpts.lang = options.html?.lang;
  }

  const output = await renderRoute(routePath, renderOpts);
  const html = pageHtml(output);

  const pageDir = join(root, outDir, targetPath);
  mkdirSync(pageDir, { recursive: true });
  writeFileSync(join(pageDir, 'index.html'), html, 'utf-8');

  log.info(
    locale
      ? `i18n: ${targetPath}/index.html`
      : `Dynamic route: ${resolvedPath} -> ${resolvedPath}/index.html`,
  );
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
  renderRoute: RenderRouteFn,
  getStaticPaths: GetStaticPathsFn,
  options: SsgRenderOptions,
  root: string,
  outDir: string,
): Promise<Map<string, Array<Record<string, string>>>> {
  const staticPathParamsByRoute = new Map<string, Array<Record<string, string>>>();

  if (dynamicRoutes.length > 0 && renderRoute && getStaticPaths) {
    for (const route of dynamicRoutes) {
      let paramsList: Array<Record<string, string>>;
      try {
        paramsList = await getStaticPaths(route.path);
      } catch (e) {
        log.warn(`Failed to get static paths for ${route.path}: ${formatError(e)}`);
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
          resolvedPath = resolveDynamicRoutePath(route.path, route.paramNames, params);
        } catch (e) {
          log.warn(`Skipping unsafe dynamic route ${route.path}: ${formatError(e)}`);
          continue;
        }

        try {
          await writeRenderedPage(
            route.path,
            resolvedPath,
            params,
            renderRoute,
            options,
            root,
            outDir,
          );
        } catch (e) {
          log.warn(`Failed to render dynamic route ${resolvedPath}: ${formatError(e)}`);
        }
      }
    }
  }

  return staticPathParamsByRoute;
}

/**
 * Expand rendered pages for each locale when i18n is configured.
 *
 * For each locale and each route, re-renders the route with the locale
 * parameter and writes output under /{locale}/{path}/index.html.
 */
export async function expandI18nLocales(
  evidence: SsgRenderEvidence,
  renderRoute: RenderRouteFn,
  routeInfo: RouteInfoItem[],
  getStaticPaths: GetStaticPathsFn,
  options: SsgRenderOptions,
  root: string,
  outDir: string,
): Promise<void> {
  const i18nOpts = evidence.i18nOptions || null;
  if (!i18nOpts || !renderRoute) return;

  const locales: string[] = i18nOpts.locales || [];
  if (locales.length <= 1) return;

  log.info(`i18n: expanding for locales: ${locales.join(', ')}`);
  for (const locale of locales) {
    if (locale === i18nOpts.defaultLocale) continue;
    for (const route of routeInfo) {
      let paramsList: Array<Record<string, string>>;
      if (!route.isDynamic) {
        paramsList = [{}];
      } else if (getStaticPaths) {
        try {
          paramsList = await getStaticPaths(route.path);
        } catch {
          log.warn(`i18n: getStaticPaths failed for ${route.path}, skipping`);
          continue;
        }
      } else {
        continue;
      }
      if (paramsList.length === 0) continue;

      for (const params of paramsList) {
        let resolvedPath: string;
        try {
          resolvedPath = resolveDynamicRoutePath(route.path, route.paramNames, params);
        } catch (e) {
          log.warn(`i18n: skipping unsafe dynamic route ${route.path}: ${formatError(e)}`);
          continue;
        }

        const pathSegment = resolvedPath.split('/')[1] || '';
        if (locales.includes(pathSegment)) continue;

        try {
          await writeRenderedPage(
            route.path,
            resolvedPath,
            params,
            renderRoute,
            options,
            root,
            outDir,
            locale,
          );
        } catch (e) {
          log.warn(`i18n: failed for locale ${locale} on ${resolvedPath}: ${formatError(e)}`);
        }
      }
    }
  }
}
