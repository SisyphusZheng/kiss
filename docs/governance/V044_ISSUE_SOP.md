# v0.44 Issue SOP

> Status: Mandatory companion to the Alpha workspace SOP and Beta three-role SOP.

## Authority order

1. accepted current ADRs;
2. `docs/current/VERSION_PLAN.md`;
3. `docs/roadmap/v0.44.0-ISSUES.md`;
4. issue acceptance criteria;
5. issue comments.

Repair lower-layer drift before implementation.

## Alpha workspace issues

Alpha.1 through Alpha.7 are independent workspace queues. The workspace agent may
implement, test, commit, push its branch and update its owned issue. It may not write
another workspace, change the shared contract unilaterally, merge into `dev`, tag,
publish or change external release state.

An Alpha claim records:

```text
[ALPHA WORKSPACE CLAIM]
Internal ID: alpha.N
Base SHA: <full-sha>
Workspace/branch: <identifier>
Owned issues and paths: <bounded list>
Targeted gates: <commands>
```

Durable transitions are `PASS`, `REPAIR`, `BLOCKED` and `READY_FOR_INTEGRATION`.
`READY_FOR_INTEGRATION` must include the exact workspace head SHA, changed paths,
RED/GREEN commands, exit codes and residual risks. Do not paste raw transcripts.

Alpha.8 is the integration issue. Its agent records every consumed workspace SHA,
integration order, conflict resolution, bounded harness results and the final PR CI
link. Only alpha.8 may advance `dev`, by exact-SHA fast-forward after green PR CI.

## Beta and later issues

At Beta.1 the three-role SOP becomes active. The thinker owns issue state and external
writes; the implementer does not commit/push; a fresh release verifier independently
closes each public candidate. Unanimous role GO and exact-SHA PR CI are required before
publication.

## Issue closing test

Close an issue only when every deliverable is backed by owned code/tests and an exact
accepted SHA, required CI is green, no fallback or waiver remains, and the current plan
stays truthful. A passing slice never closes an incomplete umbrella issue.

## Blocked and deferred work

BLOCKED records one external fact or human decision and the exact resume condition.
Deferred work requires a plan-owned later phase; it cannot be relabeled merely to avoid
a failing gate.
