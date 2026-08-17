# Deploy rollback runbook

Application deploys roll back by reverting the Worker to a previous version.
Schema does not roll back: migrations are forward-only.

## Worker version rollback

1. List recent versions:
   `deno run -A npm:wrangler deployments list --name <worker-name>`.
2. Roll back to the last known-good version:
   `deno run -A npm:wrangler rollback --name <worker-name>` (or deploy the
   known-good git SHA explicitly when history is ambiguous).
3. Re-run the post-deploy smoke (`Fullstack deploy smoke (real providers)`)
   against the rolled-back version before declaring recovery: anonymous
   branches, CSRF rejection, cookie security floor, and Host hygiene.
4. Roll back the scanner Worker the same way when the incident involves
   attachment scanning; the app and scanner versions are independent.

Rollback is safe for state because runtime invariants live in Postgres:
order state ranks are monotonic, payment events are deduplicated by provider
event id, and attachment reservations are atomic. An older Worker reprocessing
a queue message cannot regress a newer state.

## Migration rollback principle

- **Never revert a published migration.** `migration-manifest.json` is
  append-only; `supabase migration repair` edits history only and must never
  run automatically.
- A bad migration is fixed by a **new forward migration** that restores the
  intended invariant, reviewed with the same manifest and smoke gates.
- If a migration fails mid-apply, stop: inspect the partial state, complete or
  compensate forward, then re-run the dry run until the remote is current.
- A Worker that requires migration _N_ must not run against a database older
  than _N_; deploy order is migrations first, then the Worker. Rollback order
  is the reverse only when the older Worker tolerates the newer schema —
  additive columns and new tables are tolerated, renamed/dropped objects are
  not. When in doubt, roll the Worker back first and leave the schema forward.

## Queue and DLQ considerations during rollback

- In-flight Queue messages survive a Worker rollback; the older consumer must
  still ack/retry correctly. DLQ rows persist before ack, so no dead letter is
  lost by rolling back mid-incident.
- Do not roll back to a version that predates a queue binding the messages
  reference (e.g. a build without `PAYMENT_EVENT_QUEUE`): events would
  accumulate as durable `received` rows. Cron keeps them safe, but process
  them before rolling back or accept the backlog delay.
- After any rollback, watch `payment_reconciliation` and Queue metrics for
  one Cron cycle to confirm the loop is draining again.
