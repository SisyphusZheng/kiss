/**
 * static-only home page — canonical compiled page element (v0.44, ADR-0143).
 *
 * The route module (app/routes/index.tsx) default-exports this class wrapped
 * in definePage(); the compiled Part Program is the render — there is no
 * runtime JSX path. The ambient decorator declarations exist only so the
 * module typechecks standalone (the open:compiled-element transform erases
 * them); see __fixtures__/compiled-element-spike/counter.tsx.
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
        <h1 id='home-marker'>static-only fixture home</h1>
      </main>
    );
  }
}
