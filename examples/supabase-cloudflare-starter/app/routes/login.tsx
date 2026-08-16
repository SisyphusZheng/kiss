/**
 * /login — email+password sign-in (reference starter, #983).
 *
 * The action authenticates via Supabase; the @supabase/ssr cookie adapter
 * (lib/supabase-server.ts) writes the session cookies through the ADR-0129
 * response-header channel, then the action redirects (PRG). Failures
 * re-render with a 422 + error echo.
 */
import {
  definePage,
  fail,
  type OpenElementActionFailure,
  redirect,
  useActionData,
} from '@openelement/app';
import { publicAuthError } from '../../lib/auth-security.ts';
import { createServerSupabase } from '../../lib/supabase-server.ts';
import { authRequestAllowed, type WorkerEnv } from '../../lib/rate-limit.ts';

export const tagName = 'page-login';

interface LoginActionData {
  error?: string;
  email?: string;
}

export interface LoginAuthClient {
  auth: {
    signInWithPassword(credentials: { email: string; password: string }): PromiseLike<{
      error: { message: string } | null;
    }>;
  };
}

export type LoginClientFactory = (
  env: WorkerEnv,
  request: Request,
  responseHeaders: Headers,
) => LoginAuthClient;

export function createLoginAction(createClient: LoginClientFactory = createServerSupabase) {
  return async function action(ctx: {
    formData: FormData;
    env: WorkerEnv;
    request: Request;
    responseHeaders: Headers;
  }): Promise<OpenElementActionFailure<LoginActionData>> {
    if (!(await authRequestAllowed(ctx.env, ctx.request, 'login'))) {
      return fail(429, { error: 'too many attempts; retry later' });
    }
    const email = String(ctx.formData.get('email') ?? '').trim();
    const password = String(ctx.formData.get('password') ?? '');
    if (!email || !password) {
      return fail(422, { error: 'email and password are required', email });
    }
    const client = createClient(ctx.env, ctx.request, ctx.responseHeaders);
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) return fail(422, { error: publicAuthError(error), email });
    throw redirect('/notes');
  };
}

export const action = createLoginAction();

const LoginPage = definePage({
  renderIntent: { mode: 'dynamic' },
  head: { title: 'Sign in — reference starter' },
  render() {
    const result = useActionData() as LoginActionData | undefined;
    return (
      <main>
        <h1>Sign in</h1>
        {result?.error ? <p id='error'>{result.error}</p> : null}
        <form method='post'>
          <p>
            <label>
              Email <input type='email' name='email' value={result?.email ?? ''} required />
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
          <a href='/signup'>Create account</a> · <a href='/magic-link'>Use a Magic Link</a> ·{' '}
          <a href='/recover'>Forgot password?</a>
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
