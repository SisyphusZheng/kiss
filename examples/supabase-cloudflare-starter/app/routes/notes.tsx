/**
 * /notes — RLS-protected resource (reference starter, #983).
 *
 * Anonymous-denied path (skeleton phase, ADR-0129 pending): session
 * read-back needs the response-header channel, so loaders currently see an
 * anonymous session and render the denied branch. The protection is not
 * only the UX path — the notes table has RLS enabled with owner-scoped
 * policies only, so an anonymous client is rejected at the database
 * regardless of application code.
 */
import { definePage } from '@openelement/app';
import { createServerSupabase } from '../../lib/supabase-server.ts';

export const tagName = 'page-notes';

export async function loader(
  ctx: { request: Request; env: Record<string, string> },
): Promise<{ denied: boolean }> {
  const supabase = createServerSupabase(ctx.env);
  const { session } = await supabase.readSession();
  // ponytail: when ADR-0129 lands, query notes here through the Supabase
  // client (RLS rejects anonymous selects server-side). Until then the
  // denied branch is the only reachable state.
  return { denied: session === null };
}

const NotesPage = definePage<{ denied: boolean }>({
  renderIntent: { mode: 'dynamic' },
  head: { title: 'Notes — reference starter' },
  render({ data }) {
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
        <p>Your notes will render here once sign-in lands (ADR-0129).</p>
      </main>
    );
  },
});

customElements.define(tagName, NotesPage);
export default NotesPage;
