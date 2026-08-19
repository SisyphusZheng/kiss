import {
  definePage,
  fail,
  type OpenElementActionFailure,
  redirect,
  useActionData,
  useLoaderData,
} from '@openelement/app';
import { publicAuthError } from '../../lib/auth-security.ts';
import { createServerSupabase } from '../../lib/supabase-server.ts';
import { authRequestAllowed, type RateLimitEnv } from '../../lib/rate-limit.ts';
export const tagName = 'page-recover';
interface ActionData {
  error?: string;
}
interface LoaderData {
  sent: boolean;
}
export function loader(ctx: { request: Request }): LoaderData {
  return { sent: new URL(ctx.request.url).searchParams.has('sent') };
}
export interface RecoverAuthClient {
  auth: {
    resetPasswordForEmail(
      email: string,
      options: { redirectTo: string },
    ): PromiseLike<{ error: { message: string } | null }>;
  };
}
export type RecoverClientFactory = (
  env: RateLimitEnv,
  request: Request,
  responseHeaders: Headers,
) => RecoverAuthClient;
export function createRecoverAction(createClient: RecoverClientFactory = createServerSupabase) {
  return async function action(
    ctx: {
      formData: FormData;
      env: RateLimitEnv;
      request: Request;
      responseHeaders: Headers;
    },
  ): Promise<OpenElementActionFailure<ActionData>> {
    if (!(await authRequestAllowed(ctx.env, ctx.request, 'recovery'))) {
      return fail(429, { error: 'too many attempts; retry later' });
    }
    const email = String(ctx.formData.get('email') ?? '').trim();
    if (!email) return fail(422, { error: 'email is required' });
    const redirectTo = new URL('/auth/callback?next=/reset-password', ctx.request.url).href;
    const { error } = await createClient(ctx.env, ctx.request, ctx.responseHeaders).auth
      .resetPasswordForEmail(email, { redirectTo });
    if (error) return fail(422, { error: publicAuthError(error) });
    // Success is PRG (#1060): fail() accepts only 4xx, so the confirmation
    // state lives behind ?sent=1 instead of a 200 fail().
    throw redirect('/recover?sent=1');
  };
}
export const action = createRecoverAction();
const Page = definePage({
  renderIntent: { mode: 'dynamic' },
  head: { title: 'Recover password' },
  render() {
    const result = useActionData() as ActionData | undefined;
    const data = useLoaderData() as LoaderData | undefined;
    return (
      <main>
        <h1>Recover password</h1>
        {result?.error ? <p id='error'>{result.error}</p> : null}
        {data?.sent
          ? <p id='message'>If the account exists, a recovery email has been sent.</p>
          : null}
        <form method='post'>
          <label>
            Email <input type='email' name='email' required />
          </label>
          <button type='submit'>Send recovery email</button>
        </form>
      </main>
    );
  },
});
customElements.define(tagName, Page);
export default Page;
