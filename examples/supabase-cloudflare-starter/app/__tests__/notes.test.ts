import { assert, assertEquals, assertRejects } from '@std/assert';
import { isActionFailure, isOpenElementRedirect } from '@openelement/app';

if (!('customElements' in globalThis)) {
  (globalThis as { customElements?: unknown }).customElements = {
    define: () => {},
    get: () => undefined,
  };
}

const {
  createNoteAction,
  createNotesLoader,
  MAX_NOTE_BODY_LENGTH,
  MAX_NOTE_TITLE_LENGTH,
} = await import('../routes/notes.tsx');
type NotesSupabaseClient = import('../routes/notes.tsx').NotesSupabaseClient;

const USER = { id: 'user-123', email: 'tester@example.com' };

function stubClient(overrides: {
  user?: typeof USER | null;
  notes?: { id: string; title: string; body: string; created_at: string }[];
  selectError?: { message: string } | null;
  insertError?: { message: string } | null;
  onSelect?: (columns: string) => void;
  onInsert?: (values: { user_id: string; title: string; body: string }) => void;
}): () => NotesSupabaseClient {
  const {
    user = USER,
    notes = [],
    selectError = null,
    insertError = null,
    onSelect,
    onInsert,
  } = overrides;
  return () => ({
    auth: {
      getUser: () => Promise.resolve({ data: { user } }),
      getSession: () => Promise.resolve({ data: { session: { access_token: 'token' } } }),
    },
    from: () => ({
      select: (columns: string) => {
        onSelect?.(columns);
        return {
          order: () => Promise.resolve({ data: notes, error: selectError }),
        };
      },
      insert: (values) => {
        onInsert?.(values);
        return Promise.resolve({ error: insertError });
      },
    }),
  });
}

const ctx = () => ({
  request: new Request('http://localhost/notes'),
  env: { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_ANON_KEY: 'anon' },
  responseHeaders: new Headers(),
});

function form(title = 'First note', body = 'Hello'): FormData {
  const data = new FormData();
  data.set('title', title);
  data.set('body', body);
  return data;
}

Deno.test('notes loader denies anonymous requests', async () => {
  assertEquals(await createNotesLoader(stubClient({ user: null }))(ctx()), { denied: true });
});

Deno.test('notes loader returns the signed-in owner rows', async () => {
  const notes = [{ id: '1', title: 'first', body: 'mine', created_at: '2026-08-17T00:00:00Z' }];
  let selected = '';
  const result = await createNotesLoader(stubClient({ notes, onSelect: (c) => selected = c }))(
    ctx(),
  );
  assertEquals(selected, 'id, title, body, created_at');
  assertEquals(result.denied, false);
  assertEquals(result.notes, notes);
  assertEquals(result.live?.userId, USER.id);
});

Deno.test('create note rejects anonymous writes with 401', async () => {
  const result = await createNoteAction(stubClient({ user: null }))({ ...ctx(), formData: form() });
  assert(isActionFailure(result));
  assertEquals(result.status, 401);
});

Deno.test('create note validates required and bounded input', async () => {
  const action = createNoteAction(stubClient({}));
  for (
    const data of [
      form('   ', 'body'),
      form('x'.repeat(MAX_NOTE_TITLE_LENGTH + 1), 'body'),
      form('title', 'x'.repeat(MAX_NOTE_BODY_LENGTH + 1)),
    ]
  ) {
    const result = await action({ ...ctx(), formData: data });
    assert(isActionFailure(result));
    assertEquals(result.status, 422);
  }
});

Deno.test('create note stamps the authenticated owner and redirects with PRG', async () => {
  let inserted: { user_id: string; title: string; body: string } | undefined;
  const action = createNoteAction(stubClient({ onInsert: (values) => inserted = values }));
  const error = await assertRejects(() =>
    action({ ...ctx(), formData: form(' Title ', ' Body ') })
  );
  assert(isOpenElementRedirect(error));
  assertEquals(inserted, { user_id: USER.id, title: 'Title', body: 'Body' });
});

Deno.test('create note returns database/RLS errors as 422 without redirecting', async () => {
  const action = createNoteAction(stubClient({ insertError: { message: 'row level security' } }));
  const result = await action({ ...ctx(), formData: form() });
  assert(isActionFailure(result));
  assertEquals(result.status, 422);
  assertEquals(result.data?.error, 'row level security');
});
