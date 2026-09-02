/**
 * /freshness page element — prerendered statically at build time like any
 * other static route. v0.44 ships no route-level cache revalidation
 * semantics (ISR was removed, see issue #1217). Light root: the page rules
 * live in the global baseline (vite.config.ts).
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
          This page is prerendered statically at build time like any other static route. The
          framework ships no route-level cache revalidation in v0.44.
        </p>
      </main>
    );
  }
}
