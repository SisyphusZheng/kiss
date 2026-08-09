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
  .hero { padding: 3.5rem 0 2.5rem; }
  .eyebrow { color: var(--brand); font-weight: 700; font-size: 0.8rem; letter-spacing: 0.12em; text-transform: uppercase; }
  h1 { font-size: 2.75rem; line-height: 1.08; letter-spacing: -0.025em; margin: 0.6rem 0 1rem; }
  .grad { background: linear-gradient(120deg, var(--brand), var(--brand-2)); -webkit-background-clip: text; background-clip: text; color: transparent; }
  .lede { font-size: 1.125rem; color: var(--gray-7); max-width: 56ch; line-height: 1.7; margin: 0; }
  .lede code { font-size: 0.9em; }
  .cta { display: flex; gap: 0.75rem; margin-top: 1.75rem; }
  .cta .primary { background: linear-gradient(120deg, var(--brand), var(--brand-2)); color: #fff; padding: 0.6rem 1.3rem; border-radius: 999px; font-weight: 700; }
  .cta .primary:hover { text-decoration: none; filter: brightness(1.08); }
  .cta .ghost { padding: 0.6rem 1.1rem; border-radius: 999px; color: var(--gray-7); }
  .cta .ghost:hover { background: #8262db14; color: var(--brand); text-decoration: none; }
  .demo { margin-top: 2.5rem; background: #fff; border: 1px solid var(--gray-3); border-radius: var(--radius-3); padding: 1.25rem 1.5rem; box-shadow: var(--shadow-1); }
  .demo .label { color: var(--gray-7); font-size: 0.875rem; margin: 0 0 0.75rem; }
  h2 { letter-spacing: -0.01em; margin: 3rem 0 0.25rem; }
  .sub { color: var(--gray-7); font-size: 0.925rem; margin: 0 0 1.25rem; }
  .posts { list-style: none; padding: 0; display: grid; gap: 1rem; margin: 0; }
  .card { display: block; background: #fff; border: 1px solid var(--gray-3); border-radius: var(--radius-3); padding: 1.25rem 1.5rem; box-shadow: var(--shadow-1); transition: transform 0.18s ease, box-shadow 0.18s ease; color: inherit; }
  a.card:hover { transform: translateY(-2px); box-shadow: var(--shadow-2); text-decoration: none; }
  .card .title { font-weight: 700; font-size: 1.05rem; color: var(--gray-9); }
  .card .meta { color: var(--gray-7); font-size: 0.875rem; margin-top: 0.35rem; display: flex; gap: 0.5rem; align-items: center; }
  .card p { margin: 0.6rem 0 0; color: var(--gray-7); }
  .pill { display: inline-block; background: #8262db14; color: var(--brand); border-radius: 999px; padding: 0.15em 0.7em; font-size: 0.75rem; font-weight: 600; }
  a { color: var(--brand); text-decoration: none; font-weight: 600; }
`);

defineElement(tagName, {
  styles,
  render() {
    return (
      <>
        <section class='hero'>
          <span class='eyebrow'>openElement starter</span>
          <h1>
            Static pages, <span class='grad'>islands of interactivity</span>
          </h1>
          <p class='lede'>
            Your app is running. Edit <code>app/routes/index.tsx</code>{' '}
            to make it yours — write markdown in <code>content/blog/</code>, add routes under{' '}
            <code>app/routes/</code>, and hydrate only the components that need it.
          </p>
          <div class='cta'>
            <a class='primary' href='/blog'>Read the blog</a>
            <a class='ghost' href='/api/health'>API health →</a>
          </div>
        </section>
        <section class='demo'>
          <p class='label'>Live island — hydrates on idle, no page bundle:</p>
          <my-counter></my-counter>
        </section>
        <h2>Recent posts</h2>
        <p class='sub'>
          Rendered from <code>content/blog/*.md</code> at build time.
        </p>
        <ul class='posts'>
          {recentPosts.map((post) => (
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
