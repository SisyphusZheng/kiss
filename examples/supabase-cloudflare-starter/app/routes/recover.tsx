import { definePage, fail, type OpenElementActionFailure, useActionData } from '@openelement/app';
import { publicAuthError } from '../../lib/auth-security.ts';
import { createServerSupabase } from '../../lib/supabase-server.ts';
import { authRequestAllowed, type WorkerEnv } from '../../lib/rate-limit.ts';
export const tagName = 'page-recover';
interface ActionData {
  error?: string;
  message?: string;
}
export async function action(
  ctx: {
    formData: FormData;
    env: WorkerEnv;
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
  const { error } = await createServerSupabase(ctx.env, ctx.request, ctx.responseHeaders).auth
    .resetPasswordForEmail(email, { redirectTo });
  if (error) return fail(422, { error: publicAuthError(error) });
  return fail(200, { message: 'If the account exists, a recovery email has been sent.' });
}
const Page = definePage({
  renderIntent: { mode: 'dynamic' },
  head: { title: 'Recover password' },
  render() {
    const result = useActionData() as ActionData | undefined;
    return (
      <main>
        <h1>Recover password</h1>
        {result?.error ? <p id='error'>{result.error}</p> : null}
        {result?.message ? <p id='message'>{result.message}</p> : null}
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
