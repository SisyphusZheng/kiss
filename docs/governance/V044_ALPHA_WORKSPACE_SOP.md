# v0.44 Internal Alpha Workspace SOP

> Status: Mandatory for Alpha.0 through Alpha.8. The three-role release SOP does not
> apply during this phase.
>
> Scope note (2026-09-02): Alpha.9 semantic convergence completed under the same
> internal authority. Alpha.10 (internal Truth Closure, unpublished) is governed
> by ADR-0151 through umbrella issue #1155 and does not reopen this SOP's
> Alpha.0-through-Alpha.8 workspace topology.

## Purpose

Complete Alpha quickly by giving independent agents end-to-end ownership of isolated
workspaces, then integrating once. Alpha identifiers are scheduling labels, not
published versions.

## Start gate

Do not clone workspaces until #1193 is closed with the shared contract, executable path
ownership and exact common-base SHA. After that gate, create alpha.1 through alpha.7
together from the recorded SHA.

## Workspace ownership

- One worktree, branch and writing agent per Alpha workspace.
- `tools/config/v044-alpha-workspaces.json` is the executable write boundary.
- The agent owns implementation, tests, fixtures, commits and its branch.
- No thinker/implementer handoff and no release verifier inside Alpha.
- Do not run `v044:executor:check` during Alpha; it launches the dormant Beta role
  profiles and belongs to the Beta.1 activation gate.
- Agents may communicate contract facts and exact SHAs, but never share a writable
  checkout.
- Each workspace records its accepted head SHA and targeted command exits in its issue.

## Parallel execution

Alpha.1 through Alpha.7 run concurrently. Dependency-facing work uses the frozen
contract plus owned fixtures or mocks. A shared-contract defect is raised once and
resolved for all affected workspaces; it is not hidden behind compatibility code.

Workspace agents run focused RED/GREEN tests, relevant package/type/integration subsets
and the fast push tier. They do not run or claim the full repository matrix.

## Final aggregation

Alpha.8 is created as the integration workspace and has one integration agent. That
agent consumes exact accepted source SHAs, linearly cherry-picks the reviewed commit
series in dependency order, records a source-to-integrated SHA mapping, resolves
cross-workspace failures, and owns the final pull request to `dev`.

Only the alpha.8 PR full CI is authoritative for the integrated SHA. Failure creates a
new alpha.8 SHA and repeats PR CI; it does not create a fresh release verifier.

## Prohibitions

- No Alpha tag, npm publication, GitHub Release, dist-tag change or `main` promotion.
- No three-role GO or release-verifier session.
- No force push, workspace alias, private cross-package import, hidden compatibility,
  fallback architecture, weakened test or unsupported claim.
- No raw agent transcript or per-attempt packet committed to Git.

## Exit

Alpha exits when the exact green alpha.8 PR SHA is fast-forwarded to `dev` and every
Alpha issue links its accepted workspace SHA. Beta.1 then activates the three-role
release SOP.
