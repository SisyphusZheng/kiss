STATUS: PASS

PACKET:
docs/evidence/v0.44.0-agent-loops/a0-002-repair-3/dispatch.md (repairs
a0-002-repair-2; findings R7–R10 from a0-002-repair-2/review.md). All prior
constraints and gates remained in force: no product/package/example/website code
touched, no public API or architecture change, no commit, push, merge, tag,
publication or release action; the only external contact was read-only GitHub
inspection of the approved action-pin registry.

BASE_SHA:
0f8d78991ab8d9840f3852fe1b9e7691f470f1ed (verified via `git rev-parse HEAD` before
and after the work; HEAD is unchanged and nothing was committed).

CHANGED_FILES:

Workflows (R7, explicitly packet-owned this round):

- .github/workflows/autoflow-ci.yml — new `pr-full-ci-evidence` aggregation job:
  pull-request-only (`if: github.event_name == 'pull_request'`), needs
  [dependency-review, autoflow-ci, node-serve-smoke] with default needs gating (runs
  only after successful needs; a failed/skipped/cancelled matrix leg yields no
  artifact). It writes the schema-2 record through the repo-owned writer from trusted
  workflow context (`github.event.pull_request.head.sha`, `github.run_id`,
  `github.run_attempt`, `github.repository`, `github.event_name`, `toJSON(needs)` —
  never user inputs) and uploads one deterministic artifact named
  `pr-full-ci-evidence-<exact head SHA>` via the already gate-approved pinned
  upload-artifact action (`if-no-files-found: error`, 90-day retention).
- .github/workflows/autoflow-release.yml — new required `pr_ci_run_id` input; a
  download step before publication derives the artifact name from the checked-out
  main HEAD (`pr-full-ci-evidence-$(git rev-parse HEAD)`), downloads exactly that
  named artifact from the explicit run (`gh run download "$PR_CI_RUN_ID" --name
  "$PR_CI_ARTIFACT"`), and fails closed unless exactly one evidence file lands. The
  publish step now runs `autoflow:publish-existing --to "$RELEASE_VERSION" --pr-ci
  "$PR_CI_EVIDENCE"`.

Evidence transport/provenance code (R7/R8, packet-owned):

- tools/autoflow/loop-evidence.ts — record schema bumped to 2: run identity
  (`repository`, `runId`, `runAttempt`, `event`, `artifactName`) plus the required-job
  conclusions from the trusted needs context. `parsePrCiEvidence` fails closed on
  stale schema, missing/malformed run identity, wrong event or artifact name, and an
  incomplete, duplicate, unsupported or unsuccessful required-job set. New
  `verifyPrCiProvenance` independently resolves the recorded run through the
  injectable `GitHubRunQuery` seam and verifies repository, workflow path,
  pull-request event, exact head SHA, completed/success state, run attempt, exactly
  one matching artifact, and the complete required-job set (missing, duplicate,
  skipped, cancelled, unsuccessful or unsupported jobs rejected). New constants:
  `REQUIRED_PR_CI_JOBS`, `PR_CI_EVIDENCE_JOB_NAME`, `PR_CI_ARTIFACT_PREFIX`.
- tools/autoflow/pr-ci-github.ts (new) — the only network-dependent piece: production
  `GitHubRunQuery` over the `gh` CLI (run, attempt-scoped jobs, artifacts). All
  verification rules stay in loop-evidence.ts; tests inject deterministic answers and
  never touch network or credentials.
- tools/autoflow/write-pr-ci-evidence.ts (new) — deterministic record writer used by
  the aggregation job; validates trusted context and refuses to emit evidence when any
  required need is not a success.
- tools/autoflow/cli.ts — `resolveReleaseGateSelection` now verifies provenance after
  parsing (injected seam in tests, gh transport in production);
  `runReleasePrepare` is exported, rejects `--pr-ci` loudly and no longer consumes
  evidence or runs the release tier (R9).

Release preparation (R9):

- tools/autoflow/release.ts — `createPreparePlan` drops the local `autoflow:ci` step;
  preparation now runs the fast tier only (`run fast preparation gates after bump` →
  `deno task autoflow:push`). `verifyPrepareRecord` is preserved: it accepts the new
  step name and the legacy pre-R9 name (existing durable records keep verifying), and
  still refuses records without a passed gated run. Main-CI (`verifyMainCiSuccessForHead`)
  and prepare-record checks in the publish plan are unchanged.
- tools/autoflow/**tests**/release.test.ts — prepare-plan expectations updated to the
  fast-tier step; new R9 test asserts no `autoflow:ci` anywhere in the prepare plan;
  new legacy-record acceptance test.
- tools/autoflow/**tests**/cli.test.ts — records migrated to schema 2 with an injected
  run query; new R9 tests: preparation refuses PR CI evidence, publication refuses
  evidence recorded for the pre-bump SHA.

New focused tests:

- tools/autoflow/**tests**/pr-ci-provenance.test.ts — 17 tests covering RED probes
  1–3 (unresolvable run; wrong repository/workflow/event/SHA/run-attempt/artifact;
  missing/duplicate/skipped/cancelled/unsuccessful/unsupported jobs; record-level
  required-job completeness; stale v1 schema; end-to-end pass).
- tools/autoflow/**tests**/pr-ci-workflow.test.ts — structural probes 4–5 over the
  parsed workflows (aggregation job needs/event/artifact/pinning; release workflow
  required input, exact named-artifact download before publication, `--pr-ci` wiring).

Short-form family completion (R10):

- tools/config/v044-roles.json — the short standalone form of the configured compound
  capability label added to `prohibitedDocIdentifiers.tokens` (the value is never
  spelled in tests, fixtures or documentation).
- tools/check-role-neutral-docs.test.ts — new R10 probe constructs the short form at
  runtime, asserts configuration coverage and scanner detection.
- Migrated documentation matches (facts preserved, label removed):
  docs/current/v0.44.0-AUTONOMOUS-GOAL.md,
  docs/evidence/v0.44.0-agent-loops/a0-000-repair-1/result.json,
  docs/evidence/v0.44.0-agent-loops/a0-001/review.md,
  docs/evidence/v0.44.0-agent-loops/a0-001/review-repair-1.md,
  docs/evidence/v0.44.0-agent-loops/a0-002/implementer-result.md.

Evidence outputs of this packet:

- docs/evidence/v0.44.0-agent-loops/a0-002-repair-3/migration-manifest.json (new)
- docs/evidence/v0.44.0-agent-loops/a0-002-repair-3/implementer-result.md (this file)

Formatting only: `deno fmt` normalized trailing whitespace/EOF shape in the
thinker-authored a0-002-repair-2/review.md and a0-002-repair-3/dispatch.md (no content
change; required by the mandatory format gate).

TESTS_ADDED:

- pr-ci-provenance.test.ts: 17 tests (probes 1–3 plus record-schema and positive
  end-to-end coverage).
- pr-ci-workflow.test.ts: 2 structural workflow tests (probes 4–5).
- cli.test.ts: 2 R9 tests (prepare refuses evidence; publication refuses pre-bump
  SHA), plus schema-2 migration of the nine R3 tests with an injected run query.
- release.test.ts: 1 new R9 test (fast tier only, no local full matrix) and 1 legacy
  prepare-record acceptance test; three existing prepare expectations updated.
- check-role-neutral-docs.test.ts: 1 R10 probe.

RED_EVIDENCE:
All probes ran as direct, unpiped commands; each exit code is the runner's own status.

1–3. `deno test --allow-read --allow-write tools/autoflow/__tests__/pr-ci-provenance.test.ts`
→ exit 1 (TS2305: no `verifyPrCiProvenance`, `GitHubRunQuery`, run-identity
constants or schema-2 record existed — self-attested local JSON passed).
4–5. `deno test --allow-read --allow-env tools/autoflow/__tests__/pr-ci-workflow.test.ts`
→ exit 1 ("autoflow-ci.yml lacks the pr-full-ci-evidence aggregation job";
"autoflow-release.yml lacks the mandatory pr_ci_run_id input"). Note: a first
attempt without `--allow-env` failed inside the yaml parser's own env probe; the
command above is the recorded RED with the correct permissions.
6. `deno test --allow-read --allow-write --allow-env --allow-net --allow-run tools/autoflow/__tests__/release.test.ts`
→ exit 1 (5 failures including "preparation must not invoke the local full
matrix; the PR workflow owns the ci tier"; the prepare plan ran `autoflow:ci`
locally), and
`deno test --allow-read --allow-write tools/autoflow/__tests__/cli.test.ts`
→ exit 1 (TS2459 `runReleasePrepare` not exported and TS2554 no injection seam —
preparation consumed pre-bump evidence).
7. `deno test --allow-read tools/check-role-neutral-docs.test.ts` → exit 1
("configured token set must cover the short standalone form, not only the
compound").

IMPLEMENTATION:

- R7: the PR workflow now produces one deterministic exact-SHA evidence artifact after
  every required full-matrix job succeeds (pull requests only; default needs gating
  fails closed). The publication workflow requires the explicit source run id,
  downloads exactly the HEAD-derived named artifact before publication, enforces a
  single evidence file, and passes its path via `--pr-ci`. Every action use is pinned
  by immutable commit and passes the pin gate.
- R8: records carry stable run identity and required-job conclusions written from
  trusted workflow context; the release entry independently resolves the run through
  the GitHub API behind an injectable seam and verifies repository, workflow path,
  pull-request event, exact head SHA, completed/success state, run attempt, artifact
  identity and the complete required-job set. Every rejection path is tested without
  network access.
- R9: preparation creates the reviewable bump candidate and runs only the fast tier
  (`autoflow:push`); it consumes no PR CI evidence and rejects `--pr-ci`. The bump SHA
  must then pass the authoritative PR workflow; publication consumes the evidence for
  the exact merged bump SHA and runs only complementary release gates. Main-CI and
  prepare-record checks are preserved (legacy record names keep verifying).
- R10: the short standalone form joined the configured token set (never spelled in
  tests or fixtures), all five documentation matches were migrated, the manifest was
  regenerated, and the corpus finishes at zero violations and zero exemptions.

Final workflow-to-release evidence path: PR head SHA → autoflow-ci.yml full matrix →
`pr-full-ci-evidence` aggregation job (trusted context record, deterministic artifact
`pr-full-ci-evidence-<sha>`) → maintainer dispatches autoflow-release.yml with
`pr_ci_run_id` → exact named artifact downloaded onto the main checkout →
`autoflow:publish-existing --to <version> --pr-ci <path>` → parse + independent
GitHub-run provenance verification against current HEAD → complementary release-only
gates → publish plan (main-CI and prepare-record checks intact).

COMMANDS_AND_EXIT_CODES:
GREEN (each command run directly, no pipes; exit code is the command's own status):

- `deno test --allow-read --allow-write tools/autoflow/__tests__/pr-ci-provenance.test.ts tools/autoflow/__tests__/cli.test.ts tools/check-role-neutral-docs.test.ts` → exit 0 (36 passed, 0 failed)
- `deno test --allow-read --allow-env tools/autoflow/__tests__/pr-ci-workflow.test.ts` → exit 0 (2 passed, 0 failed)
- `deno test --allow-read --allow-write --allow-env --allow-net --allow-run tools/autoflow/__tests__/` → exit 0 (128 passed, 0 failed)
- `deno test --allow-read --allow-write tools/check-role-neutral-docs.test.ts` → exit 0 (8 passed, 0 failed; rerun after formatting)
- `deno task docs:check-role-neutral` → exit 0
  (`role-neutral documentation check passed (0 violations, zero exemptions).`)
- `deno task fmt:check` → exit 0 (`Checked 1349 files`)
- `deno task actions:check-pins` → exit 0 (`Action pin check passed.`)
- `deno task workflow:check-slimming` → exit 0
- `deno task workflow:check` → exit 0 (includes the orchestration check: 16 control
  files, 28 scheduled issues)
- `deno task docs:check-current` → exit 0 (`Docs truth check passed (current).`)
- `deno task v044:executor:check` → exit 0
- `deno task arch:check` → exit 0
- `deno task lint` → exit 0 (`Checked 737 files`)
- `deno task typecheck` → exit 0
- `deno task autoflow:push` → exit 0 (PASS fmt:check, lint, typecheck, graph:check,
  package-surface:check, export-files:check, generate:ui-tokens:check,
  workflow:check-slimming, docs:check-role-neutral)

Intermediate failure kept for honesty: the first `deno task fmt:check` exited 1 on two
thinker-authored evidence files (trailing whitespace/EOF shape); they were normalized
with `deno fmt` (whitespace only) and the rerun above passed. No failing check was
hidden and no test was weakened.

Migration manifest: regenerated at
`docs/evidence/v0.44.0-agent-loops/a0-002-repair-3/migration-manifest.json` with 5
migrated files (before/after git blob SHA1 each); the manifest reproduces no
prohibited value and is itself scanned clean by the role-neutral gate.

RESIDUAL_RISKS:

- The end-to-end path is proven locally by structural and injected-seam tests; the
  first real PR run of the new aggregation job is still pending (the full PR matrix is
  intentionally not run locally).
- `gh run download` and the provenance resolution require `actions:read` on the
  release job token; that permission was already present.
- The legacy one-shot local `release`/`patch-release` plans retain their historical
  post-bump gate step; the loop's sanctioned path is two-phase prepare → PR CI →
  publish-existing, which this packet makes evidence-backed.
- Release evidence artifacts expire after 90 days; a release attempted long after the
  PR merge must re-run the PR workflow for the exact SHA.

SCOPE_CONFIRMATION:
Only packet-owned paths were edited. `git status` shows zero changes under
`packages/`, `examples/`, `www/` and `e2e/`; the only `.github/workflows/**` changes
are the two packet-authorized workflow files. No commit, push, merge, tag, publish,
issue, PR or release action was performed; HEAD remains the base SHA. External contact
was limited to read-only inspection of action-pin information. Thinker-authored packet
files were preserved (whitespace-only format normalization of two evidence documents
noted above).

NEXT_REQUIRED_ACTION:
Thinker re-review of this repair (reviewer replay tier), then closure recording for
loop a0-002-repair-3 under the parent packet's protocol.
