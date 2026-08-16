import { definePage, useLoaderData } from '@openelement/app';
import { requireAdmin } from '../../lib/authorization.ts';
import { createServerSupabase } from '../../lib/supabase-server.ts';
export const tagName = 'page-admin';
interface Data {
  email?: string;
  noteCount: number;
  error?: string;
}
export async function loader(
  ctx: { env: Record<string, string>; request: Request; responseHeaders: Headers },
): Promise<Data> {
  const supabase = createServerSupabase(ctx.env, ctx.request, ctx.responseHeaders);
  const { data: { user } } = await supabase.auth.getUser();
  requireAdmin(user);
  const { count, error } = await supabase.from('notes').select('id', {
    count: 'exact',
    head: true,
  });
  return { email: user?.email, noteCount: count ?? 0, error: error?.message };
}
const Page = definePage<Data>({
  renderIntent: { mode: 'dynamic' },
  head: { title: 'Admin' },
  render() {
    const data = useLoaderData() as Data;
    return (
      <main>
        <h1>Admin</h1>
        <p>signed-in:{data.email}</p>
        {data.error ? <p id='error'>{data.error}</p> : null}
        <p id='note-count'>notes:{data.noteCount}</p>
      </main>
    );
  },
});
customElements.define(tagName, Page);
export default Page;
