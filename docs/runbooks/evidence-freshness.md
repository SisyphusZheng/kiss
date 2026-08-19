# Evidence freshness for tier-2/tier-3 provider qualification

#997: release status must rest on fresh, real provider evidence — never on
stale artifacts, never on mock green. This runbook defines the freshness
model, the release gate that enforces it, and the outage convention.

## Freshness model

Two workflows hold the real-provider evidence:

- **Tier 2** (`supabase-project-smoke.yml`) qualifies the reference starter
  against the real Supabase project. Manual + weekly, Mondays 06:00 UTC.
- **Tier 3** (`fullstack-deploy-smoke.yml`) deploys to the real Cloudflare
  test environment and smokes the live URL. Manual + weekly, Tuesdays
  06:00 UTC (staggered from tier 2). Scheduled runs default to the full
  `provision` probe — workflow inputs are empty on schedule events, and the
  job-level env resolves `ASYNC_MODE=provision`, so the weekly evidence
  always covers the scanner redeploy and Queue/DLQ verification, which are
  idempotent against the already-created bounded async resources.

**Scheduled and manual (workflow_dispatch) runs both count** as freshness
evidence for release (ADR-0134). A manual green on the release SHA is newer
evidence than a pre-fix scheduled red, never a mask — and the newest-wins
rule cuts both ways, so any later scheduled red blocks release again.
Manual tier-3 runs intended as release evidence must select the `provision`
mode so they cover the full probe.

Every run archives a redacted artifact containing `version` (commit SHA),
`runId`, `timestamp` (UTC ISO-8601), `environment`
(`supabase-real-project` / `cloudflare-workers-test`), `jobStatus`, the check
list (`matrix` / `checks`), and the `cleanup` outcome. Artifacts never carry
credentials, emails, user ids, JWTs, or cookies.

## Release gate: `fullstack:evidence-freshness`

`tools/check-evidence-freshness.ts` is registered in the AutoFlow **release**
tier only (`tools/autoflow/policy.ts`) — the weekly cadence must never gate
PRs, so it is deliberately absent from the ci tier. It queries the GitHub
Actions API for each workflow's runs — scheduled and manual, newest first —
and fails when any of these holds for either workflow:

1. **Two consecutive scheduled failures with no newer success.** A red
   weekly run followed by another red weekly run means provider evidence is
   regressing, not flickering; release is blocked until a newer run of any
   trigger (scheduled, or a manual dispatch on the release SHA) goes green.
2. **Newest completed run failed** — whatever the trigger, even if older
   runs are green. Newest wins: an old green artifact can never overwrite a
   newer failed result.
3. **Stale evidence**: the newest success of any trigger is older than 14
   days. Exactly 14 days is still fresh; one millisecond past is stale.
4. **No completed runs at all.** The gate fails closed — release-level
   evidence that has never been produced cannot be assumed.

The gate also fails closed when the API is unreachable or no token is
available: unverifiable evidence is blocked evidence, with an explicit
message. The token comes from `GITHUB_TOKEN` or `GH_TOKEN` and is never
printed. It needs `actions:read` on the repository; the release workflow
(`autoflow-release.yml`) grants `permissions: actions: read` to the release
job for exactly this gate, and local release runs need one of the two token
variables in the environment.

Recovering from a blocked gate is always the same: fix the provider-side
cause, then land a newer green run — the weekly schedule, or a manual
dispatch on the release SHA. Do not unblock a release by pointing at older
green artifacts — that is exactly the newest-wins violation the gate exists
to reject.

## Provider outage convention

When Supabase or Cloudflare is down, the weekly run goes red and its
artifact reports the real `jobStatus` with whatever checks ran — the run is
**blocked/unverified**, and the freshness gate blocks release on it. The
artifact must never substitute a mocked or assumed-green result for a probe
that did not execute (#997: "Provider outages report blocked/unverified,
never substitute mock green"). The same rule covers missing secrets: a
provision step that cannot authenticate fails the run rather than degrading
to the base probe silently.

Related: [supabase-migrations.md](supabase-migrations.md) (a failed
migration blocks provider qualification; an older green run never overrides
a newer failure).
