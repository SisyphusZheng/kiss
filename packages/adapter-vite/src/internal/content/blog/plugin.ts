/** Back-compatible blog alias over the generic collection plugin. */
import type { Plugin } from 'vite';
import type { OpenElementBuildContextLike } from '../../protocol/framework.ts';
import type { FileSystemAdapter } from '../fs-adapter.ts';
import { nodeFsAdapter } from '../fs-adapter.ts';
import { createCollectionPlugin } from '../collection/plugin.ts';
import type { CollectionEntry, CollectionOptions } from '../collection/types.ts';
import { writeBlogDataModule } from './blog-data.ts';
import type { BlogPost, OpenElementBlogOptions } from './types.ts';

function toBlogPost(entry: CollectionEntry): BlogPost {
  const frontmatter = entry.frontmatter;
  return {
    slug: entry.slug,
    content: entry.content,
    html: entry.html,
    frontmatter: {
      title: String(frontmatter.title),
      date: String(frontmatter.date),
      draft: Boolean(frontmatter.draft),
      tags: Array.isArray(frontmatter.tags) ? frontmatter.tags.map(String) : [],
      ...(typeof frontmatter.excerpt === 'string' ? { excerpt: frontmatter.excerpt } : {}),
      ...(typeof frontmatter.type === 'string' ? { type: frontmatter.type } : {}),
      ...(typeof frontmatter.lang === 'string' ? { lang: frontmatter.lang } : {}),
    },
  };
}

/**
 * The blog collection options (date-prefix slug transform + frontmatter
 * schema) — exported so the repo's content-graph adapter derives blog
 * slugs/routes through the same truth as the built site (#1307).
 */
export function blogCollectionOptions(options: OpenElementBlogOptions): CollectionOptions {
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
        lang: 'string',
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
            ...(frontmatter.lang === undefined ? {} : { lang: frontmatter.lang }),
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
    dataModule: (entries) => writeBlogDataModule(entries.map(toBlogPost)),
  });
}
