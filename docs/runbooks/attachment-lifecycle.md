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
  setting.

The safe base `wrangler.jsonc` intentionally contains no live Queue or Cron
resources while database migrations are pending. Once `migration_mode=apply`
is green, dispatch `Fullstack deploy smoke (real providers)` with
`async_mode=provision`. That mode:

1. renders `.wrangler-async.generated.json` from the single base config;
2. idempotently creates `openelement-attachment-scan` and its `-dlq`;
3. stores `SUPABASE_SERVICE_ROLE_KEY` as an encrypted Worker secret;
4. deploys with a three-retry, 30-second-delay consumer, DLQ, and five-minute Cron;
5. records the selected mode in the redacted Tier 3 artifact.

Do not commit a second hand-maintained Wrangler config. Do not run base mode
after async provisioning: base mode intentionally removes async bindings and is
only the pre-migration deployment path.

## State and delivery contract

1. The request path atomically reserves quota and uploads an unpredictable key.
   Attachment objects are insert-only: authenticated owners have SELECT,
   INSERT, and DELETE policies, but no UPDATE policy. Replacement must create a
   new key and lifecycle record; never enable `x-upsert` for this bucket.
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
