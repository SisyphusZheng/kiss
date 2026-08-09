/** @jsxImportSource @openelement/element */
import { defineElement, definePage } from '@openelement/app';
import { StyleSheet } from '@openelement/element';
import { posts } from '@openelement/generated/blog-data';

export const tagName = 'blog-index-page';

const styles = new StyleSheet();
styles.replaceSync(`
  :host { display: block; }
  h1 { letter-spacing: -0.02em; margin-bottom: 0.25rem; }
  .sub { color: var(--gray-7); font-size: 0.925rem; margin: 0 0 1.25rem; }
  .sub code { font-size: 0.9em; }
  ul { list-style: none; padding: 0; display: grid; gap: 1rem; margin: 0; }
  .card { display: block; background: #fff; border: 1px solid var(--gray-3); border-radius: var(--radius-3); padding: 1.25rem 1.5rem; box-shadow: var(--shadow-1); transition: transform 0.18s ease, box-shadow 0.18s ease; color: inherit; }
  a.card:hover { transform: translateY(-2px); box-shadow: var(--shadow-2); text-decoration: none; }
  .card .title { font-weight: 700; font-size: 1.05rem; color: var(--gray-9); }
  .card .meta { color: var(--gray-7); font-size: 0.875rem; margin-top: 0.35rem; display: flex; gap: 0.5rem; align-items: center; }
  .card p { margin: 0.6rem 0 0; color: var(--gray-7); }
  .pill { display: inline-block; background: #8262db14; color: var(--brand); border-radius: 999px; padding: 0.15em 0.7em; font-size: 0.75rem; font-weight: 600; }
  a { color: var(--brand); text-decoration: none; font-weight: 600; }
`);

// Newest first: sort by frontmatter date descending.
const sortedPosts = [...posts].sort((a, b) => b.frontmatter.date.localeCompare(a.frontmatter.date));

defineElement(tagName, {
  styles,
  render() {
    return (
      <>
        <h1>Blog</h1>
        <p class='sub'>
          Every post is a markdown file in <code>content/blog/</code>, pre-rendered at build time.
        </p>
        <ul>
          {sortedPosts.map((post) => (
            <li key={post.slug}>
              <a class='card' href={'/blog/' + post.slug}>
                <span class='title'>{post.frontmatter.title}</span>
                <span class='meta'>
                  <time>{post.frontmatter.date.slice(0, 10)}</time>
                  {(post.frontmatter.tags ?? []).map((tag) => (
                    <span class='pill' key={tag}>{tag}</span>
                  ))}
                </span>
                {post.frontmatter.excerpt ? <p>{post.frontmatter.excerpt}</p> : null}
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
