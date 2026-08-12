/**
 * /404 — styled not-found page (#923): request-time unmatched paths render
 * this page with a 404 status on both dev (hono) and build (Nitro) runtimes.
 */
import { definePage } from '@openelement/app';

export const tagName = 'page-404';

const NotFoundPage = definePage({
  renderIntent: { mode: 'dynamic' },
  head: { title: 'request-time fixture — not found' },
  render() {
    return (
      <main>
        <h1 id='styled-404'>styled not found</h1>
        <p>The requested page does not exist.</p>
      </main>
    );
  },
});

customElements.define(tagName, NotFoundPage);
export default NotFoundPage;
