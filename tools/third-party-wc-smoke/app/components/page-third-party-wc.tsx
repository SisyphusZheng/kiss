/**
 * /third-party-wc page element (v0.44 compiled) — static page hosting the
 * alpha3-wc-fixture island. The path-derived tag is 'third-party-wc'; the
 * page class is the route element itself (no separate content element).
 */
import { element, OpenElement } from '@openelement/element';
import { alpha3WcPageStyles } from '../islands/alpha3-wc-styles.ts';
// The Lit fixture creates this compiled child inside its own shadow root at
// runtime, so the page imports the capability explicitly to keep it reachable
// from the generated client delivery graph.
import '../islands/alpha3-open-child.tsx';

@element('third-party-wc', { root: 'shadow-open' })
export default class ThirdPartyWcPage extends OpenElement {
  static styles = alpha3WcPageStyles;

  render() {
    return (
      <main>
        <h1>alpha3 Web Components interop</h1>
        <alpha3-wc-fixture></alpha3-wc-fixture>
      </main>
    );
  }
}
