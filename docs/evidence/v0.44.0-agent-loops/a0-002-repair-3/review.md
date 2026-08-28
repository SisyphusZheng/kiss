# Thinker review: a0-002-repair-3

## Decision

**NO-GO.** Repair-3 closes the prior transport, provenance, preparation, and
documentation findings, but the emitted PR-CI artifact still does not prove
that the named SHA was the code tested by the required matrix.

## Accepted findings from repair-3

- R7: the PR workflow now emits and transports a deterministic evidence
  artifact only after the required jobs succeed.
- R8: publication resolves the recorded GitHub run and fails closed on stale,
  mismatched, incomplete, duplicate, skipped, cancelled, unsuccessful, or
  unsupported evidence.
- R9: preparation runs the fast tier and publication consumes evidence for the
  post-bump candidate SHA.
- R10: the remaining short-form documentation identifier is configured,
  detected, migrated, and recorded without reproducing it in documentation.

These findings remain provisional until the exact-SHA defect below is repaired
and the complete bounded acceptance harness is replayed.

## Blocking finding

### R11 — the workflow labels head-SHA evidence while testing a different ref

The `autoflow-ci` and `node-serve-smoke` jobs invoke `actions/checkout` without
an explicit `ref`. On a `pull_request` workflow, checkout's default is the
synthetic pull-request merge ref. The aggregation job then writes
`github.event.pull_request.head.sha` into the evidence record and artifact
name. Consequently, the current workflow can successfully test the synthetic
merge commit while attesting that it tested the pull-request head commit.

That is a false exact-SHA claim and violates the governing requirement that PR
CI be the sole authoritative full matrix for one exact SHA. The structural
workflow test proves the artifact wiring but does not prove that every
repository-dependent required job checked out the attested SHA.

## Required repair

Use one trusted expression for checkout and attestation. Every
repository-dependent required job must explicitly check out the PR head SHA on
pull-request events and `github.sha` on supported non-PR events. The aggregation
job must use the same expression for its checkout, record, and artifact name.
Add a structural RED/GREEN test that enumerates every repository-dependent
required job and fails if its checkout ref is absent or differs from the
attested expression. Preserve push, workflow-call, and manual-dispatch support.

No other implementation expansion is authorized. The same configured
implementer session must perform the repair test-first and return exact exit
codes. No commit, push, merge, release, tag, or publication action is allowed.
