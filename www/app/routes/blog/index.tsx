/**
 * Blog Index Page - Data-driven rendering via @openelement/generated/blog-data.
 */
export const meta = { section: "History", label: "Blog", order: 10 };
import { OpenElement } from "@openelement/element";
import { StyleSheet } from "@openelement/core/style-sheet";
import { linearTokenSheet } from "@openelement/ui";
import { posts } from "@openelement/generated/blog-data";

const routeSheet = new StyleSheet();
routeSheet.replaceSync(`
  .blog-list { list-style: none; padding: 0; margin: var(--size-6) 0; }
  .blog-item { display: block; padding: var(--size-4) var(--size-5); margin-bottom: var(--size-2); border: 0.5px solid var(--border); border-radius: var(--radius-1); text-decoration: none; color: inherit; transition: border-color 0.15s, background 0.15s; }
  .blog-item:hover { border-color: var(--border-hover); background: var(--bg-surface); }
  .blog-item h2 { margin: 0 0 var(--size-1); font-size: var(--font-size-4); font-weight: var(--font-weight-5); color: var(--text-primary); }
  .blog-desc { margin: 0 0 var(--size-1); font-size: var(--font-size-1); color: var(--text-secondary); }
  .blog-date { font-size: 0.6875rem; color: var(--text-secondary); }
  .blog-tags { display: flex; gap: 0.375rem; flex-wrap: wrap; margin-top: var(--size-2); }
  .blog-tag { font-size: var(--font-size-00); font-weight: var(--font-weight-6); text-transform: uppercase; letter-spacing: var(--font-letterspacing-2); padding: 0.125rem 0.375rem; border-radius: 2px; background: var(--bg-surface); border: 0.5px solid var(--border); color: var(--text-secondary); }
  .new-badge { display: inline-block; font-size: 0.5rem; font-weight: var(--font-weight-7); letter-spacing: var(--font-letterspacing-4); padding: 0.0625rem 0.3125rem; border-radius: 2px; background: var(--text-primary); color: var(--bg-canvas); vertical-align: middle; margin-left: var(--size-1); }
`);

export class BlogIndexPage extends OpenElement {
  static override styles = [linearTokenSheet, routeSheet];

  override render() {
    return (
      <div class="container">
        <h1>Blog</h1>
        <p class="subtitle">
          Design notes, architecture decisions, and release work for the
          openElement framework.
        </p>
        <div class="blog-list">
          {posts.filter((p) => p.frontmatter.type !== "adr").map((post, i) => {
            const tags = post.frontmatter.tags ?? [];
            return (
              <a href={"/blog/" + post.slug} class="blog-item">
                <h2>
                  {post.frontmatter.title}
                  {i === 0 && <span class="new-badge">NEW</span>}
                </h2>
                {post.frontmatter.excerpt && (
                  <p class="blog-desc">{post.frontmatter.excerpt}</p>
                )}
                <span class="blog-date">{post.frontmatter.date}</span>
                {tags.length > 0 && (
                  <div class="blog-tags">
                    {tags.map((tag) => <span class="blog-tag">{tag}</span>)}
                  </div>
                )}
              </a>
            );
          })}
        </div>
      </div>
    );
  }
}

customElements.define("blog-index-page", BlogIndexPage);
export default BlogIndexPage;
export const tagName = "blog-index-page";
