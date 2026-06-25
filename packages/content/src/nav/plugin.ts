/**
 * @openelement/content - Navigation plugin
 *
 * Build-time Vite plugin that scans route files for `meta` exports and writes
 * app/data/_generated-nav.ts and public/search-index.json.
 */

import type { Plugin } from 'vite';
import type { NavOptions } from '../types.ts';
import type { OpenElementBuildContextLike } from '@openelement/protocol/framework';
import type { FileSystemAdapter } from '../fs-adapter.ts';
import { nodeFsAdapter } from '../fs-adapter.ts';
import { scanNavData } from './scanner.ts';
import { writeNavModule, writeSearchIndex } from './writer.ts';
import { createLogger } from '@openelement/core/logger';
import { formatError } from '@openelement/core/errors';
import { join } from 'node:path';

const log = createLogger('content:nav');

export function createNavPlugin(
  options: NavOptions,
  ctx?: OpenElementBuildContextLike,
  fs: FileSystemAdapter = nodeFsAdapter,
): Plugin {
  return {
    name: 'open:content:nav',

    buildStart() {
      const resolvedNavOpts = {
        ...options,
        routesDir: options.routesDir ?? 'app/routes',
      };
      const navSections = scanNavData(resolvedNavOpts);
      const headerNav = resolvedNavOpts.headerNav || [];
      if (ctx) {
        ctx.registerPlugin('navSections', navSections);
        ctx.registerPlugin('headerNav', headerNav);
      }

      // SOP-001: Write generated nav data module to disk
      try {
        const dataDir = join(fs.cwd(), 'app', 'data');
        fs.mkdirSync(dataDir, { recursive: true });
        const navModule = writeNavModule({ headerNav, navSections });
        fs.writeFileSync(join(dataDir, '_generated-nav.ts'), navModule, 'utf-8');
        log.info(`Nav: wrote _generated-nav.ts (${navSections.length} section(s))`);

        const publicDir = join(fs.cwd(), 'public');
        fs.mkdirSync(publicDir, { recursive: true });
        fs.writeFileSync(
          join(publicDir, 'search-index.json'),
          writeSearchIndex(navSections, headerNav),
          'utf-8',
        );
        log.info('Search: wrote search-index.json from route metadata');
      } catch (err) {
        log.warn(
          `Failed to write _generated-nav.ts: ${formatError(err)}`,
        );
      }

      log.info(`Nav: ${navSections.length} section(s) configured`);
    },
  };
}
