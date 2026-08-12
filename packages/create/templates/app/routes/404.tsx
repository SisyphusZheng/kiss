/** @jsxImportSource @openelement/element */
import { definePage } from '@openelement/app';

/**
 * Styled 404 (#923): the request-time server renders this page with a 404
 * status for unmatched paths; SSG builds also emit it as static 404.html.
 */
const NotFoundPage = definePage({
  renderIntent: { mode: 'dynamic' },
  head: { title: '404 — openElement' },
  render() {
    return (
      <main>
        <h1>404</h1>
        <p>The page you are looking for does not exist.</p>
        <p>
          <a href='/'>Back to the homepage</a>
        </p>
      </main>
    );
  },
});

export default NotFoundPage;
