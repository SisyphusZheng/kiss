/**
 * @openelement/ssg - i18n locale expansion
 *
 * Expands SSG output for each locale when i18n options are provided.
 * Renders each route for every locale and writes locale-prefixed output.
 */

import { join } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import type { SsgRenderOptions } from '@openelement/protocol/ssg-contracts';
import { createLogger } from '@openelement/core/logger';
import { formatError } from '@openelement/core/errors';
import type { SsgPageOutput, SsgRenderEvidence } from './ssg-render.ts';
import {
  collectPageOutput,
  joinUrlPath,
  type PageDiagnostic,
  resolveDynamicRoutePath,
} from './ssg-helpers.ts';

const log = createLogger('ssg');

interface RouteInfoItem {
  path: string;
  tagName: string;
  isDynamic: boolean;
  paramNames: string[];
  revalidate?: number;
}

/**
 * Expand rendered pages for each locale when i18n is configured.
 *
 * For each locale and each route, re-renders the route with the locale
 * parameter and writes output under /{locale}/{path}/index.html.
 */
export async function expandI18nLocales(
  evidence: SsgRenderEvidence,
  renderRoute:
    | ((path: string, opts?: Record<string, unknown>) => Promise<SsgPageOutput>)
    | undefined,
  routeInfo: RouteInfoItem[],
  getStaticPaths:
    | ((path: string) => Promise<Array<Record<string, string>>>)
    | undefined,
  options: SsgRenderOptions,
  root: string,
  outDir: string,
  pageDiagnostics: PageDiagnostic[],
): Promise<void> {
  const i18nOpts = evidence.i18nOptions || null;
  if (!i18nOpts || !renderRoute) return;

  const locales: string[] = i18nOpts.locales || [];
  if (locales.length <= 1) return;

  log.info(`i18n: expanding for locales: ${locales.join(', ')}`);
  for (const locale of locales) {
    for (const route of routeInfo) {
      let paramsList: Array<Record<string, string>>;
      if (!route.isDynamic) {
        paramsList = [{}];
      } else if (getStaticPaths) {
        try {
          paramsList = await getStaticPaths(route.path);
        } catch {
          log.warn(
            `i18n: getStaticPaths failed for ${route.path}, skipping`,
          );
          continue;
        }
      } else {
        continue;
      }
      if (paramsList.length === 0) continue;

      const paramNames = route.paramNames;
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
            `i18n: skipping unsafe dynamic route ${route.path}: ${formatError(e)}`,
          );
          continue;
        }
        const pathSegment = resolvedPath.split('/')[1] || '';
        if (locales.includes(pathSegment)) {
          continue;
        }
        const localePath = joinUrlPath(locale, resolvedPath);
        try {
          const output = await renderRoute(route.path, {
            params,
            locale,
            title: options.html?.title,
            lang: locale,
            headExtras: options.headExtras,
          });
          const html = collectPageOutput(localePath, output, pageDiagnostics);
          const outputDir = join(root, outDir);
          const pageDir = join(outputDir, localePath);
          mkdirSync(pageDir, { recursive: true });
          writeFileSync(join(pageDir, 'index.html'), html, 'utf-8');
          log.info(`i18n: ${localePath}/index.html`);
        } catch (e) {
          log.warn(
            `i18n: failed for locale ${locale} on ${resolvedPath}: ${formatError(e)}`,
          );
        }
      }
    }
  }
}
