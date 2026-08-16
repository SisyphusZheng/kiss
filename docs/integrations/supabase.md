# Supabase recipe (Auth + RLS + Storage + Realtime)

> Status: **verified against the maintained reference application** — every
> TypeScript, TSX, and SQL block below names its source file and is mechanically
> checked as a verbatim excerpt from
> `examples/supabase-cloudflare-starter` (#983), which was qualified
> end-to-end against a real Supabase project by the tier-2 workflow
> `.github/workflows/supabase-project-smoke.yml` (#984). The starter's built
> output is additionally boundary-gated on PRs by the tier-1 check
> `tools/check-fullstack-boundary.ts` (`deno task fullstack:boundary-check`).

openElement does not ship auth, a database client, or a vendor abstraction —
and no Supabase SDK is a framework dependency or public API. The composition
boundary (#981) is honest: Supabase owns Auth, RLS, Storage, and Realtime;
openElement owns routing, SSR/DSD, and the loader/action protocol. The two
meet at three Web-standard seams: the `Request` object, the ADR-0129
response-header channel, and `ctx.env`.

## Environment taxonomy

Three kinds of values, three different trust levels:

1. **Browser-safe: project URL + publishable anon key.** The anon key is
   public by design — Supabase row-level security, not key secrecy, is what
   enforces access. In the starter both live in the server env
   (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, read via `ctx.env`) and reach the
   browser only when a loader deliberately renders them — the `/notes`
   loader feeds them to the realtime island as data attributes. If your
   platform distinguishes `PUBLIC_`-prefixed build-time variables, these two
   are the pair that may carry such a prefix.
2. **Server-only: service-role key.** It bypasses RLS by design, so it must
   never reach a browser bundle — and the reference starter never reads it
   at all; it exists only as a CI secret for the smoke workflow's Auth
   admin-API calls (provisioning throwaway users). The tier-1 boundary gate
   enforces this on every PR: it scans all browser-reachable build output
   (`dist/index.html`, `dist/assets/**`; never `dist/server/**`) for
   `service_role` markers, `sb_secret_` key material, and JWT-shaped tokens,
   and asserts `.env.example` carries placeholders only.
3. **Per-request: the user's session JWT.** Transported in cookies written
   by the server client (below); the short-lived access token is rendered
   for the realtime island only, where it scopes the subscription through
   RLS (see the realtime section).

## Server client construction (Request + ADR-0129 channel)

`@supabase/ssr`'s server client reads the session from the incoming
`Request`'s Cookie header and writes session cookies through the
[ADR-0129 response-header channel](../adr/ADR-0129-response-header-channel.md)
(`ctx.responseHeaders`) — no framework session API required. Every
`Set-Cookie` carries the security floor: `HttpOnly; SameSite=Lax; Path=/`,
plus `Secure` on https.

```ts
// lib/supabase-server.ts
import { createServerClient } from '@supabase/ssr';
import { parseCookieHeader, serializeCookieHeader } from '@supabase/ssr';

export function createServerSupabase(
  env: Record<string, unknown>,
  request: Request,
  responseHeaders: Headers,
) {
  const url = typeof env.SUPABASE_URL === 'string' ? env.SUPABASE_URL : '';
  const anonKey = typeof env.SUPABASE_ANON_KEY === 'string' ? env.SUPABASE_ANON_KEY : '';
  if (!url || !anonKey) {
    throw new Error(
      '[reference starter] SUPABASE_URL and SUPABASE_ANON_KEY must be set in the worker env',
    );
  }
  // Secure follows the APPLICATION's origin, not the Supabase URL: the
  // cookie belongs to the app; over plain http (local/LAN) a Secure cookie
  // would be dropped by the browser and the session would vanish.
  const secure = new URL(request.url).protocol === 'https:';
  return createServerClient(url, anonKey, {
    cookies: {
      // parseCookieHeader marks value optional; GetAllCookies wants a
      // string — coerce missing values to ''.
      getAll: () =>
        parseCookieHeader(request.headers.get('cookie') ?? '').map((cookie) => ({
          name: cookie.name,
          value: cookie.value ?? '',
        })),
      setAll: (cookies) => {
        for (const { name, value, options } of cookies) {
          responseHeaders.append(
            'set-cookie',
            serializeCookieHeader(name, value, {
              ...options,
              httpOnly: true,
              path: '/',
              sameSite: 'lax',
              secure,
            }),
          );
        }
      },
    },
  });
}
```

This runs only inside loaders and actions on
`renderIntent: { mode: 'dynamic' }` routes — server functions that never
ship to the client bundle — so the official client stays behind the
composition boundary in `lib/supabase-server.ts`.

## Sign-in / sign-out via action routes

Email+password sign-in is a plain action on the login route: authenticate,
let the cookie adapter write the session through `ctx.responseHeaders`,
then PRG-redirect. Failures re-render with a 422 and a stable public error;
provider diagnostics and session material are never echoed.

```ts
// app/routes/login.tsx
export function createLoginAction(createClient: LoginClientFactory = createServerSupabase) {
  return async function action(ctx: {
    formData: FormData;
    env: WorkerEnv;
    request: Request;
    responseHeaders: Headers;
  }): Promise<OpenElementActionFailure<LoginActionData>> {
    if (!(await authRequestAllowed(ctx.env, ctx.request, 'login'))) {
      return fail(429, { error: 'too many attempts; retry later' });
    }
    const email = String(ctx.formData.get('email') ?? '').trim();
    const password = String(ctx.formData.get('password') ?? '');
    if (!email || !password) {
      return fail(422, { error: 'email and password are required', email });
    }
    const client = createClient(ctx.env, ctx.request, ctx.responseHeaders);
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) return fail(422, { error: publicAuthError(error), email });
    throw redirect('/notes');
  };
}
```

Sign-out is a named action on the protected route itself, reached by a
plain form post to `/notes?/logout`:

```ts
// app/routes/notes.tsx
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
```

There is no separate callback endpoint to mount: the action **is** the
callback. The no-JS form (`<form method='post'>`) and the fetch-enhanced
submission hit the same action and get the same outcome — same Set-Cookie
channel, same PRG 303.

## Protected route: re-check authorization in the loader

The `/notes` loader re-checks authorization on every request with
`supabase.auth.getUser()` — never trust edge middleware alone. An edge
guard (see the [auth-guard middleware template](./better-auth-guard.md))
is at most a UX redirect over this server-side check; and beneath the
loader, RLS is the database-level floor: the same anonymous select would
be rejected by Postgres, so the denied branch is a UX path, not the only
protection.

```tsx
// app/routes/notes.tsx
export function createNotesLoader(createClient: NotesClientFactory = createServerSupabase) {
  return async function loader(ctx: NotesContext): Promise<NotesData> {
    const supabase = createClient(ctx.env, ctx.request, ctx.responseHeaders);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { denied: true };
    const { data: notes, error } = await supabase
      .from('notes')
      .select('id, body, created_at')
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
```

The page is a DSD/SSR `renderIntent: { mode: 'dynamic' }` route, so both
branches render fully before any client JavaScript. The denial branch is
source-backed below; signed-in users additionally receive the create form,
their rows, the live island, and working no-JS sign-out:

```tsx
// app/routes/notes.tsx
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
```

## RLS-first migrations

The schema leads with RLS: anonymous access is denied at the database (no
`anon` policy exists at all), and every authenticated policy is scoped to
`auth.uid() = user_id`, so one user can never read or write another's row.

```sql
-- supabase/migrations/20260816000000_notes.sql
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notes enable row level security;

create policy "notes: owner reads own rows"
  on public.notes for select
  to authenticated
  using (auth.uid() = user_id);

create policy "notes: owner inserts own rows"
  on public.notes for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "notes: owner updates own rows"
  on public.notes for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "notes: owner deletes own rows"
  on public.notes for delete
  to authenticated
  using (auth.uid() = user_id);
```

Storage objects get the same treatment: a private bucket, and policies that
scope every object to its owner's folder (objects are keyed
`<auth.uid()>/<filename>` by the upload route below):

```sql
-- supabase/migrations/20260816000001_notes_attachments_storage.sql
insert into storage.buckets (id, name, public)
values ('notes-attachments', 'notes-attachments', false)
on conflict (id) do nothing;

create policy "attachments: owner reads own folder"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'notes-attachments' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "attachments: owner uploads own folder"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'notes-attachments' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "attachments: owner deletes own folder"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'notes-attachments' and (storage.foldername(name))[1] = (select auth.uid())::text);
```

And the realtime publication for the live island:

```sql
-- supabase/migrations/20260816000002_notes_realtime.sql
alter publication supabase_realtime add table public.notes;
```

This is exercised, not merely described: the tier-2 qualification workflow
[`.github/workflows/supabase-project-smoke.yml`](../../.github/workflows/supabase-project-smoke.yml)
creates two throwaway users against a real project, seeds a note for user A
via the service role (server-only, bypassing RLS by design), then curls the
running starter and asserts the full matrix — anonymous `/notes` renders the
denied branch and is never publicly cacheable, login answers 303 with a
session cookie, user A sees their own row, **user B sees none of A's rows
(cross-user RLS denial)**, and logout clears the session so the next read is
denied again. Any RLS breach fails the run.

## Storage upload with authorization

The upload route posts a no-JS-capable multipart form to a named action.
The action re-checks the session (anonymous gets `fail(401, ...)`), then
uploads through the user's own JWT-scoped client into the owner's folder —
no browser-exposed service role anywhere in the path. The loader/action
cores are factories taking the client factory as a parameter, so unit tests
exercise them against a stub while the composition boundary keeps the
official client behind `lib/supabase-server.ts`.

```ts
// app/routes/upload.tsx
/** Basename-only, storage-safe file name segment (no path traversal). */
export function sanitizeFilename(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? '';
  return base.replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 128);
}

/** Objects live under the owner's folder so storage RLS can scope by prefix. */
export function objectKeyFor(userId: string, filename: string): string {
  return `${userId}/${crypto.randomUUID()}-${sanitizeFilename(filename)}`;
}

export function ownsObjectKey(userId: string, key: string): boolean {
  return key.startsWith(`${userId}/`) && !key.slice(userId.length + 1).includes('/');
}
```

```ts
// app/routes/upload.tsx
export function createUploadAction(
  createClient: UploadClientFactory = createServerSupabase,
) {
  return async function upload(
    ctx: RequestContext & { formData: FormData },
  ): Promise<OpenElementActionFailure<UploadActionData>> {
    const supabase = createClient(ctx.env, ctx.request, ctx.responseHeaders);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return fail(401, { error: 'sign-in required to upload' });
    const file = ctx.formData.get('file');
    if (!(file instanceof File) || file.size === 0) {
      return fail(422, { error: 'a non-empty file is required' });
    }
    if (file.size > MAX_FILE_BYTES) {
      return fail(422, { error: 'file exceeds the 1 MiB reference cap' });
    }
    if (!ALLOWED_CONTENT_TYPES.has(file.type)) {
      return fail(422, { error: 'file type is not allowed' });
    }
    const displayName = sanitizeFilename(file.name || 'upload.bin');
    const reservationId = crypto.randomUUID();
    const key = objectKeyFor(user.id, displayName);
    const reserved = await supabase.rpc('reserve_attachment', {
      reservation_id: reservationId,
      object_key: key,
      display_name: displayName,
      byte_size: file.size,
      content_type: file.type || 'application/octet-stream',
    });
    if (reserved.error) return fail(422, { error: reserved.error.message });
    // Never silently overwrite: different originals can normalize to the same
    // key, and upsert:true would lose the earlier file without a trace.
    const { error } = await supabase.storage.from(BUCKET).upload(key, file, {
      contentType: file.type || undefined,
      upsert: false,
    });
    if (error) {
      await supabase.rpc('release_attachment', { reservation_id: reservationId });
      return fail(422, { error: error.message });
    }
    const finalized = await supabase.rpc('finalize_attachment', {
      reservation_id: reservationId,
    });
    if (finalized.error) {
      await supabase.storage.from(BUCKET).remove([key]);
      await supabase.rpc('release_attachment', { reservation_id: reservationId });
      throw new Error('upload could not be finalized');
    }
    const queue = ctx.env.ATTACHMENT_SCAN_QUEUE as
      | { send(message: Record<string, string>): Promise<void> }
      | undefined;
    if (queue) {
      try {
        await queue.send({ type: 'attachment.scan', reservationId, objectKey: key });
      } catch {
        // The row stays pending_scan; scheduled reconciliation re-enqueues it.
      }
    }
    throw redirect('/upload');
  };
}
```

Because the object key starts with the owner's user id, the storage RLS
policies above make the write owner-scoped at the database too — a forged
path or anonymous post is rejected twice (action 401, then Postgres).

## Realtime isolated to an island

Realtime is browser work, so it lives in an island — never in the page
component. SSR never runs lifecycle callbacks (instantiate → render → DSD),
so all subscription work stays in `connectedCallback`, and
`disconnectedCallback` unsubscribes and removes the channel.

One subtlety the reference island is deliberate about: **hosted Realtime
scopes `postgres_changes` by RLS.** Without the user's short-lived access
token the connection authenticates as `anon`, which has no SELECT policy on
`notes` and would receive nothing. The loader therefore feeds the island
the user's access token (rendered as a data attribute), the island calls
`realtime.setAuth` with it — upgrading the realtime connection only, no
session is persisted client-side — and adds a hard `user_id=eq.<uid>`
filter on top.

```tsx
// app/islands/notes-live.tsx
export const tagName = 'notes-live';
export const openElement = defineIslandConfig({
  hydrate: 'load',
  ssr: true,
  dsd: true,
});
```

```tsx
// app/islands/notes-live.tsx
export const MAX_LIVE_EVENTS = 100;
export const MAX_RECONNECT_DELAY_MS = 30_000;

export interface LiveNoteEvent {
  id: string;
  body: string;
}

/** Stable-id dedupe with an explicit DOM/memory bound. */
export function mergeLiveEvent(
  events: readonly LiveNoteEvent[],
  incoming: LiveNoteEvent,
  maximum = MAX_LIVE_EVENTS,
): LiveNoteEvent[] {
  if (events.some((event) => event.id === incoming.id)) return [...events];
  return [incoming, ...events].slice(0, Math.max(0, maximum));
}

/** Capped exponential retry with full jitter; random is injectable for tests. */
export function reconnectDelayMs(attempt: number, random = Math.random): number {
  const cap = Math.min(MAX_RECONNECT_DELAY_MS, 1_000 * 2 ** Math.max(0, attempt));
  return Math.floor(random() * cap);
}
```

The live component additionally updates Realtime auth when its access-token
attribute changes, releases the channel on disconnect, distinguishes
connecting/subscribed/degraded/offline, and exposes a manual reconnect path.
The anon key in the data attributes is public by design; row visibility stays
enforced by RLS plus the hard filter, and no service-role key ever reaches this
bundle (the tier-1 gate scans for exactly that).

## Verification evidence

- **Tier 1 (every PR, no credentials):** `deno task
  fullstack:boundary-check` builds the starter and asserts the secret
  boundary (no service-role/JWT material in browser-reachable output), the
  cache boundary (every request-time route emits the ADR-0121
  `Cache-Control: no-store` baseline; `private, no-cache` is the only
  permitted relaxation), and placeholder-only `.env.example`.
- **Tier 2 (manual + weekly, real project):** the auth/RLS curl matrix in
  `supabase-project-smoke.yml` described above.
- **Unit:** `examples/supabase-cloudflare-starter/app/__tests__` exercises
  the route loader/action cores against a stubbed Supabase client through
  the injectable factory seam; `deno task examples:check` type-checks and
  tests the starter in the workspace chain.

Non-goals, matching the issue scope: no framework session/flash API, no
ORM or generated model layer, and no vendor-neutral auth abstraction — the
recipe is deliberately the official Supabase SDK behind one app-owned file.
