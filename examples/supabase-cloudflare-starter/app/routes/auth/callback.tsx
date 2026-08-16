import { definePage, redirect, useLoaderData } from '@openelement/app';
import { publicAuthError, safeInternalNext } from '../../../lib/auth-security.ts';
import { createServerSupabase } from '../../../lib/supabase-server.ts';
export const tagName = 'page-auth-callback';
interface Data {
  error?: string;
}
export interface CallbackAuthClient {
  auth: {
    exchangeCodeForSession(code: string): PromiseLike<{ error: { message: string } | null }>;
  };
}
export type CallbackClientFactory = (
  env: Record<string, unknown>,
  request: Request,
  responseHeaders: Headers,
) => CallbackAuthClient;
export function createCallbackLoader(createClient: CallbackClientFactory = createServerSupabase) {
  return async function loader(ctx: {
    env: Record<string, unknown>;
    request: Request;
    responseHeaders: Headers;
  }): Promise<Data> {
    const url = new URL(ctx.request.url);
    const code = url.searchParams.get('code');
    if (!code) return { error: publicAuthError('missing code') };
    const { error } = await createClient(ctx.env, ctx.request, ctx.responseHeaders).auth
      .exchangeCodeForSession(code);
    if (error) return { error: publicAuthError(error) };
    throw redirect(safeInternalNext(url.searchParams.get('next')));
  };
}
export const loader = createCallbackLoader();
const Page = definePage<Data>({
  renderIntent: { mode: 'dynamic' },
  head: { title: 'Authentication callback' },
  render() {
    const data = useLoaderData() as Data;
    return (
      <main>
        <h1>Authentication</h1>
        <p id='error'>{data.error ?? 'Completing sign-in…'}</p>
        <a href='/login'>Request a new sign-in link</a>
      </main>
    );
  },
});
customElements.define(tagName, Page);
export default Page;
