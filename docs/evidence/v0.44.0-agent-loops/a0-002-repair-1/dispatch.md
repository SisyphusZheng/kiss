# a0-002 repair 1 — unblock role-neutral control-plane migration

```yaml
loopId: a0-002-repair-1
repairs: a0-002
candidate: 0.44.0-alpha.0
issue: 1156
baseSha: 0f8d78991ab8d9840f3852fe1b9e7691f470f1ed
branch: v044/1156-ci-doc-governance-repair
risk: high
maxRepairAttemptsRemaining: 4
```

## Failure being repaired

The first packet correctly returned `BLOCKED` because its required control-plane
migration conflicted with the implementer profile's unconditional write prohibition.
The thinker has changed executable role configuration at the base SHA to allow one
narrow exception when a repair packet lists exact paths and purposes. No production
behavior, architecture, public API, security boundary, release action, or external state
is authorized.

## Required work

Complete every objective, test-first requirement, implementation requirement, forbidden
change, gate, and output item in
`docs/evidence/v0.44.0-agent-loops/a0-002/dispatch.md`, with these corrections:

- the expected branch and base SHA are those above;
- this is a repair run with fresh RED/GREEN evidence because the blocked run made no
  implementation changes;
- `.github/workflows/**` remains forbidden; prove existing PR CI retains the full matrix
  through static task/policy mapping rather than modifying workflow triggers in this
  slice;
- implementation output belongs at
  `docs/evidence/v0.44.0-agent-loops/a0-002-repair-1/implementer-result.md`;
- the migration manifest belongs under this repair evidence directory.

## Explicit control-plane exception

For this repair only, the active bootstrap authorization and updated executable role
profile permit edits to each exact path below for documentation neutrality, executable
executor configuration, CI evidence-tier enforcement, and execution-state reconciliation:

- `docs/adr/ADR-0146-three-role-agent-execution-control-plane.md`
- `docs/governance/V044_AGENT_LOOP_SOP.md`
- `docs/current/v0.44.0-AUTONOMOUS-GOAL.md`
- `docs/current/v0.44.0-EXECUTION-PLAN.md`
- `docs/current/v0.44.0-EXECUTION-STATE.json`
- `docs/current/VERSION_PLAN.md`
- `docs/prompts/` thinker-orchestrator prompt (exact filename in executable configuration)
- `.agents/` role profiles (exact paths in executable configuration)
- `tools/check-v044-orchestration.ts`
- `tools/check-v044-executor.ts`

All other tracked documentation matches under `docs/**`, plus the root documentation
files and historical loop evidence named by the deterministic scanner, are also owned for
neutral terminology migration only. Preserve their factual meaning, exact outcomes,
SHAs, commands, exit codes, and links. Record path and Git-compatible before/after blob
hashes without reproducing configured prohibited values. Original bytes must remain
recoverable from Git history.

Exact local executor identity and role-profile paths must live in executable repository
configuration outside `docs/**`. Documentation and human-readable check output may refer
only to `thinker`, `implementer`, and `release verifier`. The deterministic checker must
load its prohibited-identifier set from executable configuration and must not duplicate
that set in documentation or fixtures.

## Owned implementation/tooling paths

- `.agents/**`
- a new executable configuration under `tools/config/**`
- `tools/check-role-neutral-docs.ts` and focused tests
- `tools/run-v044-role.ts` and focused tests
- `tools/check-v044-orchestration.ts` and focused tests
- `tools/check-v044-executor.ts` and focused tests
- `tools/autoflow/**`
- `deno.json`
- tracked documentation described above
- this repair evidence directory

## Mandatory stop conditions

Stop if an edit is required under `packages/**`, `examples/**`, `www/**`, `e2e/**`, or
`.github/workflows/**`; if an existing gate cannot be preserved; if exact-SHA CI evidence
would be accepted when absent, stale, failing, mismatched, weakened, or unsupported; or if
the work requires an architecture/public-API/security decision.

Run and record all commands required by the original packet. Do not run the full PR CI
matrix locally and do not claim #1156 complete.
