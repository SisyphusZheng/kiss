/**
 * Blog Index Page - v4 dispatch journal: serif masthead, featured band,
 * and outlined-number article rows.
 */
export const meta = { section: 'History', label: 'Blog', order: 10 };

import { OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/element';
import { posts } from '@openelement/generated/blog-data';

const routeSheet = new StyleSheet();
routeSheet.replaceSync(`
  :host {
    display: block;
    color: var(--text-primary);
    background: var(--bg-base);
  }

  * {
    box-sizing: border-box;
  }

  h1,
  h2,
  h3,
  p {
    margin: 0;
  }

  /* ── masthead: one serif italic accent ── */
  .masthead {
    position: relative;
    isolation: isolate;
    padding: clamp(4rem, 11vh, 8rem) clamp(1.5rem, 5vw, 4.5rem) clamp(2.5rem, 6vh, 4.5rem);
  }

  .masthead::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;
    background-image:
      linear-gradient(color-mix(in srgb, var(--violet-6) 7%, transparent) 1px, transparent 1px),
      linear-gradient(90deg, color-mix(in srgb, var(--violet-6) 7%, transparent) 1px, transparent 1px);
    background-size: 72px 72px;
    mask-image: linear-gradient(180deg, black, transparent);
  }

  .eyebrow {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: var(--violet-8);
    font-family: var(--font-mono);
    font-size: var(--font-size-00);
    font-weight: var(--font-weight-8);
    letter-spacing: 0.29em;
    text-transform: uppercase;
  }

  .eyebrow::before {
    content: "";
    width: 2rem;
    height: 2px;
    background: var(--brand);
  }

  h1 {
    margin-block-start: clamp(1.5rem, 4vh, 3rem);
    font-family: var(--font-serif);
    font-style: italic;
    font-weight: 400;
    font-size: clamp(4.2rem, 13vw, 11rem);
    line-height: 0.92;
    letter-spacing: -0.02em;
    color: var(--violet-8);
  }

  .lede {
    max-width: 38rem;
    margin-block-start: clamp(1.25rem, 3vh, 2rem);
    color: var(--text-secondary);
    font-size: clamp(1rem, 1.2vw, 1.1rem);
    line-height: 1.75;
  }

  /* ── featured dispatch band ── */
  .featured {
    display: block;
    padding: clamp(2.5rem, 6vh, 4.5rem) clamp(1.5rem, 5vw, 4.5rem);
    border-block: 1px solid var(--border);
    background: color-mix(in srgb, var(--bg-elevated) 55%, var(--bg-base));
    color: inherit;
    text-decoration: none;
  }

  .featured-kicker {
    display: flex;
    flex-wrap: wrap;
    gap: var(--size-3);
    align-items: baseline;
    color: var(--brand);
    font-family: var(--font-mono);
    font-size: var(--font-size-00);
    font-weight: var(--font-weight-8);
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  .featured-kicker .read-time {
    margin-inline-start: auto;
    color: var(--text-muted);
    font-weight: var(--font-weight-5);
    letter-spacing: 0.08em;
  }

  .featured h2 {
    max-width: 20ch;
    margin-block-start: var(--size-5);
    font-family: var(--font-serif);
    font-weight: 400;
    font-size: clamp(2.4rem, 5.5vw, 4.6rem);
    line-height: 1;
    letter-spacing: -0.01em;
    color: var(--text-primary);
    transition: color 0.15s ease;
  }

  .featured:hover h2 {
    color: var(--violet-8);
  }

  .featured-excerpt {
    max-width: 44rem;
    margin-block-start: var(--size-4);
    color: var(--text-secondary);
    font-family: var(--font-mono);
    font-size: var(--font-size-0);
    line-height: 1.75;
  }

  .read-more {
    display: inline-block;
    margin-block-start: var(--size-5);
    color: var(--violet-8);
    font-family: var(--font-mono);
    font-size: var(--font-size-0);
    font-weight: var(--font-weight-7);
  }

  /* ── numbered article rows ── */
  .stream {
    display: grid;
    padding-block-end: clamp(3rem, 8vh, 6rem);
  }

  .row {
    display: grid;
    grid-template-columns: minmax(4rem, 0.14fr) minmax(0, 1fr) auto;
    gap: clamp(1rem, 4vw, 4rem);
    align-items: center;
    padding: clamp(1.5rem, 4vh, 2.75rem) clamp(1.5rem, 5vw, 4.5rem);
    border-block-end: 1px solid var(--border);
    color: inherit;
    text-decoration: none;
    transition: background 0.15s ease;
  }

  .row:hover {
    background: linear-gradient(90deg, color-mix(in srgb, var(--brand) 8%, transparent), transparent);
  }

  .row-index {
    font-family: var(--font-mono);
    font-size: clamp(2.4rem, 5vw, 4rem);
    font-weight: 800;
    line-height: 1;
    color: transparent;
    -webkit-text-stroke: 1.5px color-mix(in srgb, var(--violet-5) 55%, transparent);
  }

  .row-title {
    display: block;
    font-family: var(--font-serif);
    font-weight: 400;
    font-size: clamp(1.6rem, 3vw, 2.6rem);
    line-height: 1.05;
    color: var(--text-primary);
    transition: color 0.15s ease;
  }

  .row:hover .row-title {
    color: var(--violet-8);
  }

  .row-excerpt {
    margin-block-start: var(--size-2);
    color: var(--text-secondary);
    font-family: var(--font-mono);
    font-size: var(--font-size-00);
    line-height: 1.6;
  }

  .row-date {
    color: var(--text-muted);
    font-family: var(--font-mono);
    font-size: var(--font-size-00);
    white-space: nowrap;
  }

  @media (max-width: 720px) {
    .row {
      grid-template-columns: minmax(0, 1fr);
      gap: var(--size-2);
    }

    .row-date {
      justify-self: start;
    }
  }
`);

// The dispatch index leads with the newest story: sort by frontmatter date
// descending before picking featured and rows.
const visiblePosts = posts
  .filter((post) => post.frontmatter.type !== 'adr')
  .sort((a, b) => b.frontmatter.date.localeCompare(a.frontmatter.date));

function postTags(post: typeof posts[number]): string[] {
  return post.frontmatter.tags ?? [];
}

function padIndex(index: number): string {
  return String(index + 1).padStart(2, '0');
}

export class BlogIndexPage extends OpenElement {
  static override styles = [routeSheet];

  override render() {
    const featured = visiblePosts[0];
    const rows = visiblePosts.slice(1, 5);

    return (
      <main class='journal'>
        <header class='masthead'>
          <p class='eyebrow'>Blog — Dispatches from the lab</p>
          <h1>Dispatches.</h1>
          <p class='lede'>
            The public audit trail: what changed, why the package graph moved, and which standards
            boundary matters next.
          </p>
        </header>

        {featured && (
          <a class='featured' href={'/blog/' + featured.slug}>
            <p class='featured-kicker'>
              <span>
                Featured — {featured.frontmatter.date}
                {postTags(featured)[0] ? ` · ${postTags(featured)[0]}` : ''}
              </span>
              <span class='read-time'>Latest dispatch</span>
            </p>
            <h2>{featured.frontmatter.title}</h2>
            {featured.frontmatter.excerpt && (
              <p class='featured-excerpt'>{featured.frontmatter.excerpt}</p>
            )}
            <span class='read-more'>Read the dispatch →</span>
          </a>
        )}

        <section class='stream' aria-label='Recent dispatches'>
          {rows.map((post, index) => (
            <a class='row' href={'/blog/' + post.slug}>
              <span class='row-index' aria-hidden='true'>{padIndex(index)}</span>
              <div>
                <span class='row-title'>{post.frontmatter.title}</span>
                {post.frontmatter.excerpt && <p class='row-excerpt'>{post.frontmatter.excerpt}</p>}
              </div>
              <span class='row-date'>{post.frontmatter.date}</span>
            </a>
          ))}
        </section>
      </main>
    );
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('blog-index-page')) {
  customElements.define('blog-index-page', BlogIndexPage);
}

export default BlogIndexPage;
export const tagName = 'blog-index-page';
