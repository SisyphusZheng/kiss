/**
 * Blog Post Page - Dynamic Route, v4 editorial article.
 *
 * Renders individual blog posts from @openelement/generated/blog-data.
 * The `slug` param is set by openElement dynamic routing: /blog/:slug
 * Data comes from generated site data rather than module-level runtime state.
 */
import { defineCustomElement, OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/element';
import '@openelement/ui/open-code-block';
import { pageStyles } from '../../components/page-styles.js';
import { getPostBySlug, posts } from '@openelement/generated/blog-data';
import '@openelement/site-ui/open-reading-shell.tsx';
import '@openelement/site-ui/open-page-rail.tsx';
import { serializeOutline } from '@openelement/site-ui/page-contract.ts';

export const tagName = 'page-blog-slug';

export function getStaticPaths(): Array<Record<string, string>> {
  return posts.map((post) => ({ slug: post.slug }));
}

type ArticleOutline = Readonly<{ id: string; label: string; level: 2 | 3 }>;

function prepareArticle(html: string): { html: string; outline: ArticleOutline[] } {
  const outline: ArticleOutline[] = [];
  const seen = new Map<string, number>();
  const withIds = html.replace(
    /<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi,
    (_match, depth, attrs, body) => {
      const label = String(body).replace(/<[^>]+>/g, '').replace(/&[^;]+;/g, ' ').trim();
      const stem = label.toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}]+/gu, '-').replace(
        /(^-|-$)/g,
        '',
      ) || 'section';
      const count = seen.get(stem) ?? 0;
      seen.set(stem, count + 1);
      const id = count ? `${stem}-${count + 1}` : stem;
      outline.push({ id, label, level: Number(depth) as 2 | 3 });
      const cleanAttrs = String(attrs).replace(/\s+id=(?:"[^"]*"|'[^']*')/i, '');
      return `<h${depth}${cleanAttrs} id="${id}">${body}</h${depth}>`;
    },
  );
  // Code display goes through open-code-block (copy button + highlighting).
  const withCodeBlocks = withIds.replace(
    /(<pre[\s\S]*?<\/pre>)/gi,
    '<open-code-block>$1</open-code-block>',
  );
  return { html: withCodeBlocks, outline };
}

const routeSheet = new StyleSheet();
routeSheet.replaceSync(
  pageStyles + `

    .crumb { display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--size-2); margin: 0 0 var(--size-4); color: var(--text-muted); font-family: var(--font-mono); font-size: var(--font-size-00); font-weight: var(--font-weight-8); letter-spacing: 0.1em; text-transform: uppercase; }
    .crumb a { color: var(--text-muted); text-decoration: none; }
    .crumb a:hover { color: var(--brand); }
    .crumb .crumb-sep { color: color-mix(in srgb, var(--text-muted) 55%, transparent); }
    .crumb .crumb-current { color: var(--violet-8); }
    .post-title { margin: 0; color: var(--text-primary); font-family: var(--font-serif); font-style: italic; font-weight: 400; font-size: clamp(2.4rem, 5.5vw, 4.4rem); line-height: 1.02; letter-spacing: -0.01em; overflow-wrap: break-word; }
    .post-lede { max-width: 640px; margin: var(--size-4) 0 0; color: var(--text-secondary); font-size: clamp(var(--font-size-1), 1.4vw, var(--font-size-2)); line-height: 1.65; }
    .post-meta { display: flex; flex-wrap: wrap; gap: var(--size-2); margin: var(--size-4) 0 0; color: var(--text-muted); font-family: var(--font-mono); font-size: var(--font-size-00); letter-spacing: 0.06em; text-transform: uppercase; }

    .blog-content { font-family: var(--font-mono); font-size: var(--font-size-0); line-height: 1.9; color: var(--text-secondary); }
    .blog-content h2 { margin-top: var(--size-10); color: var(--text-primary); font-family: var(--font-mono); font-size: var(--font-size-4); font-weight: var(--font-weight-8); letter-spacing: -0.02em; }
    .blog-content h3 { margin-top: var(--size-8); color: var(--text-primary); font-family: var(--font-mono); font-size: var(--font-size-2); font-weight: var(--font-weight-8); }
    .blog-content p { margin: var(--size-4) 0; }
    .blog-content ul, .blog-content ol { padding-left: var(--size-6); margin: var(--size-4) 0; }
    .blog-content li { margin: 0.375rem 0; }
    .blog-content strong { color: var(--text-primary); }
    .blog-content code { background: var(--bg-surface); padding: 0.125rem 0.375rem; border-radius: var(--radius-1); font-size: var(--font-size-0); font-family: var(--font-mono); }
    .blog-content pre { background: var(--surface-code); border: 0.5px solid var(--border); border-radius: var(--radius-2); padding: var(--size-4); overflow-x: auto; margin: var(--size-4) 0; }
    .blog-content pre code { background: none; padding: 0; font-size: var(--font-size-0); line-height: 1.6; }
    .blog-content open-code-block { margin: var(--size-5) 0; }
    .blog-content table { width: 100%; border-collapse: collapse; margin: var(--size-4) 0; font-size: var(--font-size-1); }
    .blog-content th, .blog-content td { padding: var(--size-2) var(--size-3); text-align: left; border-bottom: 0.5px solid var(--border); }
    .blog-content th { background: var(--bg-surface); color: var(--text-secondary); font-weight: var(--font-weight-6); font-size: var(--font-size-overline); text-transform: uppercase; letter-spacing: var(--font-letterspacing-2); }
    .blog-content a { color: var(--brand); text-decoration: none; }
    .blog-content a:hover { text-decoration: underline; }
    .blog-content hr { border: none; border-top: 0.5px solid var(--border); margin: var(--size-8) 0; }
    .blog-content blockquote { margin: var(--size-8) 0; padding: var(--size-6) var(--size-4); border: 0; border-block: 1.5px solid color-mix(in srgb, var(--violet-5) 55%, transparent); color: var(--violet-8); font-family: var(--font-serif); font-style: italic; font-size: clamp(1.5rem, 3vw, 2.2rem); line-height: 1.35; text-align: center; }
    .blog-content blockquote p { margin: 0; }

    .next-dispatch { display: grid; gap: var(--size-3); margin-top: var(--size-11); padding-top: var(--size-6); border-top: 1px solid var(--border); }
    .next-label { color: var(--text-muted); font-family: var(--font-mono); font-size: var(--font-size-00); font-weight: var(--font-weight-8); letter-spacing: 0.16em; text-transform: uppercase; }
    .next-dispatch a { color: var(--text-primary); font-family: var(--font-serif); font-size: clamp(1.7rem, 3.2vw, 2.6rem); line-height: 1.05; text-decoration: none; }
    .next-dispatch a:hover { color: var(--violet-8); }
    .not-found { text-align: center; padding: var(--size-12) var(--size-4); color: var(--text-secondary); }
  `,
);

export default class BlogPostPage extends OpenElement {
  slug = '';

  static override styles = [routeSheet];

  override render() {
    const locale = this._getLocale('en') === 'en' ? 'en' : 'zh';
    // English is the default locale: canonical routes stay unprefixed.
    const blogHref = locale === 'en' ? '/blog' : '/zh/blog';
    const post = getPostBySlug(this.slug);
    if (!post) {
      return (
        <div class='container'>
          <div class='not-found'>
            <h1>404</h1>
            <p>{locale === 'en' ? 'Post not found' : '未找到文章'}: {this.slug}</p>
            <a href={blogHref}>← {locale === 'en' ? 'Back to Blog' : '返回博客'}</a>
          </div>
        </div>
      );
    }
    const tags = post.frontmatter.tags ?? [];
    const article = prepareArticle(post.html);
    // Prev/next must follow the blog index's visible order, not the raw
    // posts array — keep this filter+sort in sync with the visiblePosts in
    // routes/blog/index.tsx (#1066).
    const visiblePosts = posts
      .filter((candidate) => candidate.frontmatter.type !== 'adr')
      .sort((a, b) => b.frontmatter.date.localeCompare(a.frontmatter.date));
    const index = visiblePosts.findIndex((candidate) => candidate.slug === post.slug);
    const previous = index >= 0 ? visiblePosts[index + 1] : undefined;
    const next = index > 0 ? visiblePosts[index - 1] : undefined;
    return (
      <open-reading-shell
        meta
        rail
        footer
        previous={previous ? `${blogHref}/${previous.slug}` : undefined}
        previous-label={previous?.frontmatter.title}
        next={next ? `${blogHref}/${next.slug}` : undefined}
        next-label={next?.frontmatter.title}
      >
        <div slot='meta'>
          <p class='crumb'>
            <a href={blogHref}>{locale === 'en' ? 'Blog' : '博客'}</a>
            <span class='crumb-sep'>/</span>
            <span class='crumb-current'>{tags[0] ?? (locale === 'en' ? 'Dispatch' : '随笔')}</span>
          </p>
          <h1 class='post-title'>{post.frontmatter.title}</h1>
          {post.frontmatter.excerpt && <p class='post-lede'>{post.frontmatter.excerpt}</p>}
          <p class='post-meta'>
            <time>{post.frontmatter.date}</time>
            {tags.map((tag: string) => <span key={tag}>· {tag}</span>)}
          </p>
        </div>
        <open-page-rail slot='rail' items={serializeOutline(article.outline)}></open-page-rail>
        <div class='blog-content' innerHTML={article.html} trustedHtml>
        </div>
        <nav class='next-dispatch' aria-label='Next dispatch'>
          <span class='next-label'>{locale === 'en' ? 'Next dispatch' : '下一篇'}</span>
          {next
            ? <a href={`${blogHref}/${next.slug}`}>{next.frontmatter.title} →</a>
            : (
              <a href={blogHref}>
                {locale === 'en' ? 'Back to all dispatches →' : '返回全部文章 →'}
              </a>
            )}
        </nav>
      </open-reading-shell>
    );
  }
}

defineCustomElement(tagName, BlogPostPage);
