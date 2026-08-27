# v0.44 Agent-Owned Issue SOP

> Status: Mandatory companion to ADR-0146 and `V044_AGENT_LOOP_SOP.md`.

## Purpose

GitHub issues are the execution queue, not the source of architectural truth. This SOP
defines how Sol may claim, update, close and reopen v0.44 issues while K3 performs
implementation and independent version verification.

## Authority order

1. accepted ADRs;
2. `docs/current/VERSION_PLAN.md`;
3. `docs/roadmap/v0.44.0-ISSUES.md`;
4. issue body acceptance criteria;
5. issue comments and model summaries.

When a lower layer conflicts with a higher layer, Sol records `BLOCKED_TRUTH_DRIFT` and
repairs the lower layer before dispatch.

## Ready test

An issue is ready only when:

- it is open, assigned to the v0.44 milestone and has a priority;
- every named blocker is closed with evidence or its required slice is demonstrably
  landed;
- its objective and acceptance criteria still agree with the active plan;
- no other active loop owns the same production files;
- the worktree baseline is clean and identified by a full SHA.

## Claim comment

Before implementation, Sol adds one issue comment:

```text
[ADR-0146 CLAIM]
Loop: <loop-id>
Candidate: <version>
Base SHA: <full-sha>
Acceptance slice: <one observable outcome>
Dispatch: <repository path/link>
Owned paths: <paths>
Risk: low | medium | high | critical
```

A stale claim may be superseded only by another Sol comment that links the previous loop
and explains recovery. K3 never comments on issues directly.

## Progress comments

Sol writes comments only at durable transitions:

- `[ADR-0146 PASS]` — packet accepted by Sol and deterministic harness;
- `[ADR-0146 REPAIR]` — reproducible failure returned to implementer;
- `[ADR-0146 BLOCKED]` — SOP blocker with exact missing authority/capability;
- `[ADR-0146 ISSUE-CLOSE]` — complete issue matrix and merged PR evidence;
- `[ADR-0146 REOPEN]` — later regression invalidated prior acceptance.

Do not post token-by-token progress or raw chain-of-thought. Commands, exit codes, SHA,
PR and evidence links are required.

## Pull request mapping

- Branch: `codex/v044-<issue>-<slice-slug>`.
- PR base: `dev`.
- PR title begins with the candidate and issue, for example
  `[0.44 alpha.1][#1161] Freeze Part Program v1`.
- The PR body links the dispatch, result evidence, issue acceptance slice, commands and
  architecture impact.
- One PR may contain several slices of one issue when they share a coherent boundary.
- Do not combine unrelated issues in one PR.
- K3 does not commit or push; Sol stages only reviewed files and owns Git/GitHub actions.
- Required CI must pass before Sol merges to `dev`; never auto-merge to `main`.

## Issue closing test

Sol closes an issue only when:

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
- Sol prepares the closure packet and fresh K3 verifier run.
- Verifier FAIL reopens or keeps open the issue that owns the defect, with a reproducible
  repair slice.
- Verifier PASS plus Sol harness PASS produces a human GO packet.
- Only the human-approved exact SHA may be promoted.

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
