/**
 * plugin.ts - Navigation plugin
 *
 * Build-time Vite plugin that scans route files for `meta` exports and writes
 * app/data/_generated-nav.ts and public/search-index.json.
 */

import type { Plugin } from 'vite';
import type { NavOptions } from '../types.ts';
import type { OpenElementBuildContextLike } from '../../protocol/framework.ts';
import type { FileSystemAdapter } from '../fs-adapter.ts';
import { nodeFsAdapter } from '../fs-adapter.ts';
import { scanNavData } from './scanner.ts';
import { writeNavModule, writeSearchIndex } from './writer.ts';
import { createLogger } from '@openelement/element';
import { join } from 'node:path';
import { DEFAULT_DATA_DIR, DEFAULT_ROUTES_DIR } from '../../paths.ts';

const log = createLogger('content:nav');

export function createNavPlugin(
  options: NavOptions,
  ctx?: OpenElementBuildContextLike,
  fs: FileSystemAdapter = nodeFsAdapter,
): Plugin {
  return {
    name: 'open:content:nav',

    async buildStart() {
      const resolvedNavOpts = {
        ...options,
        routesDir: options.routesDir ?? DEFAULT_ROUTES_DIR,
      };
      const navSections = await scanNavData(resolvedNavOpts);
      const headerNav = resolvedNavOpts.headerNav || [];
      if (ctx) {
        ctx.registerPlugin('navSections', navSections);
        ctx.registerPlugin('headerNav', headerNav);
      }

      // SOP-001: Write generated nav data module to disk.
      // Failing to write must fail the build: consumers import these files.
      const dataDir = join(fs.cwd(), DEFAULT_DATA_DIR);
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

      log.info(`Nav: ${navSections.length} section(s) configured`);
    },
  };
}
