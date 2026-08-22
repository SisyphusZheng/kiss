/**
 * build-content-data.ts — www-local content pipeline (multi-collection).
 *
 * Pilot for framework content collections (#1087, ADR-0136, targeted at
 * v0.44). Mirrors the adapter-vite blog pipeline
 * (packages/adapter-vite/src/internal/content/blog/) so www content sections
 * are authored as plain Markdown today, without a framework release. When
 * `content.collections` lands in the framework, this plugin is deleted.
 *
 * Keep the sanitize allow-list in parity with ADR-0126 and the blog pipeline's
 * SANITIZE_OPTIONS until then — this is the one deliberate duplication.
 *
 * Content layout (www/content/<collection>/):
 *   getting-started.md      → { slug: 'getting-started', locale: 'en' }
 *   getting-started.zh.md   → { slug: 'getting-started', locale: 'zh' }
 *
 * Frontmatter: title (required), order (required, matches the route module's
 * nav meta order), lede (optional). The body is linear Markdown; code fences
 * become <pre> blocks that article-page.tsx wraps in <open-code-block>.
 */

import matter from 'gray-matter';
import { marked } from 'marked';
// @deno-types="npm:@types/sanitize-html@^2"
import sanitizeHtml from 'sanitize-html';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';
import type { Plugin, ViteDevServer } from 'vite';

const WWW_ROOT = fileURLToPath(new URL('./', import.meta.url));

/** Content collections served by this pilot. One generated module each. */
export const COLLECTIONS = ['guide', 'architecture'] as const;
export type CollectionName = (typeof COLLECTIONS)[number];

const contentDir = (collection: CollectionName) => join(WWW_ROOT, 'content', collection);
const dataFile = (collection: CollectionName) =>
  join(WWW_ROOT, 'app', 'data', `_generated-${collection}-data.ts`);

export interface ContentPageData {
  slug: string;
  locale: string;
  frontmatter: {
    title: string;
    lede?: string;
    order: number;
  };
  content: string;
  html: string;
}

/**
 * Allow-list HTML sanitizer — copy of the adapter-vite blog pipeline's
 * SANITIZE_OPTIONS (ADR-0126). Build-time defense-in-depth; content files are
 * developer-controlled. Do not extend without checking ADR-0126 first.
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
  allowedSchemes: ['http', 'https', 'mailto', '#', 'relative'],
  disallowedTagsMode: 'discard',
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }),
  },
};

/** `name.md` → { slug: 'name', locale: 'en' }; `name.zh.md` → locale 'zh'. */
export function parseContentFileName(fileName: string): { slug: string; locale: string } | null {
  if (!fileName.endsWith('.md')) return null;
  const stem = fileName.slice(0, -'.md'.length);
  const localeMatch = stem.match(/^(.*)\.([a-z]{2})$/);
  if (localeMatch) return { slug: localeMatch[1], locale: localeMatch[2] };
  return { slug: stem, locale: 'en' };
}

/** Pure loader: scan one collection's content directory and compile every file. */
export async function loadContentPages(
  collection: CollectionName,
): Promise<ContentPageData[]> {
  const dir = contentDir(collection);
  if (!existsSync(dir)) return [];
  const pages: ContentPageData[] = [];
  for (const fileName of readdirSync(dir).sort()) {
    const parsed = parseContentFileName(fileName);
    if (!parsed) continue;
    const filePath = join(dir, fileName);
    const { data, content } = matter(readFileSync(filePath, 'utf-8'));
    // Fail closed (SOP-001): a content page without title/order is a broken
    // nav/pager waiting to happen — refuse to generate silently.
    if (typeof data.title !== 'string' || data.title.length === 0) {
      throw new Error(`[content-data] ${collection}/${fileName}: frontmatter.title is required`);
    }
    if (typeof data.order !== 'number') {
      throw new Error(
        `[content-data] ${collection}/${fileName}: frontmatter.order must be a number`,
      );
    }
    const raw = await marked(content, { async: true });
    pages.push({
      slug: parsed.slug,
      locale: parsed.locale,
      frontmatter: { title: data.title, lede: data.lede, order: data.order },
      content,
      html: sanitizeHtml(raw, SANITIZE_OPTIONS),
    });
  }
  return pages;
}

/** Generate the self-contained data module consumed by article routes. */
export function writeContentDataModule(pages: ContentPageData[]): string {
  return [
    '// Auto-generated by www/build-content-data.ts - do not edit',
    'export interface GeneratedContentPage {',
    '  slug: string;',
    '  locale: string;',
    '  frontmatter: {',
    '    title: string;',
    '    lede?: string;',
    '    order: number;',
    '  };',
    '  content: string;',
    '  html: string;',
    '}',
    '',
    `export const pages: GeneratedContentPage[] = ${JSON.stringify(pages, null, 2)};`,
    '',
    'export function getPage(slug: string, locale: string): GeneratedContentPage | undefined {',
    '  return pages.find((p) => p.slug === slug && p.locale === locale);',
    '}',
    '',
  ].join('\n');
}

/**
 * Regenerate every collection's data module on disk. Shared by the Vite
 * plugin, the `deno run build-content-data.ts` one-shot, and the www test
 * suite (which generates the modules before importing route modules that
 * consume them). Returns the total page count across collections.
 */
export async function generateContentDataFiles(): Promise<number> {
  let total = 0;
  mkdirSync(join(WWW_ROOT, 'app', 'data'), { recursive: true });
  for (const collection of COLLECTIONS) {
    const pages = await loadContentPages(collection);
    writeFileSync(dataFile(collection), writeContentDataModule(pages), 'utf-8');
    total += pages.length;
  }
  return total;
}

/**
 * Vite plugin: regenerate the content data modules at buildStart and watch
 * the content dirs in dev. Route modules import the generated files by
 * relative path (app/data/_generated-<collection>-data.ts) — no
 * virtual-module indirection.
 */
export function contentDataPlugin(): Plugin {
  return {
    name: 'www:content-data',

    async buildStart() {
      const total = await generateContentDataFiles();
      console.log(`[content-data] wrote data modules (${total} page(s))`);
    },

    configureServer(server: ViteDevServer) {
      const dirs = COLLECTIONS.map(contentDir);
      for (const dir of dirs) server.watcher.add(dir);

      const invalidate = (file: string) => {
        if (!dirs.some((dir) => file.startsWith(dir))) return;
        if (!file.endsWith('.md')) return;
        // Regenerate BEFORE reloading (mirrors #1028): a bare full-reload
        // replays imports against the stale generated file.
        generateContentDataFiles().then(() => {
          for (const collection of COLLECTIONS) {
            const mod = server.moduleGraph.getModuleById(dataFile(collection));
            if (mod) server.moduleGraph.invalidateModule(mod);
          }
          server.hot.send({ type: 'full-reload' });
        }).catch((err: unknown) => {
          console.error(`[content-data] regeneration failed: ${err}`);
        });
      };

      server.watcher.on('change', invalidate);
      server.watcher.on('add', invalidate);
      server.watcher.on('unlink', invalidate);

      server.httpServer?.on('close', () => {
        server.watcher.off('change', invalidate);
        server.watcher.off('add', invalidate);
        server.watcher.off('unlink', invalidate);
      });
    },
  };
}

// Allow `deno run build-content-data.ts` for a manual one-shot generation.
if (import.meta.main) {
  const total = await generateContentDataFiles();
  console.log(
    `[content-data] wrote ${
      relative(WWW_ROOT, join(WWW_ROOT, 'app', 'data'))
    } modules (${total} page(s))`,
  );
}
