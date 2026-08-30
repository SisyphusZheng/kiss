/** /reset-password page element (v0.44 compiled). */
import { OpenElement } from '@openelement/element';

declare function element(
  tag: string,
  options?: { root: 'light' | 'shadow-open' | 'shadow-closed' },
): ClassDecorator;
declare function property(
  options: { reflect: boolean; attribute?: false },
): (target: undefined, context: ClassFieldDecoratorContext) => void;

@element('reset-password-page', { root: 'shadow-open' })
export default class ResetPasswordPage extends OpenElement {
  @property({ reflect: false, attribute: false })
  errorText = '';

  render() {
    return (
      <main>
        <h1>Reset password</h1>
        <p id='error'>{this.errorText}</p>
        <form method='post'>
          <label>
            New password <input type='password' name='password' minlength={8} required />
          </label>
          <button type='submit'>Set password</button>
        </form>
      </main>
    );
  }
}
