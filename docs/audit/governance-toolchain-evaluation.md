# Governance Toolchain as a Separable Asset — Evaluation

> Date: 2026-07-24. Scope: alpha.17 package C evaluation, per ADR-0116.
> Conclusion is a recorded note, not a new package.

## Question

Could AutoFlow (tiered gates, policy-as-code, evidence-driven release) be
separated from this repository as a reusable asset — a tool others adopt?

## What exists today

- `tools/autoflow/policy.ts`: a single policy table mapping ~30 gates to four
  tiers (dev/push/ci/release) with changed-path selection at the fast tiers
  and unconditional full runs at the slow tiers.
- `tools/autoflow/release.ts` + `mod3.ts`: a release executor that treats
  release steps as an evidence model — every step is recorded, failure states
  are persisted, tags and evidence are immutable after the fact.
- Mechanical governance checks: architecture contract (no `as any`, allowlist
  discipline), package surface/graph, docs truth, version anchors, release
  evidence consistency.
- ~11.7k lines of tooling with unit tests for the policy itself.

## Strengths observed in practice

- The 2026-07-23 audit and the alpha.16 release both ran entirely through
  this machinery; every claim in the release note is backed by a gate or an
  evidence record.
- The tiered design keeps pre-commit fast while CI/release stay exhaustive.
- Evidence-as-code made the alpha.16 closure self-auditing: the red main CI
  after the evidence commit was the machinery catching its own gap (missing
  closure record), which is the desired failure mode.

## Coupling that blocks separation

- Gates invoke repo-specific `deno task` names; the policy table encodes this
  repository's package layout, docs hierarchy and governance documents.
- The release executor assumes the five-package lockstep model,
  `deno pack` distribution, `docs/release/` evidence layout and the
  dev→main branching contract.
- Version anchors are sourced from `tools/project-constants.ts`, a
  repo-local concept.

Separation would require a configuration layer for gate definitions, package
topology and evidence layout — roughly a redesign, not an extraction.

## Findings from the alpha.16 cycle

- The toolchain's own drift (unmaintained `ACTIVE_EXECUTION_VERSION`,
  hand-written closure records, previous-line recorded as target) shows the
  machinery still depends on manual discipline at its edges; alpha.17
  package B schedules the fixes.
- Documentation and communication value is real already: the ADR + evidence
  model is legible to outsiders and differentiates the project.

## Decision

Do not extract a package now. The asset's value is currently highest as (a)
the governance spine of this repository and (b) content — the model is more
portable as a documented approach than as code. Re-evaluate extraction only
if an external project asks to adopt the machinery, at which point the
configuration-layer redesign becomes a justified, evidenced cost.
