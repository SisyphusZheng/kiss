/**
 * request-time home page — static prerendered page (compiled, v0.44).
 * The route module (app/routes/index.tsx) attaches the page descriptor.
 */
import { OpenElement } from '@openelement/element';

declare function element(
  tag: string,
  options?: { root: 'light' | 'shadow-open' | 'shadow-closed' },
): ClassDecorator;

@element('index-page', { root: 'shadow-open' })
export default class HomePage extends OpenElement {
  render() {
    return (
      <main>
        <h1 id='home-marker'>request-time fixture home</h1>
        <p>This page is prerendered; /live is rendered at request time.</p>
      </main>
    );
  }
}
