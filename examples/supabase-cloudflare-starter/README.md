# Supabase × Cloudflare reference starter (skeleton)

Maintained reference application for the OpenElement × Supabase × Cloudflare
fullstack delivery path (epic #981, issue #983). Composition only: no
framework-owned auth/database abstractions — Supabase owns data/Auth/RLS,
Cloudflare owns edge delivery, OpenElement is the Web Components-native
application layer.

## Status: skeleton phase

This is the alpha.4 skeleton slice that does not depend on session cookies:

- [x] application shell + route skeleton (home, notes, login placeholder)
- [x] notes table + RLS migration (anonymous access is denied at the database)
- [x] anonymous-denied path on /notes (no session → denied branch, no data leak)

Blocked on the senior-side amendment ADR-0129 (response-header channel for
action `Set-Cookie` writes): sign-in/sign-out routes, session read-back and
the first RLS-backed query. Until it lands, `/notes` always renders its
denied branch — the honest skeleton state, not a workaround.

## Prerequisites

- Deno (workspace tasks), Node (Nitro `node` preset run),
- Supabase CLI + Docker (local emulator; migrations), or a hosted project,
- Cloudflare account for deployment (wrangler, secret-boundary runbook).

## Tasks

```sh
deno task build        # OpenElement build (dist/, request-time server entry)
deno task nitro:build  # Nitro build (OPEN_ELEMENT_NITRO_PRESET=cloudflare_module → .output-workers/)
deno task start        # local run of the node-preset output (.output-node)
```

## Migrations

```sh
supabase link --project-ref <ref>
supabase db push        # applies supabase/migrations/ (notes table + RLS)
```

Required worker env (server-side only, never in the client bundle):

```
SUPABASE_URL
SUPABASE_ANON_KEY
```

## Next steps

1. ADR-0129 accepted → sign-in/sign-out routes + session read-back
   (`lib/supabase-server.ts` upgrade path is marked in code).
2. alpha.5 → Supabase recipe extraction, qualification gates (#982/#984).
