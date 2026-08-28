# a0-002 dispatch — CI evidence tiering and role-neutral documentation

```yaml
loopId: a0-002
kind: governance-implementation
candidate: 0.44.0-alpha.0
issue: 1156
acceptanceSlice: ci-evidence-tiering-and-role-neutral-docs
baseSha: 3563812351258ebde655326a60b2219f5c152e9c
branch: v044/1156-ci-doc-governance
risk: high
ownedPaths:
  - tools/check-v044-orchestration.ts
  - tools/check-v044-executor.ts
  - tools/check-role-neutral-docs.ts
  - tools/run-v044-role.ts
  - tools/**tests**/
  - tools/autoflow/
  - .agents/
  - deno.json
  - docs/
forbiddenPaths:
  - packages/
  - examples/
  - www/
  - e2e/
  - .github/workflows/
maxRepairAttempts: 5
```

## Objective

Make pull-request CI the single full-matrix authority for an exact candidate SHA, stop the
implementer and reviewer from redundantly replaying that same matrix, make `alpha.0` an
internal integration baseline, require real release closure from `alpha.1` onward, and make
all repository documentation use neutral role labels instead of model/provider branding.

This is the first bounded slice of #1156. It does not complete the generic-tool retirement
matrix, dependency automation migration, link checking, workflow security scanning, or the
whole issue.

## Test-first contract

Add failing tests/checks before implementation that prove:

1. documentation fails when it contains any configured model/provider brand identifier or
   the prior thinker nickname, case-insensitively, including in JSON and code fences;
2. every current file below `docs/` passes after migration to `thinker`, `implementer`, and
   `release verifier` role labels;
3. machine-specific executor configuration remains outside `docs/`, is still validated by
   the existing preflight, and can be invoked through one repository-owned role runner;
4. the loop contract selects only packet-specific RED/GREEN commands plus the fast push
   tier for implementation, packet-specific deterministic replay for review, one exact-SHA
   full CI matrix on the PR, and version-only/adversarial work at release closure;
5. no role may claim a full-matrix PASS from a different SHA;
6. `alpha.0` is documented and machine-recorded as an internal baseline with no tag,
   package publish, release entry, or external promotion; every planned version from
   `alpha.1` through `beta.2` requires an actual release closure after its exact-SHA checks;
7. the ordered plan records why #1156 moved immediately after #1160: it removes repeated
   cost before the remaining train and makes later documentation inherit the neutral rule.

## Required implementation

### CI evidence tiers

- Define one unambiguous authority table in governance and execution-plan documents:
  packet RED/GREEN, fast pre-push, reviewer replay, PR full CI, and release closure.
- The implementer must not run `autoflow:ci`; it runs the bounded packet plus the fast push
  tier. The reviewer independently reruns the bounded acceptance harness, not the same full
  matrix. The PR workflow owns the full CI result for its exact SHA.
- Release closure must consume/link the exact-SHA PR CI result and run only missing,
  adversarial, release-only, packed-public-artifact, or version-exit checks. It must reject
  stale/mismatched SHA evidence. Do not weaken any gate or remove the PR full matrix.
- Prefer a small tested evidence-selection/helper API over prose-only convention where
  deterministic enforcement is practical. Do not create a compatibility path that silently
  skips absent CI evidence.

### Role-neutral documentation

- Add a deterministic documentation check and task that rejects the configured forbidden
  brand identifiers everywhere under `docs/`. Integrate it into the appropriate AutoFlow
  tiers with focused tests.
- Rewrite every currently matching document, including governance, current state/plan,
  ADRs, audits, prompts, templates, roadmap, and historical loop evidence. Use neutral role
  labels and stable capability descriptions. Preserve factual meaning, command exit codes,
  SHAs, issue links, and decision outcomes.
- Historical evidence may be textually redacted for this repository-wide naming migration;
  Git history is the immutable source for its prior byte representation. Record a migration
  manifest containing old/new blob hashes and paths without repeating forbidden identifiers.
- Move exact executor/model/provider constants to executable configuration outside `docs/`.
  Human documentation should reference repository tasks and roles, not vendor commands.
- Do not weaken preflight enforcement or substitute another executor.

### Version semantics

- Update the version and execution plans so `alpha.0` is an internal foundation baseline,
  not an independent release boundary.
- Require actual tag/package/release closure for `alpha.1` through `beta.2`, subject to their
  exact-SHA three-role GO and existing safety gates. Preserve the human RC architecture gate.
- Remove stale instructions that require human approval for every ordinary prerelease or
  prohibit already-authorized prerelease publication after gates pass.

## Forbidden changes

- No product, example, website, browser fixture, package surface, version number, tag,
  publication, release, merge-to-main, or workflow trigger change in this slice.
- No gate deletion, assertion weakening, allowlist escape for documentation, or acceptance
  of missing/stale CI evidence.
- No change to the compiled-element architecture or public API.
- Do not claim #1156 complete; this is only its first slice.
- Do not commit, push, merge, close the issue, or update GitHub.

## Required commands

- focused RED/GREEN tests for the documentation checker, role runner, orchestration
  preflight, and CI-evidence selection
- `deno task v044:orchestration:check`
- `deno task v044:executor:check`
- the new role-neutral documentation check
- AutoFlow policy/CLI tests
- `deno task docs:check-current`
- `deno task workflow:check`
- `deno task fmt:check`
- `deno task lint`
- `deno task typecheck`
- `deno task arch:check`
- `deno task autoflow:push`

Record exact commands and exit codes in `implementer-result.md`. Return `PASS`, `FAIL`, or
`BLOCKED`. Do not run the full PR CI tier locally; that single exact-SHA matrix belongs to
the PR after reviewer acceptance.
