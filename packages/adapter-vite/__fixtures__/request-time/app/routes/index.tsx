/** Static home page (default renderIntent mode 'static') — prerendered at build time. */
import { definePage } from '@openelement/app';

export const tagName = 'page-home';

const HomePage = definePage({
  head: { title: 'request-time fixture — home' },
  render() {
    return (
      <main>
        <h1 id='home-marker'>request-time fixture home</h1>
        <p>This page is prerendered; /live is rendered at request time.</p>
      </main>
    );
  },
});

customElements.define(tagName, HomePage);
export default HomePage;
