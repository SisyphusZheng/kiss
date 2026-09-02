# ADR-0151: v0.44 release train retopology

- Status: ACCEPTED (2026-09-02, maintainer directive)
- Date: 2026-09-02
- Supersedes: the Beta-topology portion of ADR-0149 — the five-Beta mapping is
  withdrawn. The remainder of ADR-0149 and ADR-0150 that is not about Beta
  topology is unaffected
- Preserves: ADR-0148 compiler semantic-core/Vite integration boundary,
  exact-SHA evidence, human RC authority, and Beta.1 as the first public v0.44
  prerelease

## Context

Alpha.1 through Alpha.9 are complete: the parallel workspaces, the Alpha.8
integration and the ADR-0150 Alpha.9 semantic convergence all closed with their
recorded evidence. The public stable line remains `v0.43.3`; the v0.44 Alpha
identifiers were internal work identifiers and were never published to npm.

The previous Beta topologies no longer match the intended qualification order:
the three-Beta product ladder in the roadmap and workflow docs, and the
five-Beta ladder that ADR-0149 introduced and the version plan recorded. Both
assigned product-layer and governance work to numbered Betas before the
framework itself had a dedicated, evidence-gated qualification boundary, and
neither separated the final internal truth closure from the first public
prerelease.

The release train needs one canonical topology: a final internal checkpoint
that hard-blocks publication, three public Betas that each answer one
qualification question, one frozen release candidate, and a Stable/1.0 decision
that is earned on evidence rather than pre-declared.

## Decision

### 1. The canonical train

```text
v0.43.3 (published stable)
  -> internal Alpha.8 integration (complete)
  -> internal Alpha.9 semantic convergence (complete)
  -> internal Alpha.10 Truth Closure (current internal checkpoint)
  -> Beta.1 Framework Qualification + Governance Freeze
  -> Beta.2 Productization + Governance Offload
  -> Beta.3 Final Hardening + Formal Benchmark + Real SaaS Qualification
  -> RC1 Frozen Candidate / Soak
  -> Stable/1.0 decision
```

Execution is tracked by umbrella issue #1155 and the
"v0.44 Alpha.10 — internal (unpublished truth closure)", Beta.1, Beta.2,
Beta.3 and RC1 milestones.

### 2. Alpha.10 is the internal Truth Closure checkpoint

Alpha.10 closes the remaining release-truth drift left after Alpha.9 semantic
convergence. It is the current internal checkpoint and a hard blocker for
Beta.1 admission: Beta.1 may not begin until every Alpha.10 issue (#1209
through #1220, under umbrella #1155) carries exact closure evidence.

Alpha.10 is a scheduling, implementation and evidence identifier only. It is
not an npm version, tag, GitHub Release, dist-tag, public Alpha or `main`
promotion. No Alpha.10 artifact is published.

### 3. Each Beta answers one question

| Phase  | Responsibility                                               | Question                                       |
| ------ | ------------------------------------------------------------ | ---------------------------------------------- |
| Beta.1 | Framework Qualification + Governance Freeze                  | Is the framework itself trustworthy?           |
| Beta.2 | Productization + Governance Offload                          | Can external users really use and maintain it? |
| Beta.3 | Final Hardening + Formal Benchmark + Real SaaS Qualification | Can real workloads break the architecture?     |
| RC1    | Frozen Candidate / Soak                                      | Did we misjudge the candidate?                 |

Beta.1 remains the first intended public v0.44 prerelease
(`v0.44.0-beta.1`) and the first phase that activates the three-role release
loop.

### 4. RC1 numbering is gated on Beta.3 evidence

The RC1 version string is `v1.0.0-rc.1` when the Beta.3 v1-admission
assessment passes, and `v0.44.0-rc.1` otherwise. The assessment is made at
Beta.3 closure; it is not pre-declared here.

### 5. Stable/1.0 is never pre-declared

The Stable/1.0 decision is made on Beta.3 evidence only. The standing rule is:
never relabel an unproven surface as 1.0. A version rename without its exit
evidence is invalid.

## Consequences

- The five-Beta mapping of ADR-0149 (and the three-Beta product ladder in the
  roadmap and workflow docs) is withdrawn; ADR-0149 branch-convergence,
  immutable-candidate and human-GO mechanics that are not Beta topology remain
  in force and attach to the corresponding phases of the new train.
- Alpha.10, not a Beta, owns the final internal truth closure, so no public
  prerelease can freeze unresolved truth drift.
- Beta.1 publishes only after Alpha.10 closure evidence is exact and durable.
- Issue milestones, execution state and release automation must follow this
  train; renaming a version without updating its exit contract is invalid.
- RC1 numbering and the Stable/1.0 decision are evidence gates, not schedule
  commitments.

## Verification

- Current version-plan, status, roadmap and release-governance documents agree
  on the same train and cite this ADR.
- Alpha.10 closure is recorded in umbrella issue #1155 with exact closure
  evidence for each of #1209 through #1220 before Beta.1 begins.
- The RC1 candidate records which version-string gate branch was taken and the
  Beta.3 v1-admission evidence behind it.
