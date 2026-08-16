/**
 * /notes — RLS-protected resource (reference starter, #983).
 *
 * The loader reads the session from the request cookies (via @supabase/ssr)
 * and queries the notes table with the user's JWT — RLS scopes the rows
 * server-side. Anonymous requests render the denied branch; the same
 * anonymous select would also be rejected by the database.
 *
 * The page also hosts the sign-out action (named action `logout` on POST
 * /notes), which clears the session cookies through the same channel.
 */
import { definePage, redirect, useLoaderData } from '@openelement/app';
import { createServerSupabase } from '../../lib/supabase-server.ts';

export const tagName = 'page-notes';

interface NoteRow {
  id: string;
  body: string;
  created_at: string;
}

interface NotesData {
  denied: boolean;
  email?: string;
  notes?: NoteRow[];
  error?: string;
}

export async function loader(ctx: {
  request: Request;
  env: Record<string, string>;
  responseHeaders: Headers;
}): Promise<NotesData> {
  const supabase = createServerSupabase(ctx.env, ctx.request, ctx.responseHeaders);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { denied: true };
  const { data: notes, error } = await supabase
    .from('notes')
    .select('id, body, created_at')
    .order('created_at', { ascending: false });
  if (error) return { denied: false, email: user.email, error: error.message };
  return { denied: false, email: user.email, notes: notes ?? [] };
}

export const actions = {
  async logout(ctx: {
    env: Record<string, string>;
    request: Request;
    responseHeaders: Headers;
  }): Promise<never> {
    const supabase = createServerSupabase(ctx.env, ctx.request, ctx.responseHeaders);
    await supabase.auth.signOut();
    throw redirect('/login');
  },
};

const NotesPage = definePage<NotesData>({
  renderIntent: { mode: 'dynamic' },
  head: { title: 'Notes — reference starter' },
  render() {
    const data = useLoaderData() as NotesData;
    if (data.denied) {
      return (
        <main>
          <h1>Notes</h1>
          <section id='denied'>
            <p>Sign-in is required to read notes. RLS rejects anonymous access server-side.</p>
            <p>
              <a href='/login'>Go to sign-in</a>
            </p>
          </section>
        </main>
      );
    }
    return (
      <main>
        <h1>Notes</h1>
        <p id='who'>signed-in:{data.email}</p>
        {data.error ? <p id='error'>{data.error}</p> : null}
        <ul id='notes'>
          {(data.notes ?? []).map((note) => <li key={note.id}>{note.body}</li>)}
        </ul>
        <form method='post' action='/notes?/logout'>
          <button type='submit'>Sign out</button>
        </form>
      </main>
    );
  },
});

customElements.define(tagName, NotesPage);
export default NotesPage;
