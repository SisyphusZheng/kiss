/**
 * Blog Post Page - Dynamic Route
 *
 * Renders individual blog posts from @openelement/generated/blog-data.
 * The `slug` param is set by openElement dynamic routing: /blog/:slug
 * Data comes from generated site data rather than module-level runtime state.
 */
import { OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/element';
import '@openelement/ui/open-button';
import { pageStyles } from '../../components/page-styles.js';
import { getPostBySlug, posts } from '@openelement/generated/blog-data';
import '@openelement/site-ui/open-reading-shell.tsx';
import '@openelement/site-ui/open-page-rail.tsx';

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
  return { html: withIds, outline };
}

const routeSheet = new StyleSheet();
routeSheet.replaceSync(
  pageStyles + `

    .blog-back { font-size: var(--font-size-0); color: var(--text-secondary); margin-bottom: var(--size-2); display: inline-block; }
    .blog-date { font-size: var(--font-size-0); color: var(--text-secondary); margin-bottom: var(--size-8); }
    .blog-tags { display: flex; gap: 0.375rem; flex-wrap: wrap; margin-bottom: var(--size-4); }
    .blog-tag { font-size: var(--font-size-00); font-weight: var(--font-weight-6); text-transform: uppercase; letter-spacing: var(--font-letterspacing-2); padding: 0.125rem 0.375rem; border-radius: 2px; background: var(--bg-surface); border: 0.5px solid var(--border); color: var(--text-secondary); }
    .blog-content { font-size: var(--font-size-3); line-height: var(--font-lineheight-4); color: var(--text-secondary); }
    .blog-content h2 { margin-top: var(--size-10); color: var(--text-primary); font-size: 1.125rem; font-weight: var(--font-weight-6); }
    .blog-content h3 { margin-top: var(--size-8); color: var(--text-primary); font-size: var(--font-size-4); font-weight: var(--font-weight-6); }
    .blog-content p { margin: var(--size-3) 0; }
    .blog-content ul, .blog-content ol { padding-left: var(--size-6); margin: var(--size-3) 0; }
    .blog-content li { margin: 0.375rem 0; }
    .blog-content strong { color: var(--text-primary); }
    .blog-content code { background: var(--bg-surface); padding: 0.125rem 0.375rem; border-radius: 2px; font-size: var(--font-size-1); font-family: var(--font-mono); }
    .blog-content pre { background: var(--bg-surface); border: 0.5px solid var(--border); border-radius: var(--radius-1); padding: var(--size-4); overflow-x: auto; margin: var(--size-4) 0; }
    .blog-content pre code { background: none; padding: 0; font-size: var(--font-size-0); line-height: 1.6; }
    .blog-content table { width: 100%; border-collapse: collapse; margin: var(--size-4) 0; font-size: var(--font-size-1); }
    .blog-content th, .blog-content td { padding: var(--size-2) var(--size-3); text-align: left; border-bottom: 0.5px solid var(--border); }
    .blog-content th { background: var(--bg-surface); color: var(--text-secondary); font-weight: var(--font-weight-6); font-size: 0.6875rem; text-transform: uppercase; letter-spacing: var(--font-letterspacing-2); }
    .blog-content a { color: var(--brand); text-decoration: none; }
    .blog-content a:hover { text-decoration: underline; }
    .blog-content hr { border: none; border-top: 0.5px solid var(--border); margin: var(--size-8) 0; }
    .blog-content blockquote { border-left: 2px solid var(--brand); padding-left: var(--size-4); margin: var(--size-4) 0; color: var(--text-secondary); }
    .not-found { text-align: center; padding: var(--size-12) var(--size-4); color: var(--text-secondary); }
    .nav-row { margin-top: var(--size-11); }
    .related { display:grid; gap:var(--size-2); margin-block-end:var(--size-5); }
    .related a { color:var(--text-secondary); text-decoration:none; }
    .related a:hover,.related a:focus-visible { color:var(--brand); }
  `,
);

export default class BlogPostPage extends OpenElement {
  slug = '';

  static override styles = [routeSheet];

  override render() {
    const locale = this._getLocale('zh') === 'en' ? 'en' : 'zh';
    const blogHref = `/${locale}/blog`;
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
    const index = posts.findIndex((candidate) => candidate.slug === post.slug);
    const previous = index >= 0 ? posts[index + 1] : undefined;
    const next = index > 0 ? posts[index - 1] : undefined;
    const related = posts.filter((candidate) =>
      candidate.slug !== post.slug &&
      (candidate.frontmatter.tags ?? []).some((tag) => tags.includes(tag))
    ).slice(0, 3);
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
          <a href={blogHref} class='blog-back'>← {locale === 'en' ? 'Blog' : '博客'}</a>
          <h1>{post.frontmatter.title}</h1>
          <p class='subtitle'>{post.frontmatter.excerpt ?? ''}</p>
        </div>
        <open-page-rail slot='rail' items={JSON.stringify(article.outline)}></open-page-rail>
        {tags.length > 0
          ? (
            <div class='blog-tags'>
              {tags.map((tag: string) => <span key={tag} class='blog-tag'>{tag}</span>)}
            </div>
          )
          : null}
        <p class='blog-date'>{post.frontmatter.date}</p>
        <div class='blog-content' innerHTML={article.html} trustedHtml>
        </div>
        <div class='nav-row'>
          {related.length
            ? (
              <nav class='related' aria-label='Related posts'>
                <strong>{locale === 'en' ? 'Related' : '相关文章'}</strong>
                {related.map((item) => (
                  <a href={`${blogHref}/${item.slug}`}>{item.frontmatter.title}</a>
                ))}
              </nav>
            )
            : null}
          <open-button variant='ghost' size='sm' href={blogHref}>
            {locale === 'en' ? 'Back to Blog' : '返回博客'}
          </open-button>
        </div>
      </open-reading-shell>
    );
  }
}

customElements.define(tagName, BlogPostPage);
