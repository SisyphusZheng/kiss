/** @jsxImportSource @openelement/element */
import { defineElement, definePage } from '@openelement/app';
import { StyleSheet } from '@openelement/element';

export const tagName = 'not-found-page';

const styles = new StyleSheet();
styles.replaceSync(`
  :host { display: block; }
  h1 { font-family: var(--font-serif); font-size: 2.4rem; letter-spacing: -0.015em; margin: 0.75rem 0 0.5rem; font-weight: 700; }
  p { color: var(--ink-2); line-height: 1.6; }
  a { color: var(--brand); font-weight: 600; text-decoration: none; }
  a:hover { text-decoration: underline; }
`);

defineElement(tagName, {
  styles,
  render() {
    return (
      <>
        <h1>404</h1>
        <p>The page you are looking for does not exist.</p>
        <p>
          <a href='/'>Back to the homepage</a>
        </p>
      </>
    );
  },
});

/**
 * Styled 404 (#923): the request-time server renders this page with a 404
 * status for unmatched paths; SSG builds also emit it as static 404.html.
 */
const NotFoundPage = definePage({
  renderIntent: { mode: 'dynamic' },
  head: { title: '404 — openElement' },
  render() {
    return <not-found-page />;
  },
});

export default NotFoundPage;
