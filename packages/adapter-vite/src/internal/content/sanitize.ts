// @deno-types="npm:@types/sanitize-html@^2"
import sanitizeHtml from 'sanitize-html';

/** ADR-0126: the single shared allow-list for every Markdown collection. */
export const CONTENT_SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
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
    'input',
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
  allowedSchemes: ['http', 'https', 'mailto', '#', 'relative'],
  disallowedTagsMode: 'discard',
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }),
  },
};

export function sanitizeContentHtml(html: string): string {
  return sanitizeHtml(html, CONTENT_SANITIZE_OPTIONS);
}
