/**
 * plugin.ts - Blog plugin
 *
 * Build-time Vite plugin that loads blog data and writes the generated
 * blog-data module to app/data/_generated-blog-data.ts.
 */

import type { Plugin, ViteDevServer } from 'vite';
import type { OpenElementBlogOptions } from './types.ts';
import type { OpenElementBuildContextLike } from '../../protocol/framework.ts';
import type { FileSystemAdapter } from '../fs-adapter.ts';
import { nodeFsAdapter } from '../fs-adapter.ts';
import { loadBlogData, writeBlogDataModule } from './blog-data.ts';
import { createLogger } from '@openelement/element';
import { join, relative, resolve } from 'node:path';
import { DEFAULT_DATA_DIR } from '../../paths.ts';

const log = createLogger('content:blog');

export function createBlogPlugin(
  options: OpenElementBlogOptions,
  ctx?: OpenElementBuildContextLike,
  fs: FileSystemAdapter = nodeFsAdapter,
): Plugin {
  const contentDir = options.contentDir ?? 'posts';
  const basePath = options.basePath ?? '/blog';

  return {
    name: 'open:content:blog',

    async buildStart() {
      // ADR 0018: Use loadBlogData() pure function instead of stateful initBlogData()
      const result = await loadBlogData(options);

      log.info(
        `Blog: ${result.posts.length} post(s) found in ${contentDir}, base path: ${basePath}`,
      );

      // Write blog options to ctx for SSG helpers.
      if (ctx) {
        ctx.registerPlugin('blogOptions', { contentDir, basePath });
      }

      // SOP-001: Write generated blog data module to disk.
      // Failing to write must fail the build: consumers import these files.
      const dataDir = join(fs.cwd(), DEFAULT_DATA_DIR);
      fs.mkdirSync(dataDir, { recursive: true });
      const blogModule = writeBlogDataModule(result.posts);
      fs.writeFileSync(join(dataDir, '_generated-blog-data.ts'), blogModule, 'utf-8');
      log.info(`Blog: wrote _generated-blog-data.ts (${result.posts.length} post(s))`);
    },

    configureServer(server: ViteDevServer) {
      const absoluteContentDir = resolve(server.config.root, contentDir);

      // Watch the content directory for changes
      server.watcher.add(absoluteContentDir);

      const invalidateBlogData = (file: string) => {
        if (!file.startsWith(absoluteContentDir)) return;
        if (!file.endsWith('.md') && !file.endsWith('.mdx')) return;

        log.info(`Content changed: ${relative(server.config.root, file)} - reloading`);
        server.hot.send({ type: 'full-reload' });
      };

      server.watcher.on('change', invalidateBlogData);
      server.watcher.on('add', invalidateBlogData);
      server.watcher.on('unlink', invalidateBlogData);

      // M-19 fix: Clean up watcher listeners on server close
      server.httpServer?.on('close', () => {
        server.watcher.off('change', invalidateBlogData);
        server.watcher.off('add', invalidateBlogData);
        server.watcher.off('unlink', invalidateBlogData);
      });
    },
  };
}
