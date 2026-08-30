/**
 * /freshness page element — records ISR/cache intent with a 300 second
 * revalidate window. In 0.44 the revalidate value is a forward-compatible
 * record only — no cache is wired to it (ISR is not wired into the 0.44
 * request-time server entry), so this page renders statically at build time
 * like any other static route. Light root: the page rules live in the global
 * baseline (vite.config.ts).
 */
import { OpenElement } from '@openelement/element';

declare function element(
  tag: string,
  options?: { root: 'light' | 'shadow-open' | 'shadow-closed' },
): ClassDecorator;

@element('freshness-page', { root: 'light' })
export default class FreshnessPage extends OpenElement {
  render() {
    return (
      <main>
        <h1>Freshness proof</h1>
        <p>
          This page records ISR/cache intent with a 300 second revalidate window. In 0.44 the
          revalidate value is a forward-compatible record only — no cache is wired to it — so this
          page renders statically at build time like any other static route.
        </p>
      </main>
    );
  }
}
