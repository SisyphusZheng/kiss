# Supabase × Cloudflare reference starter

Maintained reference application for the OpenElement × Supabase × Cloudflare
fullstack delivery path (epic #981, issue #983). Composition only: no
framework-owned auth/database abstractions — Supabase owns data/Auth/RLS,
Cloudflare owns edge delivery, OpenElement is the Web Components-native
application layer.

## Status: working reference

- [x] application shell + routes (home, notes, login, upload)
- [x] real sign-in/sign-out via @supabase/ssr cookies on the ADR-0129
      response-header channel (`lib/supabase-server.ts`)
- [x] /notes loader: getUser + RLS-scoped query; anonymous renders the denied
      branch over a hard database-level RLS floor
- [x] explicit `middleware.corsOrigin` allowlist (deployed worker + localhost)
- [x] /upload: no-JS multipart form → Storage upload into the private
      `notes-attachments` bucket under the owner's folder; storage RLS rejects
      anonymous writes and cross-user access
- [x] notes-live island: Supabase Realtime INSERT subscription in the browser,
      RLS-scoped via the user's short-lived access token + a hard `user_id`
      filter, with explicit unsubscribe on disconnect

## Prerequisites

- Deno (workspace tasks), Node (Nitro `node` preset run),
- Supabase CLI + Docker (local emulator; migrations), or a hosted project,
- Cloudflare account for deployment (wrangler, secret-boundary runbook).

## Tasks

```sh
deno task build        # OpenElement build (dist/, request-time server entry)
deno task nitro:build  # Nitro build (OPEN_ELEMENT_NITRO_PRESET=cloudflare_module → .output-workers/)
deno task start        # local run of the built server (http://localhost:4173)
deno task check        # type-check routes, islands, shell, lib
deno task test         # unit smoke for route logic (stubbed Supabase client)
```

## Migrations

```sh
supabase link --project-ref <ref>
supabase db push        # applies supabase/migrations/ (notes + storage + realtime)
```

Required worker env (server-side only, never in the client bundle):

```
SUPABASE_URL
SUPABASE_ANON_KEY
```

The anon key is additionally rendered into the /notes page as a data attribute
for the realtime island — it is a public key by design; row visibility stays
enforced by RLS and the island's `user_id` filter. The service-role key never
enters this app.

## Next steps

1. alpha.5 → Supabase recipe extraction, qualification gates (#982/#984).
