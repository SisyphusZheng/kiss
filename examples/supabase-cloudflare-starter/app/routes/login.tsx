/**
 * /login — sign-in page (skeleton phase).
 *
 * The sign-in action writes the session cookie, which needs the
 * response-header channel from an action (amendment ADR-0129, drafted by
 * the senior side). Until it is accepted, this page renders the honest
 * state: sign-in is coming, and /notes shows its anonymous-denied branch.
 */
import { definePage } from '@openelement/app';

export const tagName = 'page-login';

const LoginPage = definePage({
  renderIntent: { mode: 'dynamic' },
  head: { title: 'Sign in — reference starter' },
  render() {
    return (
      <main>
        <h1>Sign in</h1>
        <p id='pending'>
          Sign-in lands with amendment ADR-0129 (response-header channel for action cookie writes).
        </p>
        <p>
          <a href='/notes'>Back to notes</a>
        </p>
      </main>
    );
  },
});

customElements.define(tagName, LoginPage);
export default LoginPage;
