/** @jsxImportSource @openelement/element */
import { defineElement, definePage } from '@openelement/app';
import { StyleSheet } from '@openelement/element';
import { getPostBySlug, posts } from '@openelement/generated/blog-data';

export const tagName = 'blog-post-page';

/**
 * Blog Post Page - dynamic route /blog/:slug.
 *
 * One page per post in content/blog is prerendered at build time:
 * getStaticPaths() lists the params, render() reads the matching post from
 * the generated blog-data module. Post HTML comes from markdown authored in
 * this repo, so it is rendered through the explicit `trustedHtml` boundary.
 *
 * Note the scoped StyleSheet: pages render inside declarative shadow DOM, so
 * document-level CSS would not reach the markdown typography below.
 */
export function getStaticPaths(): Array<Record<string, string>> {
  return posts.map((post) => ({ slug: post.slug }));
}

const styles = new StyleSheet();
styles.replaceSync(`
  :host { display: block; }
  h1 { letter-spacing: -0.02em; margin-bottom: 0.35rem; }
  .meta { color: var(--gray-7); font-size: 0.875rem; margin-top: 0; display: flex; gap: 0.5rem; align-items: center; }
  .pill { display: inline-block; background: #8262db14; color: var(--brand); border-radius: 999px; padding: 0.15em 0.7em; font-size: 0.75rem; font-weight: 600; }
  a { color: var(--brand); text-decoration: none; font-weight: 600; }
  .post-body { background: #fff; border: 1px solid var(--gray-3); border-radius: var(--radius-3); box-shadow: var(--shadow-1); padding: 2rem 2.5rem; line-height: 1.75; font-size: 1.02rem; }
  .post-body h2 { margin: 2.25rem 0 0.75rem; letter-spacing: -0.01em; }
  .post-body p { margin: 0.9rem 0; }
  .post-body pre { background: #17171f; color: #e9e9f2; padding: 1rem 1.25rem; border-radius: 10px; overflow-x: auto; font-size: 0.875rem; line-height: 1.6; }
  .post-body code { font-family: var(--font-mono, ui-monospace, Menlo, monospace); font-size: 0.875em; }
  .post-body :not(pre) > code { background: #8262db14; color: var(--brand); padding: 0.15em 0.45em; border-radius: 6px; font-weight: 600; }
  .post-body img { max-width: 100%; border-radius: 10px; border: 1px solid var(--gray-3); }
  .post-body blockquote { margin-left: 0; padding-left: 1rem; border-left: 3px solid var(--brand); color: var(--gray-7); }
`);

defineElement(tagName, {
  styles,
  render(props: { slug: string }) {
    const post = getPostBySlug(props.slug);
    if (!post) {
      return (
        <>
          <h1>Post not found</h1>
          <p>
            <a href='/blog'>← Back to the blog</a>
          </p>
        </>
      );
    }
    return (
      <>
        <p>
          <a href='/blog'>← Back to the blog</a>
        </p>
        <h1>{post.frontmatter.title}</h1>
        <p class='meta'>
          <time>{post.frontmatter.date.slice(0, 10)}</time>
          {(post.frontmatter.tags ?? []).map((tag) => <span class='pill' key={tag}>{tag}</span>)}
        </p>
        <article class='post-body' innerHTML={post.html} trustedHtml></article>
      </>
    );
  },
});

export default definePage({
  route: { path: '/blog/:slug' },
  head: { title: 'Blog — My openElement App' },
  renderIntent: {
    mode: 'static',
    revalidate: false,
  },
  render({ params }) {
    return <blog-post-page slug={params.slug} />;
  },
});
