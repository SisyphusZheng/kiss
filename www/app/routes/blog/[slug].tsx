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
import { contentLocale } from '@openelement/site-ui/locale.ts';
import { localizePath } from '@openelement/site-ui/link.ts';
import { articleContentStyles, prepareArticle } from '@openelement/site-ui/article-body.ts';

export const tagName = 'page-blog-slug';

export function getStaticPaths(): Array<Record<string, string>> {
  return posts.map((post) => ({ slug: post.slug }));
}

const routeSheet = new StyleSheet();
routeSheet.replaceSync(
  pageStyles + articleContentStyles('.blog-content') + `

    .crumb { display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--size-2); margin: 0 0 var(--size-4); color: var(--text-muted); font-family: var(--font-mono); font-size: var(--font-size-00); font-weight: var(--font-weight-8); letter-spacing: 0.1em; text-transform: uppercase; }
    .crumb a { color: var(--text-muted); text-decoration: none; }
    .crumb a:hover { color: var(--brand); }
    .crumb .crumb-sep { color: color-mix(in srgb, var(--text-muted) 55%, transparent); }
    .crumb .crumb-current { color: var(--violet-8); }
    .post-title { margin: 0; color: var(--text-primary); font-family: var(--font-serif); font-style: italic; font-weight: 400; font-size: clamp(2.4rem, 5.5vw, 4.4rem); line-height: 1.02; letter-spacing: -0.01em; overflow-wrap: break-word; text-wrap: balance; }
    .post-lede { max-width: 640px; margin: var(--size-4) 0 0; color: var(--text-secondary); font-size: clamp(var(--font-size-1), 1.4vw, var(--font-size-2)); line-height: 1.65; }
    .post-meta { display: flex; flex-wrap: wrap; gap: var(--size-2); margin: var(--size-4) 0 0; color: var(--text-muted); font-family: var(--font-mono); font-size: var(--font-size-00); letter-spacing: 0.06em; text-transform: uppercase; }

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
    const locale = contentLocale(this._getLocale('en'));
    // English is the default locale: canonical routes stay unprefixed.
    const blogHref = localizePath('/blog', locale);
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
