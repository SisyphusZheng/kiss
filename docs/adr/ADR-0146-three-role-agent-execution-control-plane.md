# ADR-0146: Three-Role Agent Execution Control Plane for v0.44

- Status: ACCEPTED (2026-08-27, required for autonomous v0.44 execution)
- Date: 2026-08-27
- Amends: ADR-0087, ADR-0089, ADR-0101 and ADR-0144
- Applies to: `v0.44.0-alpha.*` and `v0.44.0-beta.*`

## Context

The v0.44 train is too long and architecture-sensitive to depend on one chat session,
one model's memory or an executor's own claim that its work is correct. The repository
already defines the product architecture, release ladder and deterministic gates, but
it does not define how a lightweight reasoning agent can repeatedly delegate bounded
implementation to a separate coding agent and resume safely in a new conversation.

The desired operating model is:

```text
thinker / low reasoning effort    implementer / high effort
                                   |
            +---------- evidence --+
            |
            v
fresh high-effort release verifier
            |
            v
deterministic repository harness -> unanimous loop GO (human GO at RC)
```

Exact model, provider and profile identity for every role lives in executable
configuration (`tools/config/v044-roles.json`), never in documentation. Using the same
configured executor for implementation and release verification is acceptable only
when the verifier is a fresh session with a different role contract, no executor
conversation history and no authority to repair production code. The separation is
epistemic and procedural, not merely a different name in one conversation.

## Decision

### 1. The repository is the durable control plane

Chat history and model reasoning are disposable. These files own resumable truth:

- `docs/current/VERSION_PLAN.md` owns version scope and promotion gates;
- `docs/roadmap/v0.44.0-ISSUES.md` owns the dependency graph;
- `docs/current/v0.44.0-AUTONOMOUS-GOAL.md` owns the transferable Goal;
- `docs/current/v0.44.0-EXECUTION-PLAN.md` owns the wave and loop plan;
- `docs/current/v0.44.0-EXECUTION-STATE.json` owns the current machine state;
- `docs/governance/V044_AGENT_LOOP_SOP.md` owns the execution protocol;
- `docs/evidence/v0.44.0-agent-loops/` owns append-only loop and closure evidence.

An agent must reconstruct state from these files and Git/GitHub before acting. It must
never infer completion from a previous conversation.

### 2. Three roles have non-overlapping authority

#### Thinker

The thinker runs as the configured thinker model with low reasoning effort. It may
inspect all project evidence, select the next topologically ready work packet, dispatch
the implementer, review diffs, rerun deterministic gates, update
issue/evidence/control-plane records and recommend a version GO/NO-GO. While the
configured executor is available, the thinker does not implement product code or
silently repair an executor failure itself.

#### Implementer

The implementer uses the configured executor model, whose local provider record must
report a 262144-token context and default `high` effort. It receives exactly
one bounded dispatch packet, writes tests before or with implementation, edits only the
owned paths, and returns a structured result. It cannot choose the next issue, change
architecture/scope, edit promotion rules, close issues, commit, push, merge, tag or
publish.

#### Release verifier

Every published alpha or beta candidate is closed by a fresh high-effort executor
session using the verifier profile. It receives the version exit contract, candidate SHA, packed
artifacts and repository state, but not the implementer's conversation. It must:

1. derive a closure test plan from acceptance criteria;
2. identify missing adversarial, negative, lifecycle, packed-consumer and portability
   coverage;
3. add tests or fixtures only when coverage is missing;
4. run the required version matrix against the candidate;
5. return PASS, FAIL or BLOCKED with exact evidence.

The verifier may edit tests, fixtures and its evidence record. It may not edit production
code. A failure returns to a new implementer packet; the repaired candidate is checked by
another fresh verifier session.

### 3. Deterministic gates outrank model judgment

Model review is useful but non-authoritative. A work packet is accepted only when:

```text
implementer reports completion
AND thinker verifies scope and diff
AND deterministic packet gates pass
```

A version candidate is accepted only when:

```text
all version issues carry evidence
AND fresh release verifier passes
AND thinker independently reruns the closure harness
AND repository/GitHub truth agrees
```

No model may waive a failing gate. Flaky or unavailable infrastructure is BLOCKED, not
PASS.

### 4. One loop owns one bounded work packet

Only one product-code executor writes the shared worktree at a time. A packet names one
issue, one acceptance slice, owned files, forbidden files, required tests, gate commands
and completion evidence. The thinker may split a large issue into several cells, but it
may not combine unrelated issues merely to reduce loop count.

The state machine is:

```text
READY -> DISPATCHED -> IMPLEMENTED -> REVIEWED -> VERIFIED -> RECORDED -> READY
              |             |             |
              +----------> REPAIR <--------+
                              |
                           BLOCKED
```

At a version boundary, `VERSION_CLOSURE` runs between `VERIFIED` and `RECORDED`.

### 5. Prerelease promotion is delegated; RC admission remains human-owned

The autonomous loop may create local commits, push an explicitly scoped feature branch,
open/update its PR and update GitHub issue evidence when the bootstrap prompt grants that
authority. Under the active bootstrap authorization, the loop also executes the complete
`alpha.1`–`beta.2` prerelease release flow — merging `dev` to `main`, tagging, npm and
GitHub Release publication, dist-tag moves, evidence/issue updates and cursor
advancement — after a unanimous implementer/release-verifier/thinker GO against the
exact candidate SHA with every deterministic gate green. `alpha.0` remains strictly
unpublished. The loop may not declare an RC or Stable promotion, change architecture or
public surface, waive a gate, or accept a security exception without an explicit human
GO against the exact candidate SHA.

Only #1178 RC admission stops the loop at `AWAITING_HUMAN_GO` with a complete decision
packet. After approval it may execute only the specifically approved promotion steps.

### 6. Model and capability failures fail closed

Startup must verify both roles rather than assuming them:

- thinker: the configured thinker model, reasoning effort `low`;
- executor/verifier: the configured executor CLI available, the configured model alias,
  262144 context, default effort `high`, tool use and thinking capabilities.

If the configured executor profile is missing, unauthenticated or different, the state
becomes `BLOCKED_EXECUTOR_UNAVAILABLE`. No substitute model is selected automatically.

## Consequences

- A new conversation can resume the train from repository state and one bootstrap
  prompt.
- The low-effort thinker spends tokens on architecture, routing and evidence rather
  than bulk implementation.
- The implementer performs implementation and a separate fresh verifier session attacks
  each release candidate with test-driven closure checks.
- The protocol is slower at release boundaries, but executor self-certification can no
  longer promote a version.
- The system is autonomous inside a declared work packet, not sovereign over project
  scope or releases.

## Rejected alternatives

- One agent plans, implements and verifies: correlated blind spots and no independent
  closure evidence.
- The thinker implements small fixes after an implementer failure: destroys role
  separation and makes cost and responsibility impossible to audit.
- Reuse the implementer session as verifier: preserves the same assumptions and
  violates independent closure.
- Automatically substitute another model when the configured executor is unavailable:
  silently changes the user's chosen execution contract.
- Let passing tests automatically publish a prerelease: deterministic tests do not own
  product scope, package publication or release risk.

## Verification

- `deno task v044:orchestration:check` validates the control-plane files and state.
- `deno task v044:executor:check` validates the configured local executor capability
  (262144 context, default high effort, thinking and tool use).
- Every loop produces a schema-conforming evidence directory.
- Every alpha/beta release note links a fresh verifier result and the unanimous loop GO
  SHA; RC admission links the human GO SHA.
