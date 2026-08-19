/**
 * markdown.ts - Markdown processing
 *
 * Parses markdown files with frontmatter using gray-matter + marked.
 */

import matter from 'gray-matter';
import { marked } from 'marked';
// @deno-types="npm:@types/sanitize-html@^2"
import sanitizeHtml from 'sanitize-html';
import { normalizeSeparators } from '@openelement/element/build-utils';
import type { BlogPost, OpenElementBlogOptions } from './types.ts';

/**
 * Allow-list HTML sanitizer using sanitize-html.
 * Only permits safe tags and attributes - all other HTML is stripped.
 * href/src/action only allow http/https/mailto/#/relative URLs.
 * This is a build-time defense-in-depth - content files are developer-controlled,
 * but sanitization prevents accidental or malicious XSS via raw HTML in markdown.
 */
const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p',
    'a',
    'code',
    'pre',
    'ul',
    'ol',
    'li',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'blockquote',
    'strong',
    'em',
    'b',
    'i',
    's',
    'del',
    'ins',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'br',
    'hr',
    'img',
    'figure',
    'figcaption',
    'details',
    'summary',
    'sup',
    'sub',
    'abbr',
    'input', // for task lists
  ],
  allowedAttributes: {
    '*': ['class', 'id'],
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height'],
    td: ['colspan', 'rowspan'],
    th: ['colspan', 'rowspan'],
    code: ['language', 'data-language'],
    input: ['type', 'disabled', 'checked'],
    abbr: ['title'],
  },
  // Only allow safe URL schemes in href/src/action
  allowedSchemes: ['http', 'https', 'mailto', '#', 'relative'],
  // Strip tag content for disallowed tags (don't keep inner text of <script> etc.)
  disallowedTagsMode: 'discard',
  // Enforce rel=noopener on target=_blank links
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }),
  },
};

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
    html = sanitizeHtml(raw, SANITIZE_OPTIONS);
  } else {
    const raw = await marked(content, { async: true });
    html = sanitizeHtml(raw, SANITIZE_OPTIONS);
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
