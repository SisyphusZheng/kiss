/** /auth/callback page element (v0.44 compiled). The PKCE exchange runs in the loader; the page renders the outcome. */
import { OpenElement } from '@openelement/element';

declare function element(
  tag: string,
  options?: { root: 'light' | 'shadow-open' | 'shadow-closed' },
): ClassDecorator;
declare function property(
  options: { reflect: boolean; attribute?: false },
): (target: undefined, context: ClassFieldDecoratorContext) => void;

@element('auth-callback', { root: 'shadow-open' })
export default class AuthCallbackPage extends OpenElement {
  @property({ reflect: false, attribute: false })
  errorText = '';

  render() {
    return (
      <main>
        <h1>Authentication</h1>
        <p id='error'>{this.errorText}</p>
        <a href='/login'>Request a new sign-in link</a>
      </main>
    );
  }
}
