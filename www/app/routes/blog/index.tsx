/**
 * Blog Index Page - editorial release and architecture journal.
 */
export const meta = { section: 'History', label: 'Blog', order: 10 };

import { OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/core/style-sheet';
import { openPropsTokenSheet } from '@openelement/ui';
import '@openelement/ui/open-badge';
import '@openelement/ui/open-lab-panel';
import { posts } from '@openelement/generated/blog-data';

const routeSheet = new StyleSheet();
routeSheet.replaceSync(`
  :host {
    display: block;
    color: var(--text-primary);
  }

  * {
    box-sizing: border-box;
  }

  h1,
  h2,
  h3,
  p {
    margin-block-start: 0;
  }

  .blog-page {
    display: grid;
    background: var(--bg-base);
  }

  .hero {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, .7fr) minmax(360px, .42fr);
    min-height: 460px;
    overflow: hidden;
    border-block-end: var(--border-size-1) solid var(--border);
    background:
      linear-gradient(112deg, var(--violet-2), transparent 48%),
      radial-gradient(circle at 80% 46%, color-mix(in srgb, var(--brand-light) 22%, transparent), transparent 34%),
      var(--bg-base);
  }

  .hero::after {
    content: "";
    position: absolute;
    inset-inline-end: var(--size-10);
    inset-block-start: 50%;
    width: 390px;
    aspect-ratio: 1;
    transform: translateY(-50%);
    border: var(--size-6) solid color-mix(in srgb, var(--brand) 18%, transparent);
    border-radius: var(--radius-round);
    pointer-events: none;
  }

  .hero-copy,
  .featured-shell {
    position: relative;
    z-index: 1;
    padding: var(--size-10);
  }

  .hero-copy {
    display: grid;
    align-content: end;
    border-inline-end: var(--border-size-1) solid var(--border);
  }

  .kicker,
  .section-kicker,
  .post-date,
  .post-tag {
    color: var(--brand);
    font-family: var(--font-mono);
    font-size: var(--font-size-00);
    font-weight: var(--font-weight-8);
    text-transform: uppercase;
  }

  .kicker {
    margin-block-end: var(--size-4);
  }

  h1 {
    margin: 0;
    max-width: 760px;
    font-size: var(--font-size-7);
    line-height: .9;
    font-weight: var(--font-weight-9);
    letter-spacing: 0;
  }

  .lede {
    max-width: 720px;
    margin-block: var(--size-5) 0;
    color: var(--text-secondary);
    font-size: var(--font-size-2);
    line-height: 1.28;
  }

  .featured {
    display: grid;
    gap: var(--size-5);
    height: 100%;
  }

  .featured h2 {
    margin: 0;
    font-size: var(--font-size-4);
    line-height: 1;
    font-weight: var(--font-weight-9);
    letter-spacing: 0;
  }

  .featured p {
    margin: 0;
    color: var(--text-secondary);
    font-size: var(--font-size-0);
    line-height: var(--font-lineheight-3);
  }

  .featured a,
  .post-card {
    color: inherit;
    text-decoration: none;
  }

  .sections {
    display: grid;
    grid-template-columns: minmax(280px, .34fr) minmax(0, 1fr);
    gap: var(--size-5);
    width: min(1120px, calc(100% - var(--size-10)));
    margin-inline: auto;
    padding: var(--size-8) 0 var(--size-10);
  }

  .journal-note {
    align-self: start;
    position: sticky;
    top: calc(var(--nav-height) + var(--size-5));
  }

  .journal-note p {
    color: var(--text-secondary);
    font-size: var(--font-size-0);
    line-height: var(--font-lineheight-3);
  }

  .post-stream {
    display: grid;
    gap: var(--size-5);
  }

  .post-section {
    display: grid;
    gap: var(--size-4);
  }

  .post-section h2 {
    margin: 0;
    font-size: var(--font-size-5);
    line-height: 1;
    font-weight: var(--font-weight-9);
    letter-spacing: 0;
  }

  .post-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--size-4);
  }

  .post-card {
    display: grid;
    gap: var(--size-4);
    min-height: 210px;
    padding: var(--size-5);
    border: var(--border-size-1) solid var(--border);
    border-radius: var(--radius-3);
    background: color-mix(in srgb, var(--bg-card) 76%, transparent);
    transition: border-color var(--duration-2) var(--ease-2), background var(--duration-2) var(--ease-2);
  }

  .post-card:hover {
    border-color: var(--brand);
    background: var(--brand-subtle);
  }

  .post-card h3 {
    margin: 0;
    color: var(--text-primary);
    font-size: var(--font-size-3);
    line-height: 1.04;
    font-weight: var(--font-weight-9);
    letter-spacing: 0;
  }

  .post-card p {
    margin: 0;
    color: var(--text-secondary);
    font-size: var(--font-size-0);
    line-height: var(--font-lineheight-3);
  }

  .post-meta,
  .tag-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--size-2);
    align-items: center;
  }

  .post-date {
    color: var(--text-muted);
  }

  .post-tag {
    padding: var(--size-1) var(--size-2);
    border: var(--border-size-1) solid var(--border);
    border-radius: var(--radius-round);
    background: color-mix(in srgb, var(--bg-elevated) 72%, transparent);
    color: var(--text-secondary);
  }

  @media (max-width: 1120px) {
    .hero,
    .sections,
    .post-grid {
      grid-template-columns: 1fr;
    }

    .sections {
      width: min(100% - var(--size-8), 1120px);
    }

    .hero-copy {
      border-inline-end: 0;
      border-block-end: var(--border-size-1) solid var(--border);
    }

    .journal-note {
      position: static;
    }
  }

  @media (max-width: 640px) {
    .hero-copy,
    .featured-shell,
    .sections {
      padding: var(--size-5) var(--size-4);
    }

    h1 {
      font-size: var(--font-size-6);
      line-height: .94;
    }

    .lede {
      font-size: var(--font-size-1);
    }
  }
`);

const visiblePosts = posts.filter((post) => post.frontmatter.type !== 'adr');

function postTags(post: typeof posts[number]): string[] {
  return post.frontmatter.tags ?? [];
}

function hasTag(post: typeof posts[number], tag: string): boolean {
  return postTags(post).some((value) => value.toLowerCase() === tag);
}

export class BlogIndexPage extends OpenElement {
  static override styles = [openPropsTokenSheet, routeSheet];

  override render() {
    const featured = visiblePosts[0];
    const releasePosts = visiblePosts.filter((post) => hasTag(post, 'release')).slice(0, 4);
    const architecturePosts = visiblePosts
      .filter((post) => hasTag(post, 'architecture') || post.frontmatter.title.toLowerCase().includes('architecture'))
      .slice(0, 4);
    const recentPosts = visiblePosts.slice(0, 8);

    return (
      <main class='blog-page'>
        <section class='hero'>
          <div class='hero-copy'>
            <p class='kicker'>Editorial lab journal</p>
            <h1>Design notes, release truth, and architecture decisions.</h1>
            <p class='lede'>
              The blog is the public audit trail for openElement: what changed,
              why the package graph moved, and which standards boundary matters next.
            </p>
          </div>
          <div class='featured-shell'>
            {featured && (
              <open-lab-panel class='featured' label='featured dispatch' meta={featured.frontmatter.date}>
                <a href={'/blog/' + featured.slug}>
                  <h2>{featured.frontmatter.title}</h2>
                </a>
                {featured.frontmatter.excerpt && <p>{featured.frontmatter.excerpt}</p>}
                <div class='tag-row'>
                  <open-badge tone='brand'>latest</open-badge>
                  {postTags(featured).slice(0, 3).map((tag) => <span class='post-tag'>{tag}</span>)}
                </div>
              </open-lab-panel>
            )}
          </div>
        </section>

        <section class='sections'>
          <open-lab-panel class='journal-note' label='journal map' meta='docs as product'>
            <p>
              Release posts are product evidence. Architecture posts explain the
              standards decisions behind DSD, routes, islands, and package boundaries.
            </p>
          </open-lab-panel>

          <div class='post-stream'>
            {this._renderPostSection('Release line', releasePosts.length ? releasePosts : recentPosts.slice(0, 4))}
            {this._renderPostSection('Architecture notes', architecturePosts.length ? architecturePosts : recentPosts.slice(4, 8))}
            {this._renderPostSection('Recent dispatches', recentPosts)}
          </div>
        </section>
      </main>
    );
  }

  private _renderPostSection(title: string, items: typeof posts): unknown {
    return (
      <section class='post-section'>
        <span class='section-kicker'>openElement notes</span>
        <h2>{title}</h2>
        <div class='post-grid'>
          {items.map((post, index) => (
            <a href={'/blog/' + post.slug} class='post-card'>
              <div class='post-meta'>
                <span class='post-date'>{post.frontmatter.date}</span>
                {index === 0 && <open-badge tone='brand'>lead</open-badge>}
              </div>
              <h3>{post.frontmatter.title}</h3>
              {post.frontmatter.excerpt && <p>{post.frontmatter.excerpt}</p>}
              <div class='tag-row'>
                {postTags(post).slice(0, 3).map((tag) => <span class='post-tag'>{tag}</span>)}
              </div>
            </a>
          ))}
        </div>
      </section>
    );
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('blog-index-page')) {
  customElements.define('blog-index-page', BlogIndexPage);
}

export default BlogIndexPage;
export const tagName = 'blog-index-page';
