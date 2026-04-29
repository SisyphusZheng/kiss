/**
 * @kissjs/ui — Vite plugin for Web Awesome CDN injection (convenience only)
 *
 * **This is an OPTIONAL convenience plugin**, not part of the KISS core architecture.
 * It exists solely for users who want a one-liner Web Awesome setup.
 *
 * The KISS-recommended approach is to use `kiss({ inject: { stylesheets: [...], scripts: [...] } })`
 * from @kissjs/core, which gives full control over headFragments ordering and works
 * with any CSS framework (not just Web Awesome).
 *
 * This plugin is intentionally NOT used by the KISS docs site itself —
 * the docs use kiss() with inject option directly.
 *
 * Usage:
 * ```ts
 * // vite.config.ts
 * import { kissUI } from '@kissjs/ui'
 *
 * export default defineConfig({
 *   plugins: [kissUI()]  // One-liner Web Awesome CDN
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
