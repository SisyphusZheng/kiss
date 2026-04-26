/**
 * @kissjs/ui - Web Awesome CDN injection plugin
 *
 * Usage:
 * ```ts
 * // vite.config.ts
 * import { kissUI } from '@kissjs/ui'
 *
 * export default defineConfig({
 *   plugins: [kissUI()]
 * })
 * ```
 */

import type { Plugin } from 'vite';

export interface KissUIOptions {
  /**
   * Web Awesome version (default: '3.5.0')
   */
  version?: string;

  /**
   * Use CDN (default: true)
   * Set to false to use npm package instead
   */
  cdn?: boolean;
}

/**
 * KISS UI Plugin - Injects Web Awesome CDN links
 */
export function kissUI(options: KissUIOptions = {}): Plugin {
  const { version = '3.5.0', cdn = true } = options;

  return {
    name: 'kiss:ui',

    transformIndexHtml(html) {
      if (!cdn) return html;

      const cdnBase = 'https://ka-f.webawesome.com/webawesome@' + version;

      return [
        {
          tag: 'link',
          injectTo: 'head-prepend',
          attrs: {
            rel: 'stylesheet',
            href: cdnBase + '/styles/webawesome.css',
          },
        },
        {
          tag: 'script',
          injectTo: 'head-prepend',
          attrs: {
            type: 'module',
            src: cdnBase + '/webawesome.loader.js',
          },
        },
      ];
    },
  };
}