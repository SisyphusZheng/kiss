/** @jsxImportSource @openelement/element */
import { defineElement, definePage } from '@openelement/app';
import { StyleSheet } from '@openelement/element';
import { posts } from '@openelement/generated/blog-data';

export const tagName = 'home-page';

const recentPosts = [...posts]
  .sort((a, b) => b.frontmatter.date.localeCompare(a.frontmatter.date))
  .slice(0, 3);

const styles = new StyleSheet();
styles.replaceSync(`
  :host { display: block; }
  .hero { padding: 2.5rem 0 1rem; }
  .eyebrow { color: var(--brand); font-weight: 600; font-size: 0.78rem; letter-spacing: 0.14em; text-transform: uppercase; }
  h1 { font-family: var(--font-serif); font-size: 3rem; line-height: 1.12; letter-spacing: -0.015em; margin: 0.75rem 0 1.25rem; font-weight: 700; }
  .lede { font-size: 1.15rem; line-height: 1.75; color: var(--ink-2); max-width: 58ch; margin: 0; }
  .lede code { font-size: 0.85em; }
  .more { display: inline-block; margin-top: 1.5rem; font-weight: 600; }
  .demo { margin-top: 2.75rem; border: 1px solid var(--line); border-radius: 8px; padding: 1.25rem 1.5rem; }
  .demo .label { color: var(--ink-2); font-size: 0.8rem; letter-spacing: 0.1em; text-transform: uppercase; margin: 0 0 0.9rem; }
  .recent { margin-top: 3rem; }
  .recent h2 { font-family: var(--font-serif); letter-spacing: -0.01em; margin: 0 0 0.25rem; }
  .recent .sub { color: var(--ink-2); font-size: 0.925rem; margin: 0 0 1.5rem; }
  .recent .sub code { font-size: 0.85em; }
  .posts { list-style: none; padding: 0; margin: 0; border-top: 1px solid var(--line); }
  .post { display: block; padding: 1.15rem 0; border-bottom: 1px solid var(--line); color: inherit; text-decoration: none; }
  a.post:hover { text-decoration: none; }
  a.post:hover .title { color: var(--brand); }
  .post .title { display: block; font-family: var(--font-serif); font-size: 1.3rem; font-weight: 700; letter-spacing: -0.01em; color: var(--ink); transition: color 0.15s ease; }
  .post .meta { display: block; margin-top: 0.3rem; font-size: 0.85rem; color: var(--ink-2); }
  .post .excerpt { display: block; margin-top: 0.45rem; color: var(--ink-2); line-height: 1.6; }
  a { color: var(--brand); text-decoration: none; }
  a:hover { text-decoration: underline; }
`);

defineElement(tagName, {
  styles,
  render() {
    return (
      <>
        <section class='hero'>
          <span class='eyebrow'>openElement starter</span>
          <h1>Static pages, alive where it counts</h1>
          <p class='lede'>
            Your app is running. Edit <code>app/routes/index.tsx</code>{' '}
            to make it yours — write markdown in <code>content/blog/</code>, add routes under{' '}
            <code>app/routes/</code>, and hydrate only the components that need it.
          </p>
          <a class='more' href='/blog'>Read the blog →</a>
        </section>
        <section class='demo'>
          <p class='label'>Live island — hydrates on idle</p>
          <my-counter></my-counter>
        </section>
        <section class='demo'>
          <p class='label'>Client-only island — renders without SSR</p>
          <only-ticker></only-ticker>
        </section>
        <section class='recent'>
          <h2>Recent posts</h2>
          <p class='sub'>
            Rendered from <code>content/blog/*.md</code> at build time.
          </p>
          <ul class='posts'>
            {recentPosts.map((post) => (
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
        </section>
      </>
    );
  },
});

export default definePage({
  route: { path: '/' },
  head: {
    title: 'My openElement App',
    description: 'Generated openElement starter app',
  },
  renderIntent: {
    mode: 'static',
    revalidate: false,
  },
  render() {
    return <home-page />;
  },
});
