/** @jsxImportSource @openelement/element */
import { defineElement, definePage, notFound } from '@openelement/app';
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
  h1 { font-family: var(--font-serif); font-size: 2.4rem; line-height: 1.15; letter-spacing: -0.015em; margin: 0.5rem 0; }
  .meta { color: var(--ink-2); font-size: 0.9rem; margin-top: 0; padding-bottom: 1.5rem; border-bottom: 1px solid var(--line); }
  a { color: var(--brand); text-decoration: none; }
  .post-body { line-height: 1.8; font-size: 1.05rem; }
  .post-body h2 { font-family: var(--font-serif); margin: 2.5rem 0 0.75rem; letter-spacing: -0.01em; }
  .post-body p { margin: 1rem 0; }
  .post-body pre { background: #f4f2ec; border: 1px solid var(--line); padding: 1rem 1.25rem; border-radius: 8px; overflow-x: auto; font-size: 0.875rem; line-height: 1.65; }
  .post-body code { font-family: var(--font-mono, ui-monospace, Menlo, monospace); font-size: 0.85em; background: #f1efe8; border: 1px solid var(--line); padding: 0.1em 0.4em; border-radius: 5px; }
  .post-body pre code { background: none; border: none; padding: 0; }
  .post-body img { max-width: 100%; border-radius: 8px; border: 1px solid var(--line); }
  .post-body blockquote { margin-left: 0; padding-left: 1rem; border-left: 2px solid var(--brand); color: var(--ink-2); }
`);

defineElement(tagName, {
  styles,
  render(props: { slug: string }) {
    const post = getPostBySlug(props.slug);
    // #922: an unknown slug is a 404, not a 200 "Post not found" page — the
    // request-time server entry translates the thrown notFound() into the
    // status code (SEO + cache semantics).
    if (!post) {
      notFound(`Post not found: ${props.slug}`);
    }
    return (
      <>
        <p>
          <a href='/blog'>← Back to the blog</a>
        </p>
        <h1>{post.frontmatter.title}</h1>
        <p class='meta'>
          <time>{post.frontmatter.date.slice(0, 10)}</time>
          {(post.frontmatter.tags ?? []).length
            ? ' · ' + (post.frontmatter.tags ?? []).join(', ')
            : ''}
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
