STATUS: PASS

PACKET:
docs/evidence/v0.44.0-agent-loops/a0-002-repair-2/dispatch.md (repairs
a0-002-repair-1; findings R1–R6 from a0-002-repair-1/review.md). Parent packet
a0-002-repair-1/dispatch.md ownership, forbidden paths, architecture constraints,
test-first requirements and mandatory gates remained in force throughout.

BASE_SHA:
0f8d78991ab8d9840f3852fe1b9e7691f470f1ed (verified via `git rev-parse HEAD` before
and after the work; no commit, push, tag, merge or any other release/external-state
action was performed).

CHANGED_FILES:
Executable configuration and tooling:

- tools/config/v044-roles.json — `docScanExemptions` removed; `prohibitedDocIdentifiers`
  expanded to the full repository-historical brand family (R1, R2).
- tools/config/load-v044-roles.ts — exemption field removed from the schema; the loader
  now fails closed if the key reappears (R1).
- tools/check-role-neutral-docs.ts — exemption skip path deleted; pass output is now
  `role-neutral documentation check passed (0 violations, zero exemptions).` (R1).
- tools/check-role-neutral-docs.test.ts — added R1 no-exemption-facility test, R1
  scanner-coverage test (both a0-002 packet directories, the execution state and the
  root README are scanned), and the R2 configured-branch-brand probe derived from
  executable configuration (token assembled at test runtime; the literal is never
  written into the test source).
- tools/autoflow/loop-evidence.ts — added the exact-SHA PR CI evidence record,
  `parsePrCiEvidence`/`loadPrCiEvidence` (fail closed on absent, unreadable, wrong
  schema/kind, wrong workflow, unsupported tier, weakened/partial matrix, stale or
  mismatched SHA, non-green conclusion) and `selectComplementaryReleaseGates` (release
  gates not already in the ci tier) (R3).
- tools/autoflow/cli.ts — new required `--pr-ci <path>` option on every release entry
  (`patch-release`, `release`, `release-prepare`, `publish-existing`);
  `resolveReleaseGateSelection` validates the evidence against the exact candidate SHA
  before any release gate runs; `runReleaseTier` executes only the complementary
  release-only gates. No environment-variable or argument fallback accepts absent
  evidence (R3).
- tools/autoflow/**tests**/cli.test.ts — nine new R3 tests (new file).
- tools/autoflow/**tests**/policy.test.ts — two parse-expectation assertions extended
  with the new `prCiEvidence` option field (consequence of the R3 CLI contract).
- tools/run-v044-role.ts — implementer repair resume now emits only the installed
  CLI's valid resume form (`--session <id>` plus prompt/output arguments); model and
  profile flags are never combined with a resume (R5).
- tools/run-v044-role.test.ts — R5 mutual-exclusion assertions replace the stale
  resume expectation (R5).
- tools/check-v044-orchestration.test.ts — appended the R4 corpus test: the stale
  per-prerelease human-gate sentence must be absent from the SOP and the bootstrap
  prompt; both must record `alpha.1`, `beta.2` and `#1178`; the SOP must record the
  unanimous GO (R4).

Neutral documentation migration (R2 corpus, facts/SHAs/commands/exit codes preserved;
only prohibited spans redacted):

- docs/adr/ADR-0086-ai-readable-architecture-and-autoflow2-roadmap.md (two vendor
  publication URLs redacted, recoverable from Git history)
- docs/adr/ADR-0087-tdd-cross-review-cell-execution.md (benchmark model names
  generalized)
- docs/audit/2026-08-26-v0.43.3-robustness-adversarial-audit.md (snapshot attribution
  neutralized; commit prefix preserved)
- docs/current/v0.44.0-EXECUTION-STATE.json (`branch` now
  `v044/1156-ci-doc-governance-repair`)
- docs/evidence/v0.44.0-agent-loops/TEMPLATE.md (branch example neutralized)
- docs/evidence/v0.44.0-agent-loops/a0-000-repair-1/dispatch.md,
  docs/evidence/v0.44.0-agent-loops/a0-001/dispatch.md,
  docs/evidence/v0.44.0-agent-loops/a0-002/dispatch.md,
  docs/evidence/v0.44.0-agent-loops/a0-002/implementer-result.md (branch fields and
  branch-proof transcripts neutralized)
- docs/evidence/v0.44.0-agent-loops/a0-002-repair-1/dispatch.md — the previously
  exempted packet, now migrated like every other document: branch field neutralized
  and the exception list now references the prompt/role-profile locations via
  executable configuration instead of prohibited paths
- docs/evidence/v0.44.0-agent-loops/a0-002-repair-1/implementer-result.md (branch
  field and branch-proof transcript neutralized)
- docs/evidence/v0.44.0-agent-loops/a0-002-repair-2/dispatch.md (its own `branch`
  field neutralized; required for the zero-violation gate this packet mandates)
- docs/governance/V044_ISSUE_SOP.md (branch convention now `v044/<issue>-<slice-slug>`)
- docs/prompts/v0.44.0-THINKER-ORCHESTRATOR.md (scoped-branch convention neutralized)
- docs/release/v0.40.4-plan.md, docs/release/v0.41.0-alpha.1-plan.md,
  docs/release/v0.41.0-alpha.2-plan.md, docs/release/v0.41.0-alpha.4.md,
  docs/release/v0.41.0-alpha.5-plan.md, docs/release/v0.41.0-alpha.7-plan.md,
  docs/release/v0.41.0-alpha.12-implementation.md,
  docs/release/v0.41.0-alpha.13-plan.md, docs/release/v0.41.0-alpha.15-plan.md
  (external review-bot name and workflow filename redacted to neutral descriptions)

Authorized prerelease flow documentation (R4):

- docs/governance/V044_AGENT_LOOP_SOP.md §11/§12 — stale "always forbidden" list
  replaced: the active bootstrap authorizes the full `alpha.1`–`beta.2` release flow
  (dev→main integration, tag, npm publish, dist-tag, GitHub Release, evidence/issue
  updates, cursor) after a unanimous implementer/release-verifier/thinker GO with all
  gates green; `alpha.0` stays strictly unpublished; human ownership is retained for
  #1178 RC admission, Stable promotion, architecture/public-surface/doctrine changes,
  security exceptions and gate waivers.
- docs/prompts/v0.44.0-THINKER-ORCHESTRATOR.md — same authorized flow recorded;
  `AWAITING_HUMAN_GO` now applies only to #1178.
- docs/current/v0.44.0-AUTONOMOUS-GOAL.md — autonomy envelope and Goal text quote
  updated identically.
- docs/current/v0.44.0-EXECUTION-PLAN.md — version-closure steps 9–10 now record the
  unanimous GO and execute the authorized release closure; the only human GO gate is
  #1178.
- docs/adr/ADR-0146-three-role-agent-execution-control-plane.md §5 — retitled
  "Prerelease promotion is delegated; RC admission remains human-owned" with matching
  body, diagram and verification bullet updates.
- docs/current/VERSION_PLAN.md — prerelease closure authority bullets updated (version
  anchor header lines untouched).
- docs/governance/V044_ISSUE_SOP.md — version-boundary behavior scoped: prerelease
  promotion uses the recorded unanimous loop GO; only the human-approved exact SHA may
  be promoted to RC.

Evidence outputs of this packet:

- docs/evidence/v0.44.0-agent-loops/a0-002-repair-2/migration-manifest.json (new)
- docs/evidence/v0.44.0-agent-loops/a0-002-repair-2/implementer-result.md (this file)

Formatting only: `deno fmt` reflowed
docs/evidence/v0.44.0-agent-loops/a0-002-repair-1/review.md (whitespace/wrapping only;
no content change) alongside the edited files above.

TESTS_ADDED:

- tools/check-role-neutral-docs.test.ts: "R1: the executable configuration exposes no
  documentation exemption facility"; "R1: the scanner covers every docs/ text file,
  including every packet directory"; "R2: the configured brand family covers
  repository-owned equivalents (branch prefix probe)".
- tools/autoflow/**tests**/cli.test.ts (new, nine tests): absent `--pr-ci` argument,
  missing evidence file, stale/mismatched SHA, failing conclusion, weakened partial
  matrix, unsupported tier, wrong workflow, unreadable JSON, and the positive case
  proving that valid exact-SHA full-matrix evidence selects exactly the complementary
  release-only gates (and never a ci-tier gate).
- tools/check-v044-orchestration.test.ts: "R4: control-plane corpus records the
  authorized prerelease flow and the #1178 human stop".
- tools/run-v044-role.test.ts: "R5: implementer resume uses only the CLI-valid resume
  form (mutually exclusive flags)".

RED_EVIDENCE:
All RED probes ran as direct, unpiped commands; each reported exit code is the test
runner's own status. This record supersedes the piped RED transcript in the repair-1
result (finding R6); the underlying failures were re-proven against the base SHA.

1+2. `deno test --allow-read tools/check-role-neutral-docs.test.ts` → exit 1
(2 failures: the exemption facility still existed in configuration/loader/
checker; the configured brand family missed the repository branch-prefix
equivalent).
3+4. `deno test --allow-read --allow-write tools/autoflow/__tests__/cli.test.ts` →
exit 1 (TS2305: `resolveReleaseGateSelection` was not exported from `../cli.ts`;
no exact-SHA evidence validation or complementary selection existed).
5. `deno test --allow-read tools/check-v044-orchestration.test.ts` → exit 1
("SOP still carries stale per-prerelease human-gate prose").
6. `deno test --allow-read tools/run-v044-role.test.ts` → exit 1
(implementer resume repeated `--model` alongside `--session`, the combination
the installed CLI rejects).

IMPLEMENTATION:

- R1: the documentation exemption facility is removed end to end — configuration key,
  loader schema field (the loader now rejects the key), checker skip path and the
  exemption test. The previously exempted repair packet is migrated and scanned like
  every other document. Final gate output: `role-neutral documentation check passed
  (0 violations, zero exemptions).`
- R2: `prohibitedDocIdentifiers` now covers the full brand family present in
  repository history (compound literals plus standalone tokens, loaded only from
  executable configuration). Every docs-corpus match was migrated, including the
  branch convention, which is now `v044/<issue>-<slice-slug>` everywhere in docs;
  role-profile filenames live only in executable configuration outside docs/.
- R3: every release entry point requires `--pr-ci <path>` naming a validated exact-SHA
  PR full-CI evidence record (schemaVersion 1, kind `pr-full-ci`, workflow
  `autoflow-ci.yml`, tier `ci`, complete matrix, green conclusion, SHA equal to the
  release candidate). Absent, unreadable, mismatched, stale, failing, weakened,
  unsupported-tier or wrong-workflow evidence fails closed before any release gate
  runs. With valid evidence, the release lane runs only the complementary release-only
  gates — the gates the PR matrix does not already prove for that exact SHA:
  - release:state-machine:check
  - fullstack:evidence-freshness
  - nitro:proof:node
  - nitro:proof:workers
  - publish:npm:dry-run

  All release-only gates are preserved; no gate was dropped, and no ci-tier gate is
  replayed locally at release time.
- R4: the control-plane corpus (SOP, bootstrap prompt, autonomous goal, execution
  plan, ADR-0146, Version Plan, Issue SOP) now consistently records the authorized
  `alpha.1`–`beta.2` release flow after a unanimous
  implementer/release-verifier/thinker GO with all gates green, the strictly
  unpublished `alpha.0` baseline, and the single human stop at #1178 RC admission.
  Human ownership of architecture, public API/surface, security boundaries,
  exceptions and gate waivers is preserved verbatim in each document.
- R5: implementer repair resume uses only the installed CLI's valid resume form —
  `--session <id>` with prompt/output arguments; model and profile flags appear only
  on fresh sessions. The release verifier still rejects every resume form.
- R6: all RED and GREEN evidence in this result comes from direct, unpiped commands
  with the runner's true exit codes, superseding the repair-1 piped record.

COMMANDS_AND_EXIT_CODES:
GREEN (each command run directly, no pipes; exit code is the command's own status):

- `deno test --allow-read --allow-write tools/check-role-neutral-docs.test.ts tools/run-v044-role.test.ts tools/check-v044-orchestration.test.ts tools/check-v044-executor.test.ts tools/autoflow/__tests__/loop-evidence.test.ts tools/autoflow/__tests__/cli.test.ts` → exit 0 (37 passed, 0 failed)
- `deno test --allow-read --allow-write --allow-env --allow-net --allow-run tools/autoflow/__tests__/` → exit 0 (105 passed, 0 failed)
- `deno task v044:orchestration:check` → exit 0
  (`v0.44 orchestration check passed (16 control files, 28 scheduled issues, role-neutral executor configuration).`)
- `deno task docs:check-role-neutral` → exit 0
  (`role-neutral documentation check passed (0 violations, zero exemptions).`)
- `deno task docs:check-current` → exit 0 (`Docs truth check passed (current).`)
- `deno task workflow:check` → exit 0
- `deno task fmt:check` → exit 0 (`Checked 1341 files`)
- `deno task lint` → exit 0 (`Checked 733 files`)
- `deno task typecheck` → exit 0
- `deno task arch:check` → exit 0
  (`Architecture contract check passed (1770 tracked files, 71303215 bytes).`)
- `deno task v044:executor:check` → exit 0 (configured executor CLI present, context
  262144, default effort high, both role profiles loaded)
- `deno task autoflow:push` → exit 0 (PASS fmt:check, lint, typecheck, graph:check,
  package-surface:check, export-files:check, generate:ui-tokens:check,
  docs:check-role-neutral)

Intermediate failure kept for honesty: the first full autoflow-suite run exited 1
because two pre-existing parse expectations in `tools/autoflow/__tests__/policy.test.ts`
did not yet include the new `prCiEvidence` option field; both assertions were extended
and the rerun above passed. No failing check was hidden and no test was weakened.

Migration manifest: regenerated at
`docs/evidence/v0.44.0-agent-loops/a0-002-repair-2/migration-manifest.json` with 28
migrated files (before/after git blob SHA1 each), including the previously exempted
packet `docs/evidence/v0.44.0-agent-loops/a0-002-repair-1/dispatch.md`; the manifest
records the exemption-facility removal and contains zero prohibited values (verified
by the docs scan, which reads it).

RESIDUAL_RISKS:

- The `--pr-ci` evidence record is produced by the PR workflow; wiring the workflow to
  emit that artifact belongs to the thinker's CI integration step (this packet was
  forbidden from touching `.github/workflows/**`).
- Redacted vendor URLs and review-bot names remain recoverable only through Git
  history, by design.
- `deno fmt` reflowed the repair-1 review document (whitespace only); its findings
  text is unchanged.

SCOPE_CONFIRMATION:
Only packet-owned paths were edited. `git status` shows zero changes under
`packages/`, `examples/`, `www/`, `e2e/` and `.github/workflows/**`. Control-plane
edits are limited to the packet-authorized neutrality migration and the authorized
prerelease-flow correction; no product architecture, public API, security boundary,
release, tag, publication or external-state change was made. No commit, push, issue or
PR action was performed; HEAD remains the base SHA. The thinker-authored repair-1
review and repair-2 dispatch were preserved (the dispatch's own `branch` field was
neutralized as required by R2 and the zero-violation gate; nothing else in it was
altered).

NEXT_REQUIRED_ACTION:
Thinker re-review of this repair (reviewer replay tier), then closure recording for
loop a0-002-repair-2 under the parent packet's protocol.
