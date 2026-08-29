/**
 * /set-cookie page element — edge-case probe page (compiled, v0.44). The
 * action lives in the route module.
 */
import { OpenElement } from '@openelement/element';

declare function element(
  tag: string,
  options?: { root: 'light' | 'shadow-open' | 'shadow-closed' },
): ClassDecorator;

@element('set-cookie', { root: 'shadow-open' })
export default class SetCookiePage extends OpenElement {
  render() {
    return (
      <main>
        <h1>set-cookie probe</h1>
      </main>
    );
  }
}
