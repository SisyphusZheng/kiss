/**
 * Blog Post Page - Dynamic Route
 *
 * Renders individual blog posts from @openelement/generated/blog-data.
 * The `slug` param is set by openElement dynamic routing: /blog/:slug
 * Data comes from generated app data, not @openelement/content module state.
 */
import { OpenElement } from "@openelement/element";
import { StyleSheet } from "@openelement/core/style-sheet";
import { openPropsTokenSheet } from "@openelement/ui";
import "@openelement/ui/open-button";
import { pageStyles } from "../../components/page-styles.js";
import { getPostBySlug, posts } from "@openelement/generated/blog-data";

export const tagName = "page-blog-slug";

export function getStaticPaths(): Array<Record<string, string>> {
  return posts.map((post) => ({ slug: post.slug }));
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
  `,
);

export default class BlogPostPage extends OpenElement {
  slug = "";

  static override styles = [openPropsTokenSheet, routeSheet];

  override render() {
    return (this._getLocale("zh")) === "en"
      ? this._renderEn()
      : this._renderZh();
  }

  private _renderZh() {
    const loc = this._getLocale("zh");
    const post = getPostBySlug(this.slug);

    if (!post) {
      return (
        <div class="container">
          <div class="not-found">
            <h1>404</h1>
            <p>鏂囩珷鏈壘鍒? {this.slug}</p>
            <a href="/blog">鈫?杩斿洖鍗氬</a>
          </div>
        </div>
      );
    }
    const tags = post.frontmatter.tags ?? [];
    return (
      <div class="container">
        <a href="/blog" class="blog-back">鈫?鍗氬</a>
        <h1>{post.frontmatter.title}</h1>
        <p class="subtitle">{post.frontmatter.excerpt ?? ""}</p>
        {tags.length > 0
          ? (
            <div class="blog-tags">
              {tags.map((tag: string) => (
                <span key={tag} class="blog-tag">{tag}</span>
              ))}
            </div>
          )
          : null}
        <p class="blog-date">{post.frontmatter.date}</p>
        <div class="blog-content" innerHTML={post.html} trustedHtml={true}>
        </div>
        <div class="nav-row">
          <open-button variant="ghost" size="sm" href="/blog">
            Back to Blog
          </open-button>
        </div>
      </div>
    );
  }

  private _renderEn() {
    const loc = this._getLocale("en");
    const post = getPostBySlug(this.slug);

    if (!post) {
      return (
        <div class="container">
          <div class="not-found">
            <h1>404</h1>
            <p>Post not found: {this.slug}</p>
            <a href="/en/blog">鈫?Back to Blog</a>
          </div>
        </div>
      );
    }
    const tags = post.frontmatter.tags ?? [];
    return (
      <div class="container">
        <a href="/blog" class="blog-back">Blog</a>
        <h1>{post.frontmatter.title}</h1>
        <p class="subtitle">{post.frontmatter.excerpt ?? ""}</p>
        {tags.length > 0
          ? (
            <div class="blog-tags">
              {tags.map((tag: string) => (
                <span key={tag} class="blog-tag">{tag}</span>
              ))}
            </div>
          )
          : null}
        <p class="blog-date">{post.frontmatter.date}</p>
        <div class="blog-content" innerHTML={post.html} trustedHtml={true}>
        </div>
        <div class="nav-row">
          <open-button variant="ghost" size="sm" href="/blog">
            Back to Blog
          </open-button>
        </div>
      </div>
    );
  }
}

customElements.define(tagName, BlogPostPage);


