/**
 * ./index.ts - Route generation
 *
 * Scans content directory for .md files and generates route data.
 */

import { join } from 'node:path';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import type { BlogPost, OpenElementBlogOptions } from './types.ts';
import { parseMarkdownFile, slugFromFilename } from './markdown.ts';
import { createLogger } from '@openelement/element';

const log = createLogger('blog');

/**
 * Scan the content directory and parse all blog posts.
 * Draft posts are included but marked.
 */
export async function scanPosts(options?: OpenElementBlogOptions): Promise<BlogPost[]> {
  const contentDir = options?.contentDir ?? 'posts';
  const posts: BlogPost[] = [];

  if (!existsSync(contentDir)) {
    log.warn(`Content directory not found: ${contentDir}`);
    return posts;
  }

  const files = readdirSync(contentDir)
    .filter((f) => f.endsWith('.md'))
    .sort()
    .reverse(); // newest first

  for (const file of files) {
    const filePath = join(contentDir, file);
    const content = readFileSync(filePath, 'utf-8');
    const slug = slugFromFilename(file);

    const post = await parseMarkdownFile(filePath, content, slug, options);
    posts.push(post);
  }

  return posts;
}

/**
 * Generate route data for all blog pages.
 * Returns an array of route objects suitable for openElement route system.
 */
export async function generateBlogRoutes(options?: OpenElementBlogOptions): Promise<{
  posts: BlogPost[];
  basePath: string;
  listRoute: {
    path: string;
    posts: Array<{ slug: string; title: string; date: string; excerpt: string; tags: string[] }>;
  };
  postRoutes: Array<
    {
      path: string;
      slug: string;
      title: string;
      html: string;
      frontmatter: BlogPost['frontmatter'];
    }
  >;
}> {
  const basePath = options?.basePath ?? '/blog';
  const posts = await scanPosts(options);

  // Filter out drafts in production
  const publishedPosts = posts.filter((p) => !p.frontmatter.draft);

  return {
    /** All published posts, sorted newest first */
    posts: publishedPosts,
    /** Base path for blog routes */
    basePath,
    /** Generate list page route */
    listRoute: {
      path: basePath,
      posts: publishedPosts.map((p) => ({
        slug: p.slug,
        title: p.frontmatter.title,
        date: p.frontmatter.date,
        excerpt: p.frontmatter.excerpt ?? '',
        tags: p.frontmatter.tags ?? [],
      })),
    },
    /** Generate individual post routes */
    postRoutes: publishedPosts.map((p) => ({
      path: `${basePath}/${p.slug}`,
      slug: p.slug,
      title: p.frontmatter.title,
      html: p.html,
      frontmatter: p.frontmatter,
    })),
  };
}
