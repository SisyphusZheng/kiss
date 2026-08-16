import {
  definePage,
  fail,
  type OpenElementActionFailure,
  redirect,
  useActionData,
} from '@openelement/app';
import { publicAuthError, safeInternalNext } from '../../lib/auth-security.ts';
import { createServerSupabase } from '../../lib/supabase-server.ts';
import { authRequestAllowed, type WorkerEnv } from '../../lib/rate-limit.ts';

export const tagName = 'page-signup';
interface ActionData {
  error?: string;
  message?: string;
  email?: string;
}

export async function action(ctx: {
  formData: FormData;
  env: WorkerEnv;
  request: Request;
  responseHeaders: Headers;
}): Promise<OpenElementActionFailure<ActionData>> {
  if (!(await authRequestAllowed(ctx.env, ctx.request, 'signup'))) {
    return fail(429, { error: 'too many attempts; retry later' });
  }
  const email = String(ctx.formData.get('email') ?? '').trim();
  const password = String(ctx.formData.get('password') ?? '');
  const next = safeInternalNext(String(ctx.formData.get('next') ?? '/notes'));
  if (!email || password.length < 8) {
    return fail(422, { error: 'email and an 8+ character password are required', email });
  }
  const callback = new URL('/auth/callback', ctx.request.url);
  callback.searchParams.set('next', next);
  const supabase = createServerSupabase(ctx.env, ctx.request, ctx.responseHeaders);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: callback.href },
  });
  if (error) return fail(422, { error: publicAuthError(error), email });
  if (data.session) throw redirect(next);
  return fail(200, { message: 'Check your email to confirm the account.', email });
}

const Page = definePage({
  renderIntent: { mode: 'dynamic' },
  head: { title: 'Sign up' },
  render() {
    const result = useActionData() as ActionData | undefined;
    return (
      <main>
        <h1>Sign up</h1>
        {result?.error ? <p id='error'>{result.error}</p> : null}
        {result?.message ? <p id='message'>{result.message}</p> : null}
        <form method='post'>
          <label>
            Email <input type='email' name='email' value={result?.email ?? ''} required />
          </label>
          <label>
            Password <input type='password' name='password' minlength={8} required />
          </label>
          <input type='hidden' name='next' value='/notes' />
          <button type='submit'>Create account</button>
        </form>
        <a href='/login'>Sign in</a>
      </main>
    );
  },
});
customElements.define(tagName, Page);
export default Page;
