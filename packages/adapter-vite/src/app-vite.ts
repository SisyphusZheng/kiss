/**
 * @openelement/adapter-vite - Unified openElement Vite plugin entry.
 *
 * Kept separate from the route authoring API so application routes can import
 * @openelement/app without loading Vite/build orchestration.
 */

import type { Plugin } from 'vite';
import type { FrameworkOptions } from '@openelement/protocol/framework';
import type { OpenElementContentOptions } from '@openelement/content';
import type { OpenElementI18nOptions } from '@openelement/app/i18n';

import { OpenElementBuildContext } from './build-context.ts';
import { createOpenPlugin } from './plugin.ts';
import { openContent } from '@openelement/content';
import { openI18n } from './i18n-plugin.ts';
import { createLogger } from '@openelement/core/logger';

const log = createLogger('app');

/** Options for the openElement() unified Vite entry. */
export interface OpenElementOptions extends FrameworkOptions {
  /** Content module options (blog + nav + sitemap). Omit to disable. */
  content?: OpenElementContentOptions;
  /** i18n module options. Omit to disable. */
  i18n?: OpenElementI18nOptions;
}

export function openElement(options: OpenElementOptions = {}): Plugin[] {
  const { content: contentOpts, i18n: i18nOpts, ...coreOpts } = options;
  const ctx = new OpenElementBuildContext({
    ...coreOpts,
    routesDir: coreOpts.routesDir || 'app/routes',
    islandsDir: coreOpts.islandsDir || 'app/islands',
    componentsDir: coreOpts.componentsDir || 'app/components',
  });

  const plugins: Plugin[] = [...createOpenPlugin(coreOpts, ctx)];

  if (i18nOpts) {
    plugins.push(openI18n({ ...i18nOpts, ctx }));
    log.info('i18n plugin loaded');
  }

  if (contentOpts) {
    plugins.push(...openContent({ ...contentOpts, ctx }));
    log.info('Content plugin loaded');
  }

  return plugins;
}

export default openElement;
