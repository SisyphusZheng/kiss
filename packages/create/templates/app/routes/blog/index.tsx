/** @jsxImportSource @openelement/element */
import { defineElement, definePage } from '@openelement/app';
import { StyleSheet } from '@openelement/element';
import { posts } from '@openelement/generated/blog-data';

// Names the content element below. definePage routes always register under
// the route-path tag; this export never drives page registration (#960).
export const tagName = 'blog-index-page';

const styles = new StyleSheet();
styles.replaceSync(`
  :host { display: block; }
  .eyebrow { color: var(--brand); font-weight: 600; font-size: 0.78rem; letter-spacing: 0.14em; text-transform: uppercase; }
  h1 { font-family: var(--font-serif); letter-spacing: -0.015em; margin: 0.5rem 0; }
  .sub { color: var(--ink-2); font-size: 0.925rem; margin: 0 0 1.5rem; }
  .sub code { font-size: 0.85em; }
  .posts { list-style: none; padding: 0; margin: 0; border-top: 1px solid var(--line); }
  .post { display: block; padding: 1.15rem 0; border-bottom: 1px solid var(--line); color: inherit; text-decoration: none; }
  a.post:hover { text-decoration: none; }
  a.post:hover .title { color: var(--brand); }
  .post .title { display: block; font-family: var(--font-serif); font-size: 1.3rem; font-weight: 700; letter-spacing: -0.01em; color: var(--ink); transition: color 0.15s ease; }
  .post .meta { display: block; margin-top: 0.3rem; font-size: 0.85rem; color: var(--ink-2); }
  .post .excerpt { display: block; margin-top: 0.45rem; color: var(--ink-2); line-height: 1.6; }
  a { color: var(--brand); text-decoration: none; }
`);

// Newest first: sort by frontmatter date descending.
const sortedPosts = [...posts].sort((a, b) => b.frontmatter.date.localeCompare(a.frontmatter.date));

defineElement(tagName, {
  styles,
  render() {
    return (
      <>
        <span class='eyebrow'>Index</span>
        <h1>Blog</h1>
        <p class='sub'>
          Every post is a markdown file in <code>content/blog/</code>, pre-rendered at build time.
        </p>
        <ul class='posts'>
          {sortedPosts.map((post) => (
            <li key={post.slug}>
              <a class='post' href={'/blog/' + post.slug}>
                <span class='title'>{post.frontmatter.title}</span>
                <span class='meta'>
                  <time>{post.frontmatter.date.slice(0, 10)}</time>
                  {(post.frontmatter.tags ?? []).length
                    ? ' · ' + (post.frontmatter.tags ?? []).join(', ')
                    : ''}
                </span>
                {post.frontmatter.excerpt
                  ? <span class='excerpt'>{post.frontmatter.excerpt}</span>
                  : null}
              </a>
            </li>
          ))}
        </ul>
      </>
    );
  },
});

export default definePage({
  route: { path: '/blog' },
  head: {
    title: 'Blog — My openElement App',
    description: 'Posts from content/blog',
  },
  renderIntent: {
    mode: 'static',
    revalidate: false,
  },
  render() {
    return <blog-index-page />;
  },
});
