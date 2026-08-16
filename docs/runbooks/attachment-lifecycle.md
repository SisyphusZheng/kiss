# Attachment scan, Queue, and reconciliation runbook

The reference application owns one Cloudflare module entry:
`examples/supabase-cloudflare-starter/cloudflare-entry.ts`. Nitro remains the
only `fetch` implementation. The entry composes application-owned `queue` and
`scheduled` handlers without adding a framework cloud abstraction.

## Required production bindings

- Secret `SUPABASE_URL`.
- Secret `SUPABASE_SERVICE_ROLE_KEY`; it is read only by Queue/Cron server
  handlers and must never enter HTML or a client bundle.
- Queue producer/consumer binding `ATTACHMENT_SCAN_QUEUE` with a dead-letter
  queue and a bounded `max_retries` policy.
- Service binding `ATTACHMENT_SCANNER` whose `POST /scan` response is exactly
  `{ "verdict": "clean" }` or `{ "verdict": "quarantined" }`.
- A Cron Trigger for reconciliation. Five-minute cadence is the reference
  setting; provider resources are intentionally not named in committed config
  until provisioned by the deployment environment.

## State and delivery contract

1. The request path atomically reserves quota and uploads an unpredictable key.
2. Finalization changes `reserved` to `pending_scan`; only `clean` rows are
   listed or receive a signed URL.
3. The request attempts to enqueue `attachment.scan`. Failure does not expose
   the object: Cron re-enqueues pending rows older than five minutes.
4. The Queue consumer acknowledges only after the scanner verdict and database
   transition succeed. Invalid responses and transient failures are retried.
5. `complete_attachment_scan` is idempotent for duplicate delivery. A conflicting
   second verdict is rejected, and every first transition appends an immutable
   owner-readable storage audit event.
6. Cron deletes objects for reservations stuck for fifteen minutes through the
   Storage API, then releases Postgres quota. Never delete `storage.objects`
   rows directly: that orphans the underlying object.

## Failure and recovery

- Inspect the Queue retry count and DLQ before replay. Fix the scanner or
  Supabase cause, then replay the original message body unchanged.
- Duplicate replay is safe after a successful verdict; the database function
  returns without appending a second audit record.
- If Storage deletion succeeds but quota release fails, leave the reservation
  for the next Cron run. The delete call and release function are idempotent.
- If pending scans accumulate, verify both bindings and service-role secret,
  invoke the scheduled handler in a non-production environment, then replay the
  DLQ. Do not mark Alpha 5 complete without a real at-least-once + DLQ replay run.
