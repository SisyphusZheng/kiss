# Incident response runbook

Payment, auth, and storage incidents are handled in four phases: triage,
stop-loss, communicate, review. Speed of stopping damage beats completeness
of diagnosis.

## Severity levels

- **SEV-1 — money or data safety.** Wrong payment state granted (e.g. an
  order marked `paid` without a reconciled provider event), card data
  exposure, session/auth bypass, cross-tenant data read, or uncontrolled
  storage/quota consumption. Page the release operator immediately; work
  until stop-loss is confirmed.
- **SEV-2 — availability with safe state.** Checkout or webhook path down
  (payments cannot start or confirm), scan backlog growing, DLQ accumulating.
  Orders stay in non-granting states, so delay is safe; fix within business
  hours, watch for provider retries.
- **SEV-3 — degradation.** Slow reconciliation, single retrying event,
  cosmetic defects. Track in the next release train.

## Stop-loss playbook

- **Payment state doubt**: the success URL never grants state, so unsafe
  grants can only come from the Queue processor. Disable the
  `PAYMENT_EVENT_QUEUE` consumer binding (or deploy a build that only acks)
  to freeze transitions; investigate `stripe_events` and order audit rows
  before resuming. Never hand-edit an order to `paid`.
- **Webhook flood or replay attack**: ingress already verifies HMAC and
  deduplicates by provider event id; if verification itself is suspect,
  rotate `STRIPE_WEBHOOK_SECRET` and pause the endpoint (503) — Stripe
  retries, no event is lost.
- **Auth/cookie incident**: rotate the affected Supabase keys, which
  invalidates sessions; confirm the cookie floor probes in the deploy smoke
  before reopening.
- **Storage/quota abuse**: objects are immutable and quota is reserved
  atomically; revoke the abusing user via the Auth admin API, quarantine via
  the scanner path, and let Cron release stale reservations.
- **Provider outage (Supabase/Stripe/Cloudflare)**: fail closed and wait.
  Durable `received` events, pending scans, and replay requests are
  re-driven by Cron when the provider returns; do not improvise manual state
  changes that the state machines will later contradict.

## Communication

- One incident owner coordinates; helpers report through them.
- Log a timestamped timeline as it happens: trigger, detection source,
  actions, provider status pages checked.
- User-facing wording states impact and next update time only — never
  internal hostnames, project refs, key names, or customer identifiers.
- Record the incident id in the release ledger once resolved.

## Post-incident review

Within three business days for SEV-1/SEV-2:

1. Timeline and root cause, grounded in the redacted structured logs
   (`provider_event_id` correlation) and provider dashboards — not memory.
2. What stopped the damage, what would have stopped it sooner.
3. Follow-ups filed as issues: detection gaps, missing runbook steps, missing
   tests. A state-machine bug ships with a regression test or it is not done.
4. Update the relevant runbook (this file, `payment-events.md`,
   `backup-restore.md`, `deploy-rollback.md`) in the same PR as the fix.
