# Backup and restore runbook

Data ownership follows the composition boundary: Supabase owns database,
Auth, and Storage; Cloudflare owns edge state; Stripe owns payment objects.
The application never maintains its own backup copies of provider data.

## What backups cover

- **Postgres (Supabase)**: tables, RLS policies, functions, and migration
  history — including `orders`, `stripe_events`, `notes`,
  `attachment_reservations`, and the audit tables. Restored through Supabase
  point-in-time recovery or scheduled logical backups, per the project's
  Supabase plan.
- **Auth users (Supabase)**: included in Supabase platform backups. Export
  separately before any operation that bulk-deletes users.
- **Schema source of truth**: `supabase/migrations/` plus
  `migration-manifest.json` in git. A restored database must be reconciled
  against the manifest before traffic returns.

## What backups do NOT cover

- **Storage objects** (`notes-attachments` bucket). Database backups exclude
  Storage; object restore/reconciliation is a separate operation that must be
  validated independently. Attachment rows are quota reservations, not object
  copies.
- **Cloudflare resources**: Worker versions, Queue/DLQ topology, Cron
  Triggers, and secrets. These are redeployed from git plus the generated
  async overlay, never restored from a provider snapshot. In-flight queue
  messages are not backed up; durable Postgres state (`received` payment
  events, pending scans) is what Cron re-drives after an outage.
- **Stripe objects**: Stripe is the source of truth for Checkout Sessions,
  PaymentIntents, and refunds. Local `stripe_events` rows are minimal
  envelopes for deduplication, and the provider event id makes a restored
  database safe against redelivery — never "re-import" Stripe state by hand.
- **Secrets**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
  `SUPABASE_SERVICE_ROLE_KEY`, and API tokens live only in provider secret
  stores. Losing them means rotation, not restore.

## Restore drill

Run at least once per release train and after any migration that adds state
machines:

1. Pick a throwaway Supabase project; restore the latest platform backup (or
   apply migrations from the manifest for a logical rebuild).
2. Verify row counts and spot-check invariants: every `paid` order has a
   reconciled `stripe_events` row; audit tables reject mutation.
3. Point a preview Worker at the restored project and run the starter smoke:
   sign-in, notes read, one test-mode Checkout through webhook → `paid`.
4. Confirm Storage behavior explicitly: objects that existed before the
   restore are downloadable; missing objects fail closed (not as `clean`).
5. Record the drill below: date, operator, scope, gaps found.

## Drill log

| Date                                | Operator | Scope | Result / gaps |
| ----------------------------------- | -------- | ----- | ------------- |
| _pending — first drill not yet run_ |          |       |               |
