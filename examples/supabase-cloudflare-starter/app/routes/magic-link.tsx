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

export const tagName = 'page-magic-link';
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
export interface MagicLinkAuthClient {
  auth: {
    signInWithOtp(credentials: {
      email: string;
      options: { emailRedirectTo: string };
    }): PromiseLike<{ error: { message: string } | null }>;
  };
}
export type MagicLinkClientFactory = (
  env: RateLimitEnv,
  request: Request,
  responseHeaders: Headers,
) => MagicLinkAuthClient;
export function createMagicLinkAction(createClient: MagicLinkClientFactory = createServerSupabase) {
  return async function action(
    ctx: {
      formData: FormData;
      env: RateLimitEnv;
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
    callback.searchParams.set(
      'next',
      safeInternalNext(String(ctx.formData.get('next') ?? '/notes')),
    );
    const { error } = await createClient(ctx.env, ctx.request, ctx.responseHeaders).auth
      .signInWithOtp({ email, options: { emailRedirectTo: callback.href } });
    if (error) return fail(422, { error: publicAuthError(error), email });
    // Success is PRG (#1060): fail() accepts only 4xx, so the confirmation
    // state lives behind ?sent=1 instead of a 200 fail().
    throw redirect('/magic-link?sent=1');
  };
}
export const action = createMagicLinkAction();
const Page = definePage({
  renderIntent: { mode: 'dynamic' },
  head: { title: 'Magic Link' },
  render() {
    const result = useActionData() as ActionData | undefined;
    const data = useLoaderData() as LoaderData | undefined;
    return (
      <main>
        <h1>Magic Link</h1>
        {result?.error ? <p id='error'>{result.error}</p> : null}
        {data?.sent ? <p id='message'>Check your email for a sign-in link.</p> : null}
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
