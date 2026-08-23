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
 *
 * The create form opts into data-open-enhance, so duplicate submission
 * behavior is explicit: the enhancement layer ignores a second submit of
 * the same form while one is in flight (#564), turning a double-click into
 * exactly one INSERT. Without JavaScript the form degrades to a native
 * POST whose PRG redirect guards refresh resubmission only — rapid native
 * retries create one row each (the create path is not idempotent).
 */
import {
  type ActionContext,
  definePage,
  fail,
  type LoaderContext,
  type OpenElementActionFailure,
  redirect,
  useActionData,
  useLoaderData,
} from '@openelement/app';
import { createServerSupabase } from '../../lib/supabase-server.ts';
import '../islands/notes-live.tsx';

export const tagName = 'page-notes';

interface NoteRow {
  id: string;
  title: string;
  body: string;
  created_at: string;
}

interface NotesData {
  denied: boolean;
  email?: string;
  notes?: NoteRow[];
  error?: string;
  /** Public realtime wiring for the notes-live island (anon key is public
   * by design; events are hard-filtered to the owner's user_id). The
   * access token is the user's own short-lived JWT — Realtime scopes
   * postgres_changes by RLS, so the anon role alone would receive nothing. */
  live?: { url: string; anonKey: string; userId: string; accessToken: string };
}

interface CreateNoteData {
  error?: string;
  title?: string;
  body?: string;
}

export interface NotesSupabaseClient {
  auth: {
    getUser(): Promise<{
      data: { user: { id: string; email?: string } | null };
    }>;
    getSession(): Promise<{
      data: { session: { access_token: string } | null };
    }>;
  };
  from(table: 'notes'): {
    select(columns: string): {
      order(
        column: string,
        options: { ascending: boolean },
      ): PromiseLike<{
        data: NoteRow[] | null;
        error: { message: string } | null;
      }>;
    };
    insert(values: { user_id: string; title: string; body: string }): PromiseLike<{
      error: { message: string } | null;
    }>;
  };
}

export type NotesClientFactory = (
  env: Record<string, string>,
  request: Request,
  responseHeaders: Headers,
) => NotesSupabaseClient;

export const MAX_NOTE_TITLE_LENGTH = 120;
export const MAX_NOTE_BODY_LENGTH = 10_000;

export function createNotesLoader(createClient: NotesClientFactory = createServerSupabase) {
  return async function loader(ctx: LoaderContext<Record<string, string>>): Promise<NotesData> {
    const supabase = createClient(ctx.env, ctx.request, ctx.responseHeaders);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { denied: true };
    const { data: notes, error } = await supabase
      .from('notes')
      .select('id, title, body, created_at')
      .order('created_at', { ascending: false });
    if (error) return { denied: false, email: user.email, error: error.message };
    const { data: { session } } = await supabase.auth.getSession();
    return {
      denied: false,
      email: user.email,
      notes: notes ?? [],
      live: {
        url: ctx.env.SUPABASE_URL ?? '',
        anonKey: ctx.env.SUPABASE_ANON_KEY ?? '',
        userId: user.id,
        accessToken: session?.access_token ?? '',
      },
    };
  };
}

export function createNoteAction(createClient: NotesClientFactory = createServerSupabase) {
  return async function create(
    ctx: ActionContext<Record<string, string>>,
  ): Promise<OpenElementActionFailure<CreateNoteData>> {
    const title = String(ctx.formData.get('title') ?? '').trim();
    const body = String(ctx.formData.get('body') ?? '').trim();
    if (!title) return fail(422, { error: 'title is required', title, body });
    if (title.length > MAX_NOTE_TITLE_LENGTH) {
      return fail(422, { error: 'title exceeds 120 characters', title, body });
    }
    if (body.length > MAX_NOTE_BODY_LENGTH) {
      return fail(422, { error: 'body exceeds 10000 characters', title, body });
    }
    const supabase = createClient(ctx.env, ctx.request, ctx.responseHeaders);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return fail(401, { error: 'sign-in required to create notes', title, body });
    const { error } = await supabase.from('notes').insert({
      user_id: user.id,
      title,
      body,
    });
    if (error) return fail(422, { error: error.message, title, body });
    throw redirect('/notes');
  };
}

export const loader = createNotesLoader();

export const actions = {
  create: createNoteAction(),
  async logout(ctx: {
    env: Record<string, string>;
    request: Request;
    responseHeaders: Headers;
  }): Promise<never> {
    const supabase = createServerSupabase(
      ctx.env,
      ctx.request,
      ctx.responseHeaders,
    );
    await supabase.auth.signOut();
    throw redirect('/login');
  },
};

const NotesPage = definePage<NotesData>({
  renderIntent: { mode: 'dynamic' },
  head: { title: 'Notes — reference starter' },
  render() {
    const data = useLoaderData() as NotesData;
    const actionData = useActionData() as CreateNoteData | undefined;
    if (data.denied) {
      return (
        <main>
          <h1>Notes</h1>
          <section id='denied'>
            <p>
              Sign-in is required to read notes. RLS rejects anonymous access server-side.
            </p>
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
        {actionData?.error ? <p id='action-error'>{actionData.error}</p> : null}
        <form method='post' action='/notes?/create' data-open-enhance>
          <p>
            <label>
              Title{' '}
              <input
                name='title'
                maxlength={MAX_NOTE_TITLE_LENGTH}
                value={actionData?.title ?? ''}
                required
              />
            </label>
          </p>
          <p>
            <label>
              Body{' '}
              <textarea name='body' maxlength={MAX_NOTE_BODY_LENGTH}>
                {actionData?.body ?? ''}
              </textarea>
            </label>
          </p>
          <button type='submit'>Create note</button>
        </form>
        <ul id='notes'>
          {(data.notes ?? []).map((note) => (
            <li key={note.id}>
              <strong>{note.title}</strong> — {note.body}
            </li>
          ))}
        </ul>
        {data.live
          ? (
            <notes-live
              data-url={data.live.url}
              data-key={data.live.anonKey}
              data-user-id={data.live.userId}
              data-access-token={data.live.accessToken}
            >
            </notes-live>
          )
          : null}
        <form method='post' action='/notes?/logout'>
          <button type='submit'>Sign out</button>
        </form>
        <p>
          <a href='/upload'>Upload a file</a>
        </p>
      </main>
    );
  },
});

customElements.define(tagName, NotesPage);
export default NotesPage;
