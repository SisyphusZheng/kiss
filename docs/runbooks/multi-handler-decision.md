# Multi-handler composition decision runbook

Decision record for how the reference application serves HTTP, Queue, and Cron
on Cloudflare. Verdict: **go** — one Worker, one module entry, Nitro as the
sole `fetch` owner, application-owned `queue` and `scheduled` handlers composed
around it. Recorded for Alpha 5 (#1000) so the choice is auditable and the
fallback criteria are explicit.

## Decision

The reference application owns one Cloudflare module entry:
`examples/supabase-cloudflare-starter/cloudflare-entry.ts`. It exports
`createCloudflareHandlers(nitro)` from `lib/cloudflare-handlers.ts`:

1. `fetch` delegates to the generated Nitro module unchanged. Nitro remains the
   only HTTP implementation; there is no second fetch entry and no framework
   cloud abstraction.
2. `scheduled` runs `reconcileLifecycle` through `ctx.waitUntil`.
3. `queue` routes by exact queue name to the attachment-scan, attachment-DLQ,
   payment, and payment-DLQ consumers.

One base `wrangler.jsonc` stays provider-safe and async-binding-free. Queue,
DLQ, Cron, and the scanner service binding exist only in the generated async
overlay (`.wrangler-async.generated.json`). Do not hand-maintain a second
Wrangler config, and do not run base mode after async provisioning.

## Evidence

- `app/__tests__/cloudflare-handlers.test.ts` — the composed `fetch` returns
  the Nitro response exactly (status and headers), and `scheduled`/`queue`
  events reach the application lifecycle hooks in the expected routing order.
- `app/__tests__/cloudflare-lifecycle.test.ts` — the Queue/DLQ/Cron lifecycle
  behavior behind those hooks, with the composition boundary stubbed.
- `tools/render-cloudflare-async-config.ts` — renders the bounded async
  overlay from the single base config and refuses to touch a base that already
  carries async bindings (`withAsyncBindings`).
- `.github/workflows/fullstack-deploy-smoke.yml` — `async_mode=provision`
  renders the overlay, deploys, idempotently creates the Queues/DLQs, verifies
  the provisioned resources against the real account, and records the mode in
  the redacted Tier 3 artifact.

## When to choose a companion Worker instead

Keep lifecycle handlers in the application entry by default. Split a handler
into a companion Worker only when one of these holds:

1. **Credential or network isolation.** The handler needs secrets or origins
   the public fetch surface must never share a deployment with. This is the
   in-repo precedent: the MetaDefender-backed scanner is the private companion
   Worker `scanner-worker.ts` (`openelement-attachment-scanner`), reached only
   through the `ATTACHMENT_SCANNER` service binding and fail-closed without its
   credentials.
2. **Divergent resource profile.** Consumer CPU, memory, or duration would
   starve or time out the fetch handlers sharing the isolate.
3. **Independent deploy and rollback cadence.** The handler changes on a
   different schedule than the application, or its blast radius must be
   separable during an incident.
4. **Different ownership or compliance boundary.** Another team or data
   residency rule owns the handler's code and credentials.

When a companion Worker is introduced, give it its own minimal Wrangler config
(like `scanner-wrangler.jsonc`), bind it back through an explicit service
binding, and keep its credentials out of the application Worker. Never split
the `fetch` ownership itself: exactly one entry serves HTTP, and it stays
Nitro.
