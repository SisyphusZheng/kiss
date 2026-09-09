# v0.44 Three-Role Autonomous Loop SOP

> Status: Mandatory for Beta.1 and later release execution. It does not govern the
> internal Alpha workspace train; see `V044_ALPHA_WORKSPACE_SOP.md`.

## 1. Roles

Exact model, provider, CLI and role-profile identity for every role lives in executable
configuration (`tools/config/v044-roles.json`), never in documentation. Documentation
and check output refer only to `thinker`, `implementer` and `release verifier`.

### Human maintainer

Owns architecture changes, public-surface exceptions, release promotion and expansion
of the autonomy envelope. Silence is not approval.

### Thinker

Runs as the configured thinker model with reasoning effort `low`. It owns state
reconciliation, topological scheduling, dispatch packets, architectural review,
independent harness execution, issue/evidence updates and GO/NO-GO preparation. It does
not implement product code while the configured executor is available.

### Implementer

Runs as a fresh or explicitly resumed configured executor session with provider-default
`high` effort and the configured implementer profile. It writes tests and
implementation for one packet. It cannot change scope, control-plane files or external
state.

### Release verifier

Runs as a **fresh** configured executor session with provider-default `high` effort and
the configured release-verifier profile. It closes one Beta or later public candidate by deriving
tests from the exit contract. It may add tests, fixtures and verification evidence, but
must never repair production code.

## 2. CI evidence tiers

One exact-SHA full CI matrix exists and it belongs to the pull request. No role may
claim a full-matrix PASS from a different SHA, and no role replays the matrix locally.

| Tier             | Owner                      | Content                                                                                        | Authority                         |
| ---------------- | -------------------------- | ---------------------------------------------------------------------------------------------- | --------------------------------- |
| Packet RED/GREEN | implementer                | The dispatch packet's focused failing/passing tests and checks                                 | Proves only the packet slice      |
| Fast pre-push    | implementer                | `deno task autoflow:push` fast tier                                                            | Local hygiene before review       |
| Reviewer replay  | thinker                    | Independent rerun of the bounded packet harness                                                | Acceptance review, not the matrix |
| PR full CI       | pull request               | `deno task autoflow:ci` full matrix on the exact PR SHA                                        | The single full-matrix authority  |
| Release closure  | release verifier + thinker | Exact-SHA PR CI result plus release-only, adversarial, packed-artifact and version-exit checks | Version GO/NO-GO input            |

Rules:

- The implementer must not run `autoflow:ci`; it runs the bounded packet plus the fast
  push tier.
- The reviewer independently reruns the bounded acceptance harness, not the full
  matrix.
- Release closure consumes/links the exact-SHA PR CI result and runs only missing,
  adversarial, release-only, packed-public-artifact or version-exit checks. Absent,
  stale, failing or SHA-mismatched CI evidence fails closed; there is no compatibility
  path that skips it.
- The machine-readable contract lives in `tools/autoflow/loop-evidence.ts` and is
  covered by focused tests.

## 3. Startup preflight

The thinker performs these checks before selecting work:

1. Confirm the task model is the configured thinker model and reasoning effort is
   `low`. If the host cannot prove this, report the configuration requirement and stop.
2. Read the files in the execution plan's required order.
3. Run `deno task workflow:check` and the current release/version checks. The
   completed Alpha workspace topology is no longer a current workflow gate.
4. Run `deno task v044:executor:check`.
5. Inspect `git status --short`, current branch, recent commits and open milestone issues.
6. Compare the JSON execution state with GitHub issue state and latest evidence.
7. Refuse to start product work on unexplained dirty files. Existing user changes are
   preserved; the thinker either proves they belong to the current baseline or stops at
   `BLOCKED_DIRTY_WORKTREE`.
8. Confirm no other implementer/verifier process is writing the shared worktree.

`deno task v044:executor:check` must prove the configured executor contract:

```text
configured executor CLI is callable
configured model alias resolves
context: 262144
default effort: high
capabilities include thinking and tool_use
both role profiles load
```

Missing or different capability sets state to `BLOCKED_EXECUTOR_UNAVAILABLE`. Never
silently substitute another host subagent, another executor model or another effort
level.

## 4. State reconciliation

`docs/current/v0.44.0-EXECUTION-STATE.json` is a cursor, not sole proof. The thinker
derives the effective state from:

1. accepted ADR and Version Plan;
2. Git commit and worktree;
3. GitHub issue/PR state;
4. loop and version evidence;
5. the JSON cursor.

Higher items win. The thinker updates stale lower items before dispatching
implementation. It must not rewrite historical evidence to make it match the present.

Allowed state values:

```text
READY
DISPATCHED
IMPLEMENTED
REVIEWED
VERIFIED
REPAIR
VERSION_CLOSURE
AWAITING_HUMAN_GO
BLOCKED_DIRTY_WORKTREE
BLOCKED_EXECUTOR_UNAVAILABLE
BLOCKED_TRUTH_DRIFT
BLOCKED_EXTERNAL
COMPLETE
```

## 5. Dispatch packet

Each active packet lives outside version control under:

```text
.v044-tmp/loops/<loop-id>/dispatch.md
```

It must name:

- candidate, issue and one acceptance slice;
- base SHA and expected branch;
- authoritative ADR/plan sections;
- owned files and explicitly forbidden files;
- test-first expectation and required negative cases;
- exact deterministic gate commands;
- output contract;
- stop conditions and maximum five repair attempts.

The thinker rejects a packet whose acceptance cannot be proved mechanically or whose
path scope is broad enough to hide unrelated refactoring. Raw prompts, transcripts,
retry logs and per-attempt packets are operational data and must not be committed.
Durable truth belongs in the issue, pull request, exact-SHA check run and published
release; repository evidence is limited to compact current contracts and release
metadata that cannot be reconstructed from those systems.

## 6. Invoke the implementer

Roles are invoked through the single repository-owned role runner, which reads the
exact executor invocation from `tools/config/v044-roles.json`:

```sh
deno task v044:role -- implementer \
  --prompt "Execute the repository dispatch packet at <absolute-dispatch-path>."
```

Rules:

- Run exactly one writing implementer process in each isolated lane worktree. Never
  run two writers in one checkout.
- Use an absolute dispatch path and the repository root as working directory.
- A packet starts a fresh session by default. Resume only the same implementer role for
  a repair of the same packet via `--session <id>` and record the session ID.
- Capture the command result in the loop evidence; do not treat conversational prose as
  a gate result.
- Never pass secrets in the prompt or evidence.

## 7. Implementer TDD contract

The implementer performs:

```text
read contract -> write/identify failing test -> prove RED -> implement smallest change
-> prove GREEN -> refactor within scope -> run packet gates -> return structured result
```

If the existing behavior already passes the proposed test, it must explain whether the
test is insufficient or the requested behavior already exists. It cannot invent work to
justify the packet.

The implementer result must report:

- `status`: PASS, FAIL or BLOCKED;
- changed and created files;
- tests added and the observed RED reason;
- implementation summary;
- exact commands and exit codes;
- residual risks and unsupported acceptance items;
- confirmation that it did not commit, push, update GitHub or edit forbidden files.

## 8. Thinker review and independent harness

The thinker never accepts the implementer's summary without inspecting the actual
worktree.

Required review:

1. verify every diff hunk belongs to the packet;
2. search for fallback renderer, compatibility shim, duplicated authority, private
   import and workspace-alias regressions relevant to the issue;
3. inspect tests for false positives, missing assertions and implementation-coupled
   behavior;
4. run the packet commands independently (reviewer replay tier);
5. run risk-tier gates:
   - low: format, targeted lint/test;
   - medium: low plus package typecheck/tests;
   - high: medium plus integration/browser or packed-consumer gates;
   - critical/version boundary: consume the exact-SHA PR full matrix, then run only
     missing adversarial, release-only, packed-artifact and version-exit checks.

The thinker records the verdict and exact commands in the owned issue/PR. FAIL creates
an uncommitted repair packet. The thinker must not edit production code to rescue the
executor.

## 9. Beta version closure with a fresh release verifier

Closure occurs for every Beta and later public publication, including repeated
`beta.N+1` repair candidates. Internal Alpha workspaces never invoke this closure; the
first three-role release closure is Beta.1.

### Closure input

The thinker freezes and records:

- candidate SHA, package versions and artifact fingerprints;
- the exact-SHA PR full-CI result link (required, fail closed when absent or stale);
- all issues and acceptance items in the candidate;
- architecture/public-surface diff;
- packed artifacts and consumer commands;
- mandatory browser/runtime/security/performance gates;
- known risks, but not the implementer's conversation or private reasoning.

### Canonical verifier command

```sh
deno task v044:role -- release-verifier \
  --prompt "Independently verify the version closure packet at <absolute-closure-path>."
```

The command must start a new session. The runner rejects `--session` for the release
verifier; resuming is forbidden for release verification.

### Test-driven verifier sequence

1. Translate every exit criterion into an observable assertion.
2. Map assertions to existing tests without trusting their names.
3. Write missing adversarial/negative tests or fixtures before judging the candidate.
4. Where practical, prove the new test detects the targeted failure using an existing
   failing fixture, rejected input or temporary non-production mutation that is fully
   reverted before the result.
5. Run packed candidates rather than workspace aliases for consumer claims.
6. Run the required browser/runtime matrix.
7. Inspect artifact contents and transferred bytes where the version claims absence.
8. Return PASS only when every mandatory assertion has evidence.

The verifier may change only test, fixture and evidence paths listed in its profile. Any
production-code change invalidates the run and becomes `VERIFIER_SCOPE_VIOLATION`.

### Failure path

- FAIL/BLOCKED produces `closure-review.md` and a new implementer repair packet.
- A repaired candidate has a new SHA and requires another fresh verifier session.
- The original verifier evidence remains immutable.
- Three closure failures with the same architectural cause stop for thinker design
  review.

## 10. Recording and GitHub updates

After an ordinary loop PASS, the thinker records:

- the exact commands, exit codes, SHA, status and residual risk in the GitHub issue/PR;
- the updated compact execution-state cursor;
- immutable check-run or release links when they exist.

Do not commit raw execution transcripts, conversation-derived summaries, or a growing
per-attempt evidence tree. Beta.2.x cleanup may migrate durable historical records only after it
proves the replacement source is complete and records any required before/after blob
identity without copying prohibited identifiers into current documentation.

Issue closure requires all issue acceptance items, not merely one packet. Version
closure requires all issues plus the independent verifier.

## 11. Git and external-write policy

The bootstrap prompt may explicitly authorize the thinker to create scoped branches,
local commits, pushes, PRs and issue comments/closure after gates pass. Executor roles
never perform those actions.

ADR-0152's public train includes `beta.2.N` and `1.0.0-alpha.N`. When release
execution is authorized, promotion, tags, npm publication, dist-tag changes and
GitHub Releases require unanimous implementer/release-verifier/thinker GO against
the exact candidate SHA with every required gate green. A planning update does
not itself authorize or perform publication. Historic v0.44 internal Alpha
workspace IDs stay unpublished and outside this public-release SOP.

Exact-SHA integration topology: PR CI proves the exact PR head SHA, and that SHA is the
candidate. `dev` advances only by fast-forward to the proved PR head (`git merge
--ff-only` or an equivalent explicit fast-forward ref update); at version closure
`main` advances only by fast-forward to the same frozen SHA. Forbidden: merge commits,
squash merges, rebase-created SHAs, force pushes and evidence relabeling. If a
fast-forward is impossible because the base moved, the candidate is stale: refreeze a
new candidate head and require a new exact-SHA PR CI run; never relabel old evidence.

These decisions remain human-owned regardless of bootstrap authorization:

- RC admission (#1178) and every Stable promotion step;
- architecture, public API/surface or release-doctrine changes;
- accepting a security exception;
- waiving a gate, security finding or public-contract mismatch.

## 12. Loop continuation and stopping

After recording PASS, the thinker immediately selects the next topologically ready
packet. It does not ask “continue?” between routine loops.

Stop only when:

- the #1178 RC admission requires a human GO;
- an allowed BLOCKED state is proven;
- the Goal completion condition is reached;
- the user interrupts or changes scope.

At every stop, report current candidate, issue/slice, exact SHA, last passing gates,
blocker or requested GO, and the single next action.
