# a0-002-repair-1 implementer result — PASS

```yaml
loopId: a0-002-repair-1
repairs: a0-002
issue: 1156
slice: ci-evidence-tiering-and-role-neutral-docs
baseSha: 0f8d78991ab8d9840f3852fe1b9e7691f470f1ed
branch: v044/1156-ci-doc-governance-repair
status: PASS
```

This is a fresh repair run with new RED/GREEN evidence; the blocked a0-002 run made no
implementation changes. #1156 is **not** complete; this is only its first bounded slice.
The full PR CI matrix was not run locally — that single exact-SHA matrix belongs to the
PR after reviewer acceptance.

## Preflight verification

```text
$ git rev-parse HEAD
0f8d78991ab8d9840f3852fe1b9e7691f470f1ed
exit=0   # matches the repair packet baseSha

$ git status --porcelain
 M docs/current/v0.44.0-EXECUTION-STATE.json
?? docs/evidence/v0.44.0-agent-loops/a0-002-repair-1/
exit=0   # exactly the thinker-authored repair dispatch and execution-state edits;
         # preserved (the state's status/loopId/baseSha/branch/nextAction/updatedAt
         # fields are byte-identical to the thinker's dirty edit; only the two
         # executor identity blocks were neutralized)

$ git branch --show-current
v044/1156-ci-doc-governance-repair
exit=0   # matches the repair packet branch
```

## Tests added

- `tools/check-role-neutral-docs.test.ts` (5 tests) — configured-set loading, literal
  matching in JSON/code fences/case variants, token boundary matching, neutral prose
  passes, exact-path exemption only. Fixtures never spell out the prohibited set; they
  derive it from executable configuration.
- `tools/run-v044-role.test.ts` (4 tests) — configured invocation shape, fresh-session
  enforcement for the release verifier, explicit implementer resume, argument parser.
- `tools/check-v044-orchestration.test.ts` (5 tests) — state validates against
  executable configuration, embedded executor identity is rejected, unknown role
  profiles/stale config refs rejected, capability contract pinned (262144 context, high
  default effort), alpha.0 wave ordering `#1160 → #1156 → …`.
- `tools/check-v044-executor.test.ts` (3 tests) — capability evaluation accept/reject,
  profile smoke invocation built from configuration.
- `tools/autoflow/__tests__/loop-evidence.test.ts` (8 tests) — implementer never runs
  the CI matrix, reviewer replay only, PR is the single full-matrix authority, release
  closure consumes exact-SHA PR CI evidence and rejects absent/stale/mismatched/failing
  results, release-only gates stay out of the ci tier, the ci tier is the full matrix
  regardless of changed paths, and the PR workflow statically maps to the ci tier.

## RED evidence

```text
$ deno test --allow-read tools/check-role-neutral-docs.test.ts tools/run-v044-role.test.ts \
    tools/check-v044-orchestration.test.ts tools/check-v044-executor.test.ts \
    tools/autoflow/__tests__/loop-evidence.test.ts
exit=1   # TS2307 module-not-found: tools/config/load-v044-roles.ts,
         # tools/check-role-neutral-docs.ts, tools/run-v044-role.ts and
         # tools/autoflow/loop-evidence.ts did not exist; the orchestration/executor
         # checkers exported no validation API (19 type errors)

$ deno run --allow-read tools/check-role-neutral-docs.ts
role-neutral documentation check failed:
- 24 tracked documentation files flagged (governance, current state/plan, ADR-0146,
  audits, prompts, template, roadmap, issue SOP, project workflow, historical loop
  evidence), e.g. line-level literal/token matches in
  docs/governance/V044_AGENT_LOOP_SOP.md (37 lines),
  docs/prompts/<former thinker bootstrap prompt> (18 lines),
  docs/current/v0.44.0-EXECUTION-STATE.json (8 lines)
exit=1
```

GREEN: after implementation and migration, all commands below exit 0.

## Implementation

1. **Executable role configuration** — new `tools/config/v044-roles.json` +
   `tools/config/load-v044-roles.ts` (validated typed loader). Exact thinker/executor
   model identity, CLI command, provider, model alias, role-profile paths, smoke
   markers, the prohibited documentation identifier set and the single documented
   scan exemption live here, outside `docs/`.
2. **Role-neutral documentation gate** — new `tools/check-role-neutral-docs.ts` and
   `deno task docs:check-role-neutral`. Scans every text file under `docs/` (including
   JSON and code fences) plus root Markdown, case-insensitively, literal + token
   matching, file names included. Diagnostics print path/line/kind only, never the
   prohibited value. Registered in the AutoFlow push/ci/release tiers with triggers.
3. **Single role runner** — new `tools/run-v044-role.ts` and `deno task v044:role --
   <implementer|release-verifier> --prompt ...`. Builds the exact invocation from
   configuration; rejects `--session` for the release verifier (fresh-per-candidate).
4. **Preflights load configuration** — `tools/check-v044-orchestration.ts` and
   `tools/check-v044-executor.ts` no longer hardcode identity; both load
   `tools/config/v044-roles.json`. The execution state may only carry
   `roleProfile`/`executorConfig` references; embedded identity keys fail the check.
   The capability contract (262144 context, high default effort, thinking + tool_use)
   remains pinned. Executor check output is now role-neutral.
5. **CI evidence tiers** — new tested helper `tools/autoflow/loop-evidence.ts`:
   implementer = packet RED/GREEN + fast push tier (never `autoflow:ci`); reviewer =
   packet harness replay only; PR = the single exact-SHA full matrix (`autoflow:ci`,
   proven trigger-independent and statically mapped to `autoflow-ci.yml`); release
   closure = exact-SHA PR CI evidence (fail closed on absent/stale/mismatched/failing)
   plus release-only/adversarial/version-exit gates. No gate was weakened or removed;
   no workflow file was touched.
6. **Documentation migration** — 23 tracked documents migrated to the neutral role
   labels thinker / implementer / release verifier (control-plane files under the
   packet's explicit exception; all other matching `docs/**` files under the
   terminology-migration ownership). The bootstrap prompt was renamed to
   `docs/prompts/v0.44.0-THINKER-ORCHESTRATOR.md` (former name contained the prior
   thinker nickname). Historical evidence was textually redacted where commands, paths
   or links themselves contained prohibited values; facts, SHAs, exit codes and
   outcomes are preserved and original bytes remain recoverable from Git history.
   `docs/evidence/v0.44.0-agent-loops/a0-002-repair-1/migration-manifest.json` records
   every path with Git-compatible before/after blob hashes and reproduces no prohibited
   value. Both `.agents/` role profiles were content-neutralized (title/session rules);
   their paths now live only in executable configuration.
7. **Version semantics** — `VERSION_PLAN.md` and `v0.44.0-EXECUTION-PLAN.md` now record
   `alpha.0` as an internal integration baseline (no tag, publish, release entry or
   external promotion) and require actual release closure for every planned version
   from `alpha.1` through `beta.2` after exact-SHA PR CI checks. The execution plan
   orders the alpha.0 wave `#1160 → #1156 → #1157 → #1158 → #1159 → #1182` and records
   why #1156 moved immediately after #1160: it removes repeated per-loop matrix cost
   before the remaining train and makes later documentation inherit the neutral rule.
   The stale "human approval for every ordinary prerelease" instructions were removed
   from the loop; promotion GO remains human-owned at version boundaries.
8. **Execution-state reconciliation** — `v0.44.0-EXECUTION-STATE.json` executor blocks
   now reference `roleProfile` + `tools/config/v044-roles.json`; all thinker-set fields
   (status REPAIR, loopId, baseSha, branch, nextAction, updatedAt) are preserved
   byte-identically.

The one configured scan exemption is the executing repair dispatch itself
(`a0-002-repair-1/dispatch.md`), preserved verbatim as pre-migration thinker authority;
it is declared, with reason, in executable configuration.

## Commands and exit codes

```text
$ deno test --allow-read --allow-write --allow-env --allow-run \
    tools/check-role-neutral-docs.test.ts tools/run-v044-role.test.ts \
    tools/check-v044-orchestration.test.ts tools/check-v044-executor.test.ts \
    tools/autoflow/__tests__/loop-evidence.test.ts
ok | 25 passed | 0 failed
exit=0

$ deno test --allow-read --allow-write --allow-env --allow-net --allow-run tools/autoflow/__tests__/
ok | 96 passed | 0 failed
exit=0   # AutoFlow policy/CLI/release tests, including the new loop-evidence suite

$ deno task v044:orchestration:check
v0.44 orchestration check passed (16 control files, 28 scheduled issues, role-neutral executor configuration).
exit=0

$ deno task v044:executor:check
v0.44 executor check passed (configured executor CLI 0.38.0, configured model alias, context 262144, default effort high, both required role profiles loaded).
exit=0

$ deno task docs:check-role-neutral
role-neutral documentation check passed (0 violations, 1 configured exemption(s)).
exit=0

$ deno task docs:check-current
Docs truth check passed (current).
exit=0

$ deno task workflow:check
Project workflow check passed for the current Version Plan.
v0.44 orchestration check passed (16 control files, 28 scheduled issues, role-neutral executor configuration).
exit=0

$ deno task fmt:check
Checked 1337 files
exit=0

$ deno task lint
Checked 732 files
exit=0

$ deno task typecheck
exit=0   # full package graph typecheck

$ deno task arch:check
Architecture contract check passed (1770 tracked files, 71298412 bytes).
exit=0

$ deno task autoflow:push
Selected gates: fmt:check, lint, typecheck, graph:check, package-surface:check,
  export-files:check, generate:ui-tokens:check, docs:check-role-neutral
PASS all 8 selected gates
exit=0
```

## Changed files

Created:

- `tools/config/v044-roles.json`, `tools/config/load-v044-roles.ts`
- `tools/check-role-neutral-docs.ts`, `tools/check-role-neutral-docs.test.ts`
- `tools/run-v044-role.ts`, `tools/run-v044-role.test.ts`
- `tools/check-v044-orchestration.test.ts`, `tools/check-v044-executor.test.ts`
- `tools/autoflow/loop-evidence.ts`, `tools/autoflow/__tests__/loop-evidence.test.ts`
- `docs/prompts/v0.44.0-THINKER-ORCHESTRATOR.md` (rename of the former bootstrap prompt)
- `docs/evidence/v0.44.0-agent-loops/a0-002-repair-1/migration-manifest.json`
- `docs/evidence/v0.44.0-agent-loops/a0-002-repair-1/implementer-result.md` (this file)

Modified:

- `deno.json` (new `v044:role` and `docs:check-role-neutral` tasks; executor check task
  gains `--allow-read` for configuration)
- `tools/check-v044-orchestration.ts`, `tools/check-v044-executor.ts`
  (configuration-driven, export testable validators)
- `tools/autoflow/policy.ts` (new `docs:check-role-neutral` gate, push/ci/release)
- 23 tracked documents listed in the migration manifest (ADR-0146, agent-loop SOP,
  issue SOP, project workflow, autonomous goal, execution plan, execution state,
  version plan, roadmap issue map, evidence template, audits, historical loop evidence)
- both `.agents/` role profiles (content neutralization only; paths unchanged)

Deleted: the former brand-named bootstrap prompt (content preserved at the renamed
path; original bytes recoverable from Git history).

## Residual risks

- The role-neutral scanner's prohibited set is intentionally narrow (configured
  literals/tokens). Vendor names outside that set (e.g. host product names in branch
  conventions) remain factual and allowed; widening the set is a thinker decision.
- `docs:check-role-neutral` joins the push tier via path triggers; a change that never
  touches the triggered paths would only be caught at the PR full-CI tier, which is the
  designed authority split.
- The executor check's live profile smoke requires local executor credentials, as
  before; it fails closed by design.
- `alpha.0` remains the active candidate line; the internal-baseline semantics take
  effect at the first publication decision from `alpha.1` onward.

## Scope confirmation

- No edits under `packages/`, `examples/`, `www/`, `e2e/` or `.github/workflows/`
  (verified: zero changed paths in those trees).
- No gate was deleted or weakened; no assertion was loosened; no allowlist escape was
  added beyond the single configured, documented exemption for the executing repair
  dispatch.
- No product architecture, public API, security boundary, version number, tag,
  publication, release or external-state change was made.
- No commit, push, PR, issue update or merge was performed. No other coding agent was
  invoked.
- The thinker-authored repair dispatch and execution-state edits were preserved.

## Next required action

Thinker review of a0-002-repair-1: inspect every diff against the packet, replay the
packet harness independently (reviewer replay tier), then issue the GO/NO-GO decision
for the #1156 slice and, on GO, perform the authorized branch/commit/PR actions so the
exact-SHA PR full-CI matrix can run.
