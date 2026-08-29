# v0.44 Agent-Owned Issue SOP

> Status: Mandatory companion to ADR-0146 and `V044_AGENT_LOOP_SOP.md`.

## Purpose

GitHub issues are the execution queue, not the source of architectural truth. This SOP
defines how the thinker may claim, update, close and reopen v0.44 issues while the
implementer performs implementation and the release verifier performs independent
version verification.

## Authority order

1. accepted ADRs;
2. `docs/current/VERSION_PLAN.md`;
3. `docs/roadmap/v0.44.0-ISSUES.md`;
4. issue body acceptance criteria;
5. issue comments and model summaries.

When a lower layer conflicts with a higher layer, the thinker records
`BLOCKED_TRUTH_DRIFT` and repairs the lower layer before dispatch.

## Ready test

An issue is ready only when:

- it is open, assigned to the v0.44 milestone and has a priority;
- every named blocker is closed with evidence or its required slice is demonstrably
  landed;
- its objective and acceptance criteria still agree with the active plan;
- no other active loop owns the same production files;
- the worktree baseline is clean and identified by a full SHA.

## Claim comment

Before implementation, the thinker adds one issue comment:

```text
[ADR-0146 CLAIM]
Loop: <loop-id>
Candidate: <version>
Base SHA: <full-sha>
Acceptance slice: <one observable outcome>
Dispatch: <local uncommitted packet path>
Owned paths: <paths>
Risk: low | medium | high | critical
```

A stale claim may be superseded only by another thinker comment that links the previous
loop and explains recovery. The implementer never comments on issues directly.

## Progress comments

The thinker writes comments only at durable transitions:

- `[ADR-0146 PASS]` — packet accepted by the thinker and deterministic harness;
- `[ADR-0146 REPAIR]` — reproducible failure returned to implementer;
- `[ADR-0146 BLOCKED]` — SOP blocker with exact missing authority/capability;
- `[ADR-0146 ISSUE-CLOSE]` — complete issue matrix and merged PR evidence;
- `[ADR-0146 REOPEN]` — later regression invalidated prior acceptance.

Do not post token-by-token progress or raw chain-of-thought. Commands, exit codes, SHA,
PR and evidence links are required.

## Pull request mapping

- Branch: `v044/<issue>-<slice-slug>` (the host may add its configured namespace).
- PR base: `dev`.
- PR title begins with the candidate and issue, for example
  `[0.44 alpha.1][#1161] Freeze Part Program v1`.
- The PR body records the issue acceptance slice, exact commands/check links and
  architecture impact. It does not copy a raw prompt or transcript.
- One PR may contain several slices of one issue when they share a coherent boundary.
- Do not combine unrelated issues in one PR.
- The implementer does not commit or push; the thinker stages only reviewed files and
  owns Git/GitHub actions.
- Required CI must pass before the thinker merges to `dev`; never auto-merge to `main`.

## Issue closing test

The thinker closes an issue only when:

1. every deliverable and acceptance checkbox is backed by code/test/docs/evidence;
2. all owned PRs are merged to `dev` and required CI is green;
3. packed-artifact checks pass where the issue makes consumer claims;
4. no temporary fallback, disabled test, TODO waiver or private workspace coupling
   remains;
5. the issue-close comment records exact merge SHA and commands;
6. current plan, issue map and generated docs remain truthful.

A passing slice never closes an incomplete umbrella issue.

## Version-boundary issue behavior

- The last implementation issue becoming green moves state to `VERSION_CLOSURE`; it does
  not close the version.
- The thinker prepares the closure packet and the fresh release verifier run.
- Verifier FAIL reopens or keeps open the issue that owns the defect, with a reproducible
  repair slice.
- Verifier PASS plus thinker harness PASS completes the unanimous
  implementer/release-verifier/thinker GO that authorizes meaningful public alpha
  candidates and the `beta.1`–`beta.3` release flow; at #1178 it instead produces the
  human GO packet.
- Prerelease promotion uses the recorded unanimous loop GO; only the human-approved
  exact SHA may be promoted to RC.

## Blocked and deferred work

BLOCKED comments name one external fact or human decision and the exact resume command.
Low-priority work may be deferred only when the Version Plan permits it and the issue has
an owner, rationale and proof that it is non-blocking. P0/P1 work cannot be relabeled to
escape a gate without human approval.

## Reopening

Reopen an issue when later integration disproves its acceptance evidence, including a
beta UI or website failure that reveals an alpha framework defect. Link the discovering
closure evidence, identify the earliest invalidated contract, and follow the release
ladder's return-to-alpha rule when architecture/public surface changes are required.
