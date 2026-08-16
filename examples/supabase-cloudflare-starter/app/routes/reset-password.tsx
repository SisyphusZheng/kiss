import {
  definePage,
  fail,
  type OpenElementActionFailure,
  redirect,
  useActionData,
} from '@openelement/app';
import { publicAuthError } from '../../lib/auth-security.ts';
import { createServerSupabase } from '../../lib/supabase-server.ts';
export const tagName = 'page-reset-password';
interface ActionData {
  error?: string;
}
export async function action(
  ctx: {
    formData: FormData;
    env: Record<string, string>;
    request: Request;
    responseHeaders: Headers;
  },
): Promise<OpenElementActionFailure<ActionData>> {
  const password = String(ctx.formData.get('password') ?? '');
  if (password.length < 8) return fail(422, { error: 'an 8+ character password is required' });
  const supabase = createServerSupabase(ctx.env, ctx.request, ctx.responseHeaders);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return fail(401, { error: 'request a new recovery link' });
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return fail(422, { error: publicAuthError(error) });
  throw redirect('/notes');
}
const Page = definePage({
  renderIntent: { mode: 'dynamic' },
  head: { title: 'Reset password' },
  render() {
    const result = useActionData() as ActionData | undefined;
    return (
      <main>
        <h1>Reset password</h1>
        {result?.error ? <p id='error'>{result.error}</p> : null}
        <form method='post'>
          <label>
            New password <input type='password' name='password' minlength={8} required />
          </label>
          <button type='submit'>Set password</button>
        </form>
      </main>
    );
  },
});
customElements.define(tagName, Page);
export default Page;
