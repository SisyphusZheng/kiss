/** Back-compatible blog alias over the generic collection plugin. */
import type { Plugin } from 'vite';
import type { OpenElementBuildContextLike } from '../../protocol/framework.ts';
import type { FileSystemAdapter } from '../fs-adapter.ts';
import { nodeFsAdapter } from '../fs-adapter.ts';
import { createCollectionPlugin } from '../collection/plugin.ts';
import type { CollectionOptions } from '../collection/types.ts';
import { writeBlogDataModule } from './blog-data.ts';
import type { BlogPost, OpenElementBlogOptions } from './types.ts';

function blogCollectionOptions(options: OpenElementBlogOptions): CollectionOptions {
  return {
    contentDir: options.contentDir ?? 'posts',
    basePath: options.basePath ?? '/blog',
    markdown: options.markdown,
    schema: {
      fields: {
        title: 'string',
        date: 'string',
        draft: 'boolean',
        tags: 'string[]',
        excerpt: 'string',
        type: 'string',
      },
      transform(frontmatter, context) {
        const datePrefix = context.fileName.match(/^(\d{4}-\d{2}-\d{2})-/)?.[1];
        const slug = context.slug.replace(/^\d{4}-\d{2}-\d{2}-/, '');
        return {
          slug,
          frontmatter: {
            title: frontmatter.title ?? slug,
            date: frontmatter.date ?? datePrefix ?? new Date().toISOString().split('T')[0],
            draft: frontmatter.draft ?? false,
            tags: frontmatter.tags ?? [],
            ...(frontmatter.excerpt === undefined ? {} : { excerpt: frontmatter.excerpt }),
            ...(frontmatter.type === undefined ? {} : { type: frontmatter.type }),
          },
        };
      },
    },
  };
}

export function createBlogPlugin(
  options: OpenElementBlogOptions,
  ctx?: OpenElementBuildContextLike,
  fs: FileSystemAdapter = nodeFsAdapter,
): Plugin {
  return createCollectionPlugin('blog', blogCollectionOptions(options), ctx, fs, {
    outputName: '_generated-blog-data.ts',
    contextKey: 'blogOptions',
    itemLabel: 'post',
    prepareEntries: (entries) => entries.filter((entry) => !entry.frontmatter.draft).reverse(),
    dataModule: (entries) => writeBlogDataModule(entries as unknown as BlogPost[]),
  });
}
