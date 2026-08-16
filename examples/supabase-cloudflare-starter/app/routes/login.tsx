/**
 * /login — email+password sign-in (reference starter, #983).
 *
 * The action authenticates via Supabase; the @supabase/ssr cookie adapter
 * (lib/supabase-server.ts) writes the session cookies through the ADR-0129
 * response-header channel, then the action redirects (PRG). Failures
 * re-render with a 422 + error echo.
 */
import { definePage, fail, type OpenElementActionFailure, redirect } from '@openelement/app';
import { createServerSupabase } from '../../lib/supabase-server.ts';

export const tagName = 'page-login';

interface LoginActionData {
  error?: string;
  email?: string;
}

export async function action(ctx: {
  formData: FormData;
  env: Record<string, string>;
  request: Request;
  responseHeaders: Headers;
}): Promise<OpenElementActionFailure<LoginActionData>> {
  const email = String(ctx.formData.get('email') ?? '').trim();
  const password = String(ctx.formData.get('password') ?? '');
  if (!email || !password) {
    return fail(422, { error: 'email and password are required', email });
  }
  const supabase = createServerSupabase(ctx.env, ctx.request, ctx.responseHeaders);
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return fail(422, { error: error.message, email });
  }
  throw redirect('/notes');
}

const LoginPage = definePage({
  renderIntent: { mode: 'dynamic' },
  head: { title: 'Sign in — reference starter' },
  render() {
    return (
      <main>
        <h1>Sign in</h1>
        <form method='post'>
          <p>
            <label>
              Email <input type='email' name='email' required />
            </label>
          </p>
          <p>
            <label>
              Password <input type='password' name='password' required />
            </label>
          </p>
          <button type='submit'>Sign in</button>
        </form>
        <p>
          <a href='/notes'>Back to notes</a>
        </p>
      </main>
    );
  },
});

customElements.define(tagName, LoginPage);
export default LoginPage;
