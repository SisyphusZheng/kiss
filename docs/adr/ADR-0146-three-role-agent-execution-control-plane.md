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
GPT-5.6 Sol / low reasoning       KimiCode K3-256k / high
architecture thinker             implementation executor
            |                              |
            +---------- evidence ----------+
            |
            v
fresh KimiCode K3-256k / high release verifier
            |
            v
deterministic repository harness -> human promotion GO
```

Using the same K3 model for implementation and release verification is acceptable only
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

#### Sol thinker

The thinker uses `gpt-5.6-sol` with low reasoning effort. It may inspect all project
evidence, select the next topologically ready work packet, dispatch K3, review diffs,
rerun deterministic gates, update issue/evidence/control-plane records and recommend a
version GO/NO-GO. While the K3 executor is available, the thinker does not implement
product code or silently repair an executor failure itself.

#### K3 implementer

The implementer uses the configured `kimi-code/k3-256k` model, whose local provider
record must report a 262144-token context and default `high` effort. It receives exactly
one bounded dispatch packet, writes tests before or with implementation, edits only the
owned paths, and returns a structured result. It cannot choose the next issue, change
architecture/scope, edit promotion rules, close issues, commit, push, merge, tag or
publish.

#### K3 release verifier

Every published alpha or beta candidate is closed by a new K3-256k/high session using
the verifier profile. It receives the version exit contract, candidate SHA, packed
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
AND fresh K3 release verifier passes
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

### 5. Promotion remains human-owned

The autonomous loop may create local commits, push an explicitly scoped feature branch,
open/update its PR and update GitHub issue evidence when the bootstrap prompt grants that
authority. It may not merge `dev` to `main`, tag, publish npm, publish a GitHub Release,
move a dist-tag, or declare an alpha/beta/RC/Stable promotion without an explicit human
GO against the exact candidate SHA.

The loop stops at `AWAITING_HUMAN_GO` with a complete decision packet. After approval it
may execute only the specifically approved promotion steps.

### 6. Model and capability failures fail closed

Startup must verify both roles rather than assuming them:

- thinker: exact `gpt-5.6-sol`, reasoning effort `low`;
- executor/verifier: `kimi` CLI available, model `kimi-code/k3-256k`, 262144 context,
  default effort `high`, tool use and thinking capabilities.

If the configured K3 profile is missing, unauthenticated or different, the state becomes
`BLOCKED_EXECUTOR_UNAVAILABLE`. No substitute model is selected automatically.

## Consequences

- A new conversation can resume the train from repository state and one bootstrap
  prompt.
- Low-effort Sol spends tokens on architecture, routing and evidence rather than bulk
  implementation.
- K3 performs implementation and a separate K3 session attacks each release candidate
  with test-driven closure checks.
- The protocol is slower at release boundaries, but executor self-certification can no
  longer promote a version.
- The system is autonomous inside a declared work packet, not sovereign over project
  scope or releases.

## Rejected alternatives

- One agent plans, implements and verifies: correlated blind spots and no independent
  closure evidence.
- Sol implements small fixes after K3 failure: destroys role separation and makes cost
  and responsibility impossible to audit.
- Reuse the implementer K3 session as verifier: preserves the same assumptions and
  violates independent closure.
- Automatically substitute another model when K3 is unavailable: silently changes the
  user's chosen execution contract.
- Let passing tests automatically publish a prerelease: deterministic tests do not own
  product scope, package publication or release risk.

## Verification

- `deno task v044:orchestration:check` validates the control-plane files and state.
- `deno task v044:executor:check` validates the local Kimi K3-256k/high capability.
- Every loop produces a schema-conforming evidence directory.
- Every alpha/beta release note links a fresh verifier result and human GO SHA.
