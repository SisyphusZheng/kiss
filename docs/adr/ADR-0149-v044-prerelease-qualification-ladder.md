# ADR-0149: v0.44 prerelease qualification and branch convergence ladder

- Status: ACCEPTED (2026-08-30, maintainer directive)
- Date: 2026-08-30
- Amends: ADR-0143 compatibility policy, ADR-0146 prerelease sequencing, and
  ADR-0147 post-Alpha handoff
- Preserves: ADR-0148 compiler semantic-core/Vite integration boundary, the
  three-role Beta closure protocol, exact-SHA evidence, and human RC authority

> Supersession note (2026-09-02): the Beta topology of this ADR — the five-Beta
> mapping in section 2 and the downstream phase assignments that depend on it —
> is withdrawn by ADR-0151. Everything else in this ADR that is not about Beta
> topology (branch convergence mechanics, immutable-candidate discipline, human
> RC authority) is unaffected.

## Context

The internal Alpha workspaces now produce one coherent framework substrate, but the
previous ladder assigned the first public Beta directly to UI reconstruction. That
would publish and qualify the framework, activate the three-role release protocol, and
begin a product-layer rebuild in one boundary. It also deferred Trusted Publishing,
provenance and release protection until after UI and website qualification.

The release ladder needs explicit framework qualification before product-layer work,
early publication hardening, and one immutable real-product candidate before human RC
admission.

## Decision

### 1. Alpha.8 remains internal and unpublished

Alpha.8 completes integration, ADR-0148 verification, legacy absence, packed-consumer
qualification and exact-SHA PR CI. Its accepted SHA advances `dev`, but Alpha.8 creates
no tag, npm publication, GitHub Release, dist-tag change or `main` promotion.

### 2. The public prerelease ladder is reordered

| Phase  | Responsibility                                                                                                                                                                         |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Beta.1 | Independently qualify the integrated framework, activate the three-role closure protocol, publish the first v0.44 prerelease, and converge remote branches after evidence preservation |
| Beta.2 | Establish release/governance foundations: Trusted Publishing/OIDC, exact-SHA closure evidence, provenance, rulesets and mature pinned repository tooling                               |
| Beta.3 | Qualify the integrated UI system                                                                                                                                                       |
| Beta.4 | Qualify the website, content, API metadata and Starter                                                                                                                                 |
| Beta.5 | Perform final documentation/evidence and media/repository hardening, then qualify an immutable candidate through the independent SaaS                                                  |
| RC     | Admit the identical Beta.5 SHA and artifacts only after explicit human GO                                                                                                              |
| Stable | Require the remaining soak and an explicit human promotion decision                                                                                                                    |

Beta.1 owns framework qualification rather than a new framework architecture wave.
ADR-0148 direct-core, forbidden-import, deterministic artifact, Vite-shell and
compiler-to-runtime conformance evidence is part of its exit contract.

### 3. Beta.1 owns one-time remote branch convergence

After Beta.1 publication evidence is durable, every remote branch is inventoried and
classified. Open pull requests must be merged, closed, retargeted or explicitly carried
into a later Beta before their head branches are eligible for deletion. Unknown-owned
branches fail closed.

Deletion uses an explicit reviewed branch-name list; globs, force-pushes and inferred
ownership are forbidden. The convergence gate succeeds only when the long-lived remote
heads are `dev` and `main`, all remaining work starts later from `dev`, and GitHub and
release provenance retain the deleted branches' exact-SHA evidence. Local user
worktrees and branches are a separate scope and are never recursively deleted by this
gate.

### 4. Governance hardening is split by dependency order

Publication authorization, Trusted Publishing, provenance, rulesets and generic-tool
offload move to Beta.2. Final ADR/current-document convergence, immutable production
media, visual-baseline ownership and repository-weight reduction remain Beta.5 because
they depend on the UI and website being stable.

### 5. Beta.5 is an immutable RC candidate

The independent SaaS consumes the exact Beta.5 public artifacts. A successful result
may support RC admission only when RC uses the same commit SHA, package bytes,
integrity records and provenance without rebuilding. Any production-code, dependency,
lockfile or artifact change creates a new Beta.5 candidate and repeats the complete
qualification.

Public-surface freeze therefore begins at Beta.5 candidate entry. RC admission remains
human-owned and cannot be inferred from automated or three-role GO evidence.

## Consequences

- The first public v0.44 artifact proves the framework before UI and website work build
  on it.
- Release protection becomes active before most public Beta publication churn.
- UI and website qualification move to Beta.3 and Beta.4 respectively.
- Final documentation and asset cleanup run only after their inputs stabilize.
- SaaS evidence is pre-RC but remains exact-artifact evidence rather than a rehearsal
  against different bytes.
- Issue milestones, execution state and release automation must follow this ladder;
  renaming a version without updating its exit contract is invalid.

## Verification

- Current version-plan, execution-state, roadmap and release-governance checks agree on
  the same ladder.
- Every public Beta carries machine-readable three-role closure evidence for its exact
  SHA.
- Beta.1 branch convergence records inventory, classifications, PR dispositions,
  explicit deletions and a post-delete remote-head readback.
- Beta.5 SaaS evidence records package digests and provenance; RC admission verifies
  byte identity and stops for explicit human GO.
