/**
 * plugin.ts - Sitemap plugin
 *
 * Build-time Vite plugin that records sitemap options on the shared build
 * context so the SSG render step can call generateSitemap() after the dist/
 * directory has been produced.
 */

import type { Plugin } from 'vite';
import type { SitemapOptions } from '../types.ts';
import type { OpenElementBuildContextLike } from '../../protocol/framework.ts';
import { createLogger } from '@openelement/element';

const log = createLogger('content:sitemap');

export function createSitemapPlugin(
  options: SitemapOptions,
  ctx?: OpenElementBuildContextLike,
): Plugin {
  return {
    name: 'open:content:sitemap',

    buildStart() {
      if (ctx) {
        ctx.registerPlugin('sitemapOptions', options as unknown as Record<string, unknown>);
      }
      log.info(`Sitemap: configured for ${options.hostname}`);
    },
  };
}
