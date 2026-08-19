# ADR-0132: Defer Real Scan-Engine Evidence to v0.44 — Attachment Scanning Is Optional Hardening

- Status: Accepted
- Date: 2026-08-19
- Amends: #1002 0.43 production-closure scope (Phase 2 "content policy and
  optional malware-scanning attachment point")
- Related: #1070, #1000, #984, #997

## Context

The 0.43 production-closure plan (#1002) requires automated evidence at the
declared tier for every capability. For the attachment scan lifecycle, Tier 3
provision mode deployed a private scanner Worker backed by a self-hosted
OPSWAT MetaDefender Core origin, and the workflow failed closed when
`METADEFENDER_CORE_URL` / `METADEFENDER_API_KEY` were absent — which made a
commercial, quote-based scan engine a hard release gate for the reference
stack.

Scanning is optional hardening, not core loop. The reference scope is
owner-scoped, so uploaded files never cross user boundaries, and the system
fails closed when no engine is configured: attachments stay `pending_scan`,
undownloadable by everyone including the owner — the negative path is already
covered by Tier 2 evidence (`pending-scan-download-denied`). The maintained
alternatives (MetaDefender Cloud's free community tier, ClamAV behind a
`/file/sync`-compatible wrapper) either mismatch the implemented synchronous
contract or add self-operated infrastructure the release should not wait on.

## Decision

Defer the real-engine positive-path evidence (upload → Queue → scanner Worker
→ engine verdict `clean` → downloadable) to v0.44, tracked by #1070. For 0.43:

1. `fullstack-deploy-smoke.yml` provision mode skips the scanner deployment
   and its verification when the engine secrets are absent, renders the async
   Wrangler overlay without the `ATTACHMENT_SCANNER` service binding, and
   records `not-configured` in the redacted artifact — an honest annotation,
   never a green scanner claim.
2. The attachment lifecycle stays fail-closed: without an engine, scan
   messages exhaust Queue retries into the DLQ and durable dead letters, and
   attachments never become downloadable. No code path may auto-`clean`.
3. The scanner Worker, the `/file/sync` contract, the Queue/DLQ/replay
   machinery, and the runbooks remain the maintained target; #1070 chooses the
   v0.44 engine (self-hosted ClamAV wrapper or MetaDefender Cloud async
   adaptation).

## Consequences

- Positive: the release gate no longer depends on a commercial engine; the
  scheduled Tier 3 run can go green on real provider evidence (Queue/DLQ,
  payment, Cookie/Host probes) without scanner credentials.
- Negative: the `clean → downloadable` transition is unproven against a real
  engine until #1070 lands; public claims must not assert scanned attachments
  for 0.43.
- Neutral: when engine secrets are later provided, the same workflow exercises
  the full scanner path with no further changes.
