/**
 * static-only about page — second route so the fixture is not a single-page
 * edge case. Canonical compiled page element (see page-home.tsx).
 */
import { OpenElement } from '@openelement/element';

declare function element(
  tag: string,
  options?: { root: 'light' | 'shadow-open' | 'shadow-closed' },
): ClassDecorator;

@element('about-page', { root: 'shadow-open' })
export default class AboutPage extends OpenElement {
  render() {
    return (
      <main>
        <h1 id='about-marker'>static-only fixture about</h1>
      </main>
    );
  }
}
