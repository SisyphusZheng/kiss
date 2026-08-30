/**
 * /magic-link page element (v0.44 compiled). Request-time rendered; the props
 * projector lives in app/route-logic/magic-link.ts.
 */
import { OpenElement } from '@openelement/element';

declare function element(
  tag: string,
  options?: { root: 'light' | 'shadow-open' | 'shadow-closed' },
): ClassDecorator;
declare function property(
  options: { reflect: boolean; attribute?: false },
): (target: undefined, context: ClassFieldDecoratorContext) => void;

@element('magic-link-page', { root: 'shadow-open' })
export default class MagicLinkPage extends OpenElement {
  @property({ reflect: false, attribute: false })
  errorText = '';

  @property({ reflect: false, attribute: false })
  email = '';

  @property({ reflect: false, attribute: false })
  sent = 0;

  render() {
    return (
      <main>
        <h1>Magic Link</h1>
        <p id='error'>{this.errorText}</p>
        <form method='post'>
          <label>
            Email <input type='email' name='email' value={this.email} required />
          </label>
          <button type='submit'>Send link</button>
        </form>
        {this.sent > 0 ? <p id='message'>Check your email for a sign-in link.</p> : <span></span>}
      </main>
    );
  }
}
