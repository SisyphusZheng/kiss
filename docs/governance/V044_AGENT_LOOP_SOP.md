# v0.44 Sol/K3 Autonomous Loop SOP

> Status: Mandatory for ADR-0146 execution. This SOP governs implementation from
> `v0.44.0-alpha.0` through `v0.44.0-beta.2`.

## 1. Roles

### Human maintainer

Owns architecture changes, public-surface exceptions, release promotion and expansion
of the autonomy envelope. Silence is not approval.

### Sol thinker

Runs as `gpt-5.6-sol` with reasoning effort `low`. It owns state reconciliation,
topological scheduling, dispatch packets, architectural review, independent harness
execution, issue/evidence updates and GO/NO-GO preparation. It does not implement
product code while the configured K3 executor is available.

### K3 implementer

Runs as a fresh or explicitly resumed `kimi-code/k3-256k` session with provider-default
`high` effort and `.agents/v044-kimi-implementer.md`. It writes tests and implementation
for one packet. It cannot change scope, control-plane files or external state.

### K3 release verifier

Runs as a **fresh** `kimi-code/k3-256k` session with provider-default `high` effort and
`.agents/v044-kimi-release-verifier.md`. It closes one alpha/beta candidate by deriving
tests from the exit contract. It may add tests, fixtures and verification evidence, but
must never repair production code.

## 2. Startup preflight

Sol performs these checks before selecting work:

1. Confirm the task model is exactly `gpt-5.6-sol` and reasoning effort is `low`. If the
   host cannot prove this, report the configuration requirement and stop.
2. Read the files in the execution plan's required order.
3. Run `deno task v044:orchestration:check`.
4. Run `deno task v044:executor:check`.
5. Inspect `git status --short`, current branch, recent commits and open milestone issues.
6. Compare the JSON execution state with GitHub issue state and latest evidence.
7. Refuse to start product work on unexplained dirty files. Existing user changes are
   preserved; the thinker either proves they belong to the current baseline or stops at
   `BLOCKED_DIRTY_WORKTREE`.
8. Confirm no other implementer/verifier process is writing the shared worktree.

The executor preflight must prove:

```text
kimi CLI is callable
model alias: kimi-code/k3-256k
model id: k3-256k
context: 262144
default effort: high
capabilities include thinking and tool_use
```

Missing or different capability sets state to `BLOCKED_EXECUTOR_UNAVAILABLE`. Never
silently substitute a Codex subagent, another Kimi model or another effort level.

## 3. State reconciliation

`docs/current/v0.44.0-EXECUTION-STATE.json` is a cursor, not sole proof. Sol derives the
effective state from:

1. accepted ADR and Version Plan;
2. Git commit and worktree;
3. GitHub issue/PR state;
4. loop and version evidence;
5. the JSON cursor.

Higher items win. Sol updates stale lower items before dispatching implementation. It
must not rewrite historical evidence to make it match the present.

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

## 4. Dispatch packet

Each packet lives under:

```text
docs/evidence/v0.44.0-agent-loops/<loop-id>/dispatch.md
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

Sol rejects a packet whose acceptance cannot be proved mechanically or whose path scope
is broad enough to hide unrelated refactoring.

## 5. Invoke the implementer

The canonical command shape is:

```sh
kimi \
  --model kimi-code/k3-256k \
  --agent-file .agents/v044-kimi-implementer.md \
  --auto \
  --output-format stream-json \
  --prompt "Execute the repository dispatch packet at <absolute-dispatch-path>."
```

Rules:

- Run exactly one writing K3 process in the shared worktree.
- Use an absolute dispatch path and the repository root as working directory.
- A packet starts a fresh session by default. Resume only the same implementer role for
  a repair of the same packet and record the session ID.
- Capture the command result in the loop evidence; do not treat conversational prose as
  a gate result.
- Never pass secrets in the prompt or evidence.

## 6. Implementer TDD contract

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

## 7. Sol review and independent harness

Sol never accepts the implementer's summary without inspecting the actual worktree.

Required review:

1. verify every diff hunk belongs to the packet;
2. search for fallback renderer, compatibility shim, duplicated authority, private
   import and workspace-alias regressions relevant to the issue;
3. inspect tests for false positives, missing assertions and implementation-coupled
   behavior;
4. run the packet commands independently;
5. run risk-tier gates:
   - low: format, targeted lint/test;
   - medium: low plus package typecheck/tests;
   - high: medium plus integration/browser or packed-consumer gates;
   - critical/version boundary: full repository and release matrix.

Sol writes `review.md`. FAIL creates a repair packet. Sol must not edit production code
to rescue the executor.

## 8. Version closure with a fresh K3 verifier

Closure occurs for every intended alpha and beta publication, including repeated
`alpha.N+1` or `beta.N+1` repair candidates.

### Closure input

Sol freezes and records:

- candidate SHA, package versions and artifact fingerprints;
- all issues and acceptance items in the candidate;
- architecture/public-surface diff;
- packed artifacts and consumer commands;
- mandatory browser/runtime/security/performance gates;
- known risks, but not the implementer's conversation or private reasoning.

### Canonical verifier command

```sh
kimi \
  --model kimi-code/k3-256k \
  --agent-file .agents/v044-kimi-release-verifier.md \
  --auto \
  --output-format stream-json \
  --prompt "Independently verify the version closure packet at <absolute-closure-path>."
```

The command must start a new session. `--continue` and `--session` are forbidden for
release verification.

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
- Three closure failures with the same architectural cause stop for Sol design review.

## 9. Recording and GitHub updates

After an ordinary loop PASS, Sol writes:

- `result.json` with commands, exit codes, SHA and status;
- `summary.md` explaining acceptance evidence and residual risk;
- the updated execution-state cursor;
- the GitHub issue checklist/evidence comment when external writes are authorized.

Issue closure requires all issue acceptance items, not merely one packet. Version
closure requires all issues plus the independent verifier.

## 10. Git and external-write policy

The bootstrap prompt may explicitly authorize Sol to create scoped branches, local
commits, pushes, PRs and issue comments/closure after gates pass. K3 roles never perform
those actions.

Always forbidden without a new human message naming the exact candidate SHA:

- merge `dev` to `main`;
- create/push version tags;
- publish GitHub Releases or npm packages;
- change npm dist-tags;
- record a version promotion GO;
- waive a gate, security finding or public-contract mismatch.

## 11. Loop continuation and stopping

After recording PASS, Sol immediately selects the next topologically ready packet. It
does not ask “continue?” between routine loops.

Stop only when:

- a human GO is required;
- an allowed BLOCKED state is proven;
- the Goal completion condition is reached;
- the user interrupts or changes scope.

At every stop, report current candidate, issue/slice, exact SHA, last passing gates,
blocker or requested GO, and the single next action.
