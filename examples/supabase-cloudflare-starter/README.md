# Supabase × Cloudflare reference starter

Maintained reference application for the OpenElement × Supabase × Cloudflare
fullstack delivery path (epic #981, issue #983). Composition only: no
framework-owned auth/database abstractions — Supabase owns data/Auth/RLS,
Cloudflare owns edge delivery, OpenElement is the Web Components-native
application layer.

## Status: working reference

- [x] application shell + request-time routes (login, signup, Magic Link,
      PKCE callback, recovery/reset, notes, upload, admin)
- [x] real sign-in/sign-out via @supabase/ssr cookies on the ADR-0129
      response-header channel (`lib/supabase-server.ts`)
- [x] /notes loader: getUser + RLS-scoped query; anonymous renders the denied
      branch over a hard database-level RLS floor
- [x] explicit `middleware.corsOrigin` allowlist (deployed worker + localhost)
- [x] /upload: no-JS multipart upload/list/delete in the private
      `notes-attachments` bucket; unpredictable object ids, MIME/size guards,
      60-second signed downloads, Storage RLS, and atomic Postgres quota
      reservation/release reject anonymous, cross-user, and quota-race access;
      objects are immutable after INSERT (no UPDATE/upsert policy)
- [x] application-owned Cloudflare module entry composes Nitro `fetch` with
      Queue scan and Cron reconciliation handlers; unscanned objects stay
      hidden, duplicate verdicts are idempotent, and lifecycle events are audited
- [x] Tier 3 deployment can render a generated bounded Queue/DLQ/Cron overlay
      from the one safe Wrangler source; DLQ rows persist before ack and admin
      replay is durable; no duplicate provider config is maintained
- [x] notes-live island: Supabase Realtime INSERT subscription in the browser,
      RLS-scoped via the user's short-lived access token + a hard `user_id`
      filter, with bounded/deduplicated state, reconnect recovery, token refresh,
      and explicit unsubscribe on disconnect
- [x] admin authorization reads issuer-controlled `app_metadata.role` only;
      matching RLS and immutable append-only audit migration included
- [x] Stripe webhook ingress preserves and verifies the raw body before JSON
      parsing, enforces timestamp tolerance, durably deduplicates provider event
      ids, and applies only monotonic order-state transitions
- [x] one-time card Checkout uses a server-owned catalog, retry-stable attempt
      ids and Stripe idempotency keys; Session and PaymentIntent metadata carry
      the order id, paid events must reconcile amount/currency, and the success
      URL never grants payment state
- [x] verified Stripe events persist a minimal envelope before Queue handoff;
      the Queue consumer owns state transitions, exhausted delivery becomes a
      durable admin-visible DLQ row, and Cron safely re-enqueues received events
      and requested replays

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
supabase db push        # applies ordered, manifest-checked migrations
```

Production migration checks and deployment use the pinned
`Supabase project smoke (real project)` workflow and the dedicated credentials documented in
[`docs/runbooks/supabase-migrations.md`](../../docs/runbooks/supabase-migrations.md). Runtime
service-role credentials are not migration credentials.

Payment delivery, DLQ recovery, and replay operations are documented in
[`docs/runbooks/payment-events.md`](../../docs/runbooks/payment-events.md).

Required worker env (server-side only, never in the client bundle):

```
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_LIVEMODE
STRIPE_SECRET_KEY
STRIPE_PRICE_ID
STRIPE_CHECKOUT_HOST
APP_ORIGIN
```

The anon key is additionally rendered into the /notes page as a data attribute
for the realtime island — it is a public key by design; row visibility stays
enforced by RLS and the island's `user_id` filter. The service-role and Stripe
webhook secrets are server-only Worker bindings used by lifecycle/webhook
handlers and must never be rendered or prefixed with `VITE_`.

## Qualification still required

- Tier 2 real Supabase password/OAuth/RLS/Realtime matrix.
- Tier 3 deployed Workers journey and Cloudflare production rate limiting.
- Production SMTP domain/authentication and bounce handling checklist.
