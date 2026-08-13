/** Static home page (default renderIntent mode 'static') — prerendered at build time. */
import { definePage } from '@openelement/app';

export const tagName = 'page-home';

const HomePage = definePage({
  head: { title: 'static-only fixture — home' },
  render() {
    return (
      <main>
        <h1 id='home-marker'>static-only fixture home</h1>
      </main>
    );
  },
});

customElements.define(tagName, HomePage);
export default HomePage;
