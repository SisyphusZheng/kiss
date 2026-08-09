/** @jsxImportSource @openelement/element */
import { definePage } from '@openelement/app';
import { getPostBySlug, posts } from '@openelement/generated/blog-data';

/**
 * Blog Post Page - dynamic route /blog/:slug.
 *
 * One page per post in content/blog is prerendered at build time:
 * getStaticPaths() lists the params, render() reads the matching post from
 * the generated blog-data module. Post HTML comes from markdown authored in
 * this repo, so it is rendered through the explicit `trustedHtml` boundary.
 */
export function getStaticPaths(): Array<Record<string, string>> {
  return posts.map((post) => ({ slug: post.slug }));
}

export default definePage({
  route: { path: '/blog/:slug' },
  head: { title: 'Blog — My openElement App' },
  renderIntent: {
    mode: 'static',
    revalidate: false,
  },
  render({ params }) {
    const post = getPostBySlug(params.slug);
    if (!post) {
      return (
        <main>
          <h1>Post not found</h1>
          <p>
            <a href='/blog'>← Back to the blog</a>
          </p>
        </main>
      );
    }
    return (
      <main>
        <article>
          <h1>{post.frontmatter.title}</h1>
          <p>
            <time>{post.frontmatter.date.slice(0, 10)}</time>
          </p>
          <div innerHTML={post.html} trustedHtml></div>
        </article>
      </main>
    );
  },
});
