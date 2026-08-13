/** Static about page — second route so the fixture is not a single-page edge case. */
import { definePage } from '@openelement/app';

export const tagName = 'page-about';

const AboutPage = definePage({
  head: { title: 'static-only fixture — about' },
  render() {
    return (
      <main>
        <h1 id='about-marker'>static-only fixture about</h1>
      </main>
    );
  },
});

customElements.define(tagName, AboutPage);
export default AboutPage;
