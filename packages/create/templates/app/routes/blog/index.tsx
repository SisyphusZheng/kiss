/** @jsxImportSource @openelement/element */
import { defineElement, definePage } from '@openelement/app';
import { StyleSheet } from '@openelement/element';
import { posts } from '@openelement/generated/blog-data';

export const tagName = 'blog-index-page';

const styles = new StyleSheet();
styles.replaceSync(`
  :host { display: block; max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
  h1 { font-size: 2rem; margin-bottom: 1rem; }
  ul { list-style: none; padding: 0; display: grid; gap: 0.75rem; }
  a { color: var(--brand); text-decoration: none; font-weight: 600; }
  time { color: var(--gray-7, #495057); font-size: 0.875rem; margin-left: 0.5rem; }
`);

// Newest first: sort by frontmatter date descending.
const sortedPosts = [...posts].sort((a, b) => b.frontmatter.date.localeCompare(a.frontmatter.date));

defineElement(tagName, {
  styles,
  render() {
    return (
      <>
        <h1>Blog</h1>
        <ul>
          {sortedPosts.map((post) => (
            <li key={post.slug}>
              <a href={'/blog/' + post.slug}>{post.frontmatter.title}</a>
              <time>{post.frontmatter.date.slice(0, 10)}</time>
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
