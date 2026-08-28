# Thinker review: a0-002-repair-4

## Decision

**NO-GO.** The R11 exact-checkout repair is correct and its bounded replay is
green, but the accumulated packet still contains release-doctrine
contradictions and does not define a topology that can preserve the SHA proved
by PR CI through `dev` and `main` integration.

## Accepted R11 evidence

- Every repository-dependent required PR job explicitly checks out
  `${{ github.event.pull_request.head.sha || github.sha }}`.
- The evidence writer and artifact name use the identical trusted expression.
- The parsed-workflow test enumerates all repository-dependent required jobs.
- Thinker replay passed the focused workflow tests, provenance rejection
  matrix, role-neutral documentation tests, action pins, workflow checks,
  orchestration check, current-doc truth check, and configured-executor check.

R11 remains accepted unless the last repair regresses it.

## Blocking findings

### R12 — alpha.0 is still described as publishable

`docs/roadmap/v0.44.0-ISSUES.md` says that alpha.0 may publish after two
foundation conditions. The governing objective makes alpha.0 an internal
baseline that must never be tagged, published, released, promoted, or assigned
an external release action.

### R13 — the RC checklist still requires human GO for every alpha/beta

`docs/current/VERSION_PLAN.md` still requires an exact human promotion GO for
every published alpha/beta candidate. The accepted doctrine authorizes
alpha.1–beta.2 after unanimous implementer, fresh release verifier, and thinker
GO; the only prerelease-train human stop is #1178 RC admission.

### R14 — exact-SHA integration topology is unspecified

The workflow now proves the PR head SHA, and publication requires evidence for
the checked-out `main` HEAD. The docs merely say “merge” or “integrate.” A
normal merge, squash, or rebase can create a different SHA, making the PR-CI
evidence stale. Repository truth currently shows `dev` and `main` are
unprotected, so an explicit fast-forward-only topology is available without an
exception: after exact-head PR CI succeeds, advance `dev` only by fast-forward;
at version closure advance `main` only by fast-forward to that same frozen SHA.
If either fast-forward is impossible because the base moved, the candidate is
stale and must be rebased/refrozen and pass a new PR-CI run. Merge commits,
squash, rebase-created SHAs, force pushes, and evidence relabeling are forbidden.

The last repair must document and deterministically enforce these truths.
