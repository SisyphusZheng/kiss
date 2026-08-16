import { definePage, fail, type OpenElementActionFailure, useActionData } from '@openelement/app';
import { publicAuthError, safeInternalNext } from '../../lib/auth-security.ts';
import { createServerSupabase } from '../../lib/supabase-server.ts';
import { authRequestAllowed, type WorkerEnv } from '../../lib/rate-limit.ts';

export const tagName = 'page-magic-link';
interface ActionData {
  error?: string;
  message?: string;
  email?: string;
}
export async function action(
  ctx: {
    formData: FormData;
    env: WorkerEnv;
    request: Request;
    responseHeaders: Headers;
  },
): Promise<OpenElementActionFailure<ActionData>> {
  if (!(await authRequestAllowed(ctx.env, ctx.request, 'magic-link'))) {
    return fail(429, { error: 'too many attempts; retry later' });
  }
  const email = String(ctx.formData.get('email') ?? '').trim();
  if (!email) return fail(422, { error: 'email is required' });
  const callback = new URL('/auth/callback', ctx.request.url);
  callback.searchParams.set('next', safeInternalNext(String(ctx.formData.get('next') ?? '/notes')));
  const { error } = await createServerSupabase(ctx.env, ctx.request, ctx.responseHeaders).auth
    .signInWithOtp({ email, options: { emailRedirectTo: callback.href } });
  if (error) return fail(422, { error: publicAuthError(error), email });
  return fail(200, { message: 'Check your email for a sign-in link.', email });
}
const Page = definePage({
  renderIntent: { mode: 'dynamic' },
  head: { title: 'Magic Link' },
  render() {
    const result = useActionData() as ActionData | undefined;
    return (
      <main>
        <h1>Magic Link</h1>
        {result?.error ? <p id='error'>{result.error}</p> : null}
        {result?.message ? <p id='message'>{result.message}</p> : null}
        <form method='post'>
          <label>
            Email <input type='email' name='email' value={result?.email ?? ''} required />
          </label>
          <button type='submit'>Send link</button>
        </form>
      </main>
    );
  },
});
customElements.define(tagName, Page);
export default Page;
