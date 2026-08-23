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
- The DLQ is consumed by the same application entry and persisted before ack.
  Its own bounded failures route to the unconsumed
  `openelement-attachment-scan-persistence-failures` safety queue for manual
  recovery instead of silent deletion.
- Service binding `ATTACHMENT_SCANNER` whose `POST /scan` response is exactly
  `{ "verdict": "clean" }` or `{ "verdict": "quarantined" }`.
- The maintained scanner target is a private Cloudflare Worker backed by a
  self-hosted OPSWAT MetaDefender Core HTTPS origin. It requires
  `METADEFENDER_CORE_URL` and `METADEFENDER_API_KEY`; missing or malformed
  configuration can never produce `clean`.
- A Cron Trigger for reconciliation. Five-minute cadence is the reference
  setting.

> v0.43.1 status (ADR-0138, #1070): deployments without
> `METADEFENDER_CORE_URL` / `METADEFENDER_API_KEY` remain runtime-safe, but
> cannot satisfy release qualification. Provision mode records
> `not-configured` and fails; attachments remain `pending_scan`, never listed
> or signed.

The safe base `wrangler.jsonc` intentionally contains no live Queue or Cron
resources while database migrations are pending. Once `migration_mode=apply`
is green, dispatch `Fullstack deploy smoke (real providers)` with
`async_mode=provision`. That mode:

1. renders `.wrangler-async.generated.json` from the single base config;
2. deploys the private scanner Worker and stores only its Supabase service-role
   and MetaDefender credentials as encrypted secrets;
3. idempotently creates `openelement-attachment-scan`, its `-dlq`, and the
   persistence-failure safety queue;
4. stores `SUPABASE_SERVICE_ROLE_KEY` as an encrypted application Worker secret;
5. deploys with a three-retry, 30-second-delay consumer, DLQ, and five-minute Cron;
6. records the selected mode in the redacted Tier 3 artifact.

## Release qualification

Dispatch `Fullstack deploy smoke (real providers)` on the candidate SHA with
`async_mode=provision`. A release-green run must record both
`attachment-scanner-real-clean-owner-download` and
`attachment-scanner-real-eicar-quarantined` as `pass`. It must also record
`attachment-scanner-real-retry-dlq` and
`attachment-scanner-authenticated-admin-replay` as `pass`.

The probe creates a short-lived confirmed Supabase user, signs into the real
Worker, and uploads a benign text fixture plus EICAR through `/upload?/upload`.
It polls the service-role view of the reservation state, requires `clean` and
`quarantined` respectively, verifies the clean file's owner page produces a
working signed URL, and verifies EICAR is absent from the owner listing. The
cleanup trap removes the private Storage objects before deleting the Auth
user. The archived JSON contains only check names/results and the candidate
SHA; never add fixture contents, object keys, user ids, cookies, or provider
responses.

The failure probe deploys the same private scanner Worker with a reserved
non-resolving `.invalid` engine origin, uploads a third benign fixture, and
waits for bounded Queue retries plus durable DLQ persistence. A cleanup trap
always restores the real engine origin. After restoration, the probe requests
replay through the signed-in admin action and waits for Cron and Queue to
produce a real `clean` verdict. If restoration fails, treat it as an incident:
keep downloads fail-closed, restore the last known scanner deployment, and do
not rerun or release until the service binding is healthy.

Before dispatch, verify the two MetaDefender secrets exist at repository scope
and that the endpoint is private or strongly authenticated. Roll back by
restoring the previous scanner deployment or removing the service binding;
never return a synthetic clean verdict. A missing engine deliberately makes
the release evidence workflow red while preserving the runtime fail-closed
state.

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
   The scanner first calls `authorize_attachment_scan`, which requires the exact
   reservation id/object key pair in a pending state. It then downloads the
   private object with a server credential, enforces the database byte count and
   10 MiB cap while reading, and sends only bounded bytes to MetaDefender Core.
   Only result code 0 is clean; infected, suspicious, and blocklisted codes are
   quarantined. Timeouts, skipped/failed scans, malformed output, and every
   unknown code are retryable failures.
5. `complete_attachment_scan` is idempotent for duplicate delivery. A conflicting
   second verdict is rejected, and every first transition appends an immutable
   owner-readable storage audit event.
6. Exhausted messages are persisted as `scan_dead_letter` before the DLQ ack;
   normal pending reconciliation ignores them. An admin requests one replay in
   `/admin`; Cron retries that durable handoff until Queue send succeeds.
7. Cron deletes objects for reservations stuck for fifteen minutes through the
   Storage API, then releases Postgres quota. Never delete `storage.objects`
   rows directly: that orphans the underlying object.

## Failure and recovery

- Inspect the Queue retry count and `/admin` dead-letter row before replay. Fix
  the scanner or Supabase cause, then select **Request replay**. Cron sends the
  original reservation id/object key unchanged and records the transition.
- If DLQ persistence itself exhausts retries, consume
  `openelement-attachment-scan-persistence-failures` manually within its
  four-day retention window after Supabase is healthy; do not purge it first.
- Duplicate replay is safe after a successful verdict; the database function
  returns without appending a second audit record.
- If Storage deletion succeeds but quota release fails, leave the reservation
  for the next Cron run. The delete call and release function are idempotent.
- If pending scans accumulate, verify both bindings and service-role secret,
  invoke the scheduled handler in a non-production environment, then replay the
  DLQ. Do not mark Alpha 5 complete without a real at-least-once + DLQ replay run.
- MetaDefender Core is deliberately self-hosted so file residency and retention
  remain operator-owned. Pin an approved Core version/profile, disable external
  sample sharing, document engine licenses and update cadence, and set Core's
  retention cleanup before enabling production traffic. The reference cap is
  10 MiB even if the licensed Core deployment accepts larger files.
- Rotate `METADEFENDER_API_KEY` with overlapping Core credentials: install the
  new Worker secret, run clean and EICAR fixtures, then revoke the old key. On
  rollback, restore the previous scanner deployment; never bypass scanning or
  return `clean` during a provider outage.
