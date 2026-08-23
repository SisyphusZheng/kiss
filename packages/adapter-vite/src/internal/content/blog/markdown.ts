/**
 * markdown.ts - Markdown processing
 *
 * Parses markdown files with frontmatter using gray-matter + marked.
 */

import matter from 'gray-matter';
import { marked } from 'marked';
import { normalizeSeparators } from '@openelement/element/build-utils';
import type { BlogPost, OpenElementBlogOptions } from './types.ts';
import { sanitizeContentHtml } from '../sanitize.ts';

/**
 * Allow-list HTML sanitizer shared with the element trust boundary.
 * Only permits safe tags and attributes - all other HTML is stripped.
 * href/src/action only allow http/https/mailto/#/relative URLs.
 * This is a build-time defense-in-depth - content files are developer-controlled,
 * but sanitization prevents accidental or malicious XSS via raw HTML in markdown.
 */
/**
 * Parse a markdown file into a BlogPost.
 * Extracts frontmatter, renders markdown to HTML.
 */
export async function parseMarkdownFile(
  filePath: string,
  fileContent: string,
  slug: string,
  options?: OpenElementBlogOptions,
): Promise<BlogPost> {
  const { data, content } = matter(fileContent);

  const frontmatter = {
    title: data.title ?? slug,
    date: data.date ?? dateFromFilename(filePath) ?? new Date().toISOString().split('T')[0],
    draft: data.draft ?? false,
    tags: data.tags ?? [],
    excerpt: data.excerpt,
    type: data.type,
  };

  let html: string;
  if (options?.markdown) {
    // Custom renderer output crosses a content trust boundary and is always sanitized.
    const raw = await options.markdown(content);
    html = sanitizeContentHtml(raw);
  } else {
    const raw = await marked(content, { async: true });
    html = sanitizeContentHtml(raw);
  }

  return {
    slug,
    frontmatter,
    content,
    html,
  };
}

/**
 * Derive a URL-safe slug from a filename.
 * e.g. "2026-05-07-hello-world.md" -> "hello-world"
 *      "my-post.md" -> "my-post"
 */
export function slugFromFilename(filename: string): string {
  return filename
    .replace(/\.md$/, '')
    .replace(/^\d{4}-\d{2}-\d{2}-/, ''); // strip date prefix
}

function dateFromFilename(filePath: string): string | undefined {
  const filename = normalizeSeparators(filePath).split('/').pop() ?? filePath;
  return filename.match(/^(\d{4}-\d{2}-\d{2})-/)?.[1];
}
