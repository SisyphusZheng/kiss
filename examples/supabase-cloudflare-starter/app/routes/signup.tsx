import {
  definePage,
  fail,
  type OpenElementActionFailure,
  redirect,
  useActionData,
  useLoaderData,
} from '@openelement/app';
import { publicAuthError, safeInternalNext } from '../../lib/auth-security.ts';
import { createServerSupabase } from '../../lib/supabase-server.ts';
import { authRequestAllowed, type RateLimitEnv } from '../../lib/rate-limit.ts';

export const tagName = 'page-signup';
interface ActionData {
  error?: string;
  email?: string;
}
interface LoaderData {
  sent: boolean;
}

export function loader(ctx: { request: Request }): LoaderData {
  return { sent: new URL(ctx.request.url).searchParams.has('sent') };
}

export interface SignupAuthClient {
  auth: {
    signUp(credentials: {
      email: string;
      password: string;
      options: { emailRedirectTo: string };
    }): PromiseLike<{
      data: { session: unknown };
      error: { message: string } | null;
    }>;
  };
}
export type SignupClientFactory = (
  env: RateLimitEnv,
  request: Request,
  responseHeaders: Headers,
) => SignupAuthClient;

export function createSignupAction(createClient: SignupClientFactory = createServerSupabase) {
  return async function action(ctx: {
    formData: FormData;
    env: RateLimitEnv;
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
    const { data, error } = await createClient(ctx.env, ctx.request, ctx.responseHeaders).auth
      .signUp({
        email,
        password,
        options: { emailRedirectTo: callback.href },
      });
    if (error) return fail(422, { error: publicAuthError(error), email });
    if (data.session) throw redirect(next);
    // Success is PRG (#1060): fail() accepts only 4xx, so the confirmation
    // state lives behind ?sent=1 instead of a 200 fail().
    throw redirect('/signup?sent=1');
  };
}

export const action = createSignupAction();

const Page = definePage({
  renderIntent: { mode: 'dynamic' },
  head: { title: 'Sign up' },
  render() {
    const result = useActionData() as ActionData | undefined;
    const data = useLoaderData() as LoaderData | undefined;
    return (
      <main>
        <h1>Sign up</h1>
        {result?.error ? <p id='error'>{result.error}</p> : null}
        {data?.sent ? <p id='message'>Check your email to confirm the account.</p> : null}
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
