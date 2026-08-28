# ADR-0086: AI-Readable Architecture and AutoFlow2 Roadmap

- Status: Accepted
- Date: 2026-06-06
- Target: v0.33-v1.0
- Supersedes: sequencing portions of ADR-0084
- Preserves: ADR-0083 public surface reset target

## Context

ADR-0083 correctly defers the physical public package reset until there is
evidence for a smaller v1 surface. ADR-0084 correctly identifies the product
surfaces that still need closure: rendering/deploy, server routes, data recipes,
UI starters, pruning, public surface reset, and release-candidate validation.

The sequencing is the problem. If rendering, server, data, UI, and package
reset work all land before the repository has a stronger workflow state kernel,
the v0.38 reset will depend on manual document discipline. That is too fragile
for a project that is increasingly operated by humans and AI assistants
together.

The repository already has strong primitives:

- `workflow:check`;
- `arch:check`;
- `graph:check`;
- current-doc and strategy-doc gates;
- SOP and NextVersion execution packages;
- package graph checks;
- publish dry-run and consumer smoke patterns;
- browser and E2E proof.

The missing layer is a machine-readable state and evidence model that can tell
an operator what version is active, what cells are allowed to move, what
evidence exists, and what contradictions should block progress.

This decision follows real engineering patterns rather than unconstrained
"self-evolving code":

- IBM Autonomic Computing and MAPE-K: monitor, analyze, plan, execute over an
  explicit knowledge model.
- Rainbow self-adaptation: architecture, constraints, and reusable adaptation
  infrastructure.
- Harel Statecharts and modern state-machine tooling: explicit states and legal
  transitions.
- Model-based testing: generate transition paths and command sequences against
  a model.
- Durable workflow systems such as Temporal: deterministic workflow state and
  replayable evidence.
- CI protected branches: required checks before merge.
- SWE-bench style harnesses: task progress must be measured by executable
  evidence, while benchmark and harness limits must remain visible.

## Decision

Reorder the v0.33-v0.39 line around AI-readable architecture and AutoFlow2:

```text
v0.33 AI-Readable API Foundation
v0.34 AutoFlow2 Sidecar Kernel
v0.35 AutoFlow2 Harness Gate
v0.36 Rendering Runtime and Deployment
v0.37 Server/Data/UI Product Closure
v0.38 Public Surface Reset
v0.39 v1 Release Candidate
v1.0 Stable Engine + AutoFlow Default
```

This supersedes ADR-0084 only for sequencing. ADR-0084's product concerns still
belong on the roadmap, but they move behind the architecture-readability and
workflow-evidence work.

ADR-0083 remains accepted. The v0.38 review still targets a smaller v1 surface:

```text
@openelement/protocol
@openelement/element
@openelement/ui
@openelement/framework
@openelement/create
```

The difference is that v0.38 must use AutoFlow2 evidence gathered through
v0.34-v0.37 before it freezes the final public package and import map.

## AutoFlow2 Boundary

AutoFlow2 is an internal workflow kernel before it is any kind of product.

Allowed:

- read repository state;
- compute workflow state;
- report cells, evidence, blockers, and allowed actions;
- generate machine-readable JSON and a human summary;
- fail narrow, low-noise contradictions after v0.35;
- assist task planning and PR evidence.

Not allowed:

- automatic code edits;
- automatic merge, tag, bump, release, or publish;
- subjective product scoring as a hard gate;
- replacing human review for ADRs, public API resets, package removal, release
  tags, or publishing.

AutoFlow2 enforces "do not proceed without evidence." It does not decide what is
good.

## Version Scope

### v0.33.0 - Strict AI-Readable API Reset

Make app, page, island, head, route, and render intent explicit enough for both
humans and tools to read without inference. This release is a breaking authoring
API cleanup with one canonical descriptor path.

Required direction:

- object-form `definePage({ route, head, renderIntent, load, render, error })`
  becomes the only page authoring path;
- function-form `definePage(() => ...)` is removed;
- top-level page `title`, `description`, `meta`, `rendering`, `streaming`, and
  `revalidate` are removed;
- page descriptors expose structured `head`, `route`, and `renderIntent`
  fields;
- island metadata uses `export const openElement = defineIslandConfig(...)`;
- app-level island options can declare `ssr?: boolean`;
- raw head injection uses `head.dangerouslyHeadFragments`;
- old object-literal island metadata is rejected by the adapter scanner.

### v0.34.0 - AutoFlow2 Sidecar Kernel

Introduce an internal sidecar under `tools/autoflow` or `packages/autoflow`.

It reads:

- `docs/governance/PROJECT_WORKFLOW.md`;
- `docs/status/STATUS.md`;
- `docs/roadmap/ROADMAP.md`;
- SOPs;
- `docs/next`;
- ADRs;
- package graph;
- workflow files;
- gate results where available.

It emits:

```json
{
  "version": "v0.34.0",
  "workflowState": "planned",
  "cells": [],
  "evidence": [],
  "blockers": [],
  "allowedActions": []
}
```

The sidecar is advisory in v0.34. It must not block CI except through ordinary
test failures for the sidecar itself.

### v0.35.0 - AutoFlow2 Harness Gate

Add `deno task autoflow:check` and make it fail only for hard, low-noise
contradictions:

- active version mismatch;
- missing active NextVersion package;
- SOP claim without evidence;
- invalid release state;
- package/doc/version drift;
- public API/template mismatch;
- workflow state transition that is illegal under the model.

Add state-machine and model-based tests for legal and illegal workflow
transitions. Add AutoFlow status to PR evidence and CI.

### v0.36.0 - Rendering Runtime and Deployment

Resume SSR, ISR, streaming, cache, and deployment work under AutoFlow evidence.
Rendering work must declare cells, expected evidence, and allowed transitions
before implementation.

### v0.37.0 - Server/Data/UI Product Closure

Complete server routes, mutations, data recipes, UI shell, starter templates,
Hub disposition, and product pruning under AutoFlow evidence. This version
combines the old v0.34-v0.37 product-closure work into one controlled closure
line. It may explicitly defer any product surface that cannot be proven without
reopening v1 scope.

### v0.38.0 - Public Surface Reset

Freeze the final package and import surface only after AutoFlow2 has run through
one advisory release, one gated release, and at least one product release.

v0.38 must classify all current 19 packages as public product, subpath,
internal, archived, or removed, and prove docs, templates, package graph, build,
E2E, consumer smoke, publish dry-run, and release notes agree.

## Consequences

Positive:

- v0.38 package reset depends on evidence rather than roadmap prose.
- API and workflow become easier for humans and AI assistants to read.
- AutoFlow2 starts narrow and testable before becoming a gate.
- Rendering/server/data/UI work resumes with a clearer evidence contract.

Negative:

- Rendering/server/data work moves later.
- v0.37 becomes a larger product-closure release and must be tightly scoped by
  AutoFlow2.
- More process code exists, so the sidecar can become bureaucracy if the gate
  grows beyond hard contradictions.

Neutral:

- ADR-0083's smaller v1 package target remains a target, not an immediate
  migration.
- AutoFlow2 may later become a separate product, but this ADR treats it as
  internal infrastructure.
- Old page/island APIs remain valid until a later migration ADR removes them.

## References

- IBM Autonomic Computing / MAPE-K:
  <https://research.ibm.com/publications/an-architectural-approach-to-autonomic-computing>
- Rainbow self-adaptation:
  <https://www.researchgate.net/publication/2956204_Rainbow_Architecture-Based_Self-Adaptation_with_reusable_infrastructure>
- Harel Statecharts:
  <https://www.sciencedirect.com/science/article/pii/0167642387900359>
- Stately graph/model path tooling: <https://stately.ai/docs/graph>
- fast-check model-based testing:
  <https://fast-check.dev/docs/advanced/model-based-testing/>
- Temporal durable workflow documentation: <https://docs.temporal.io/>
- GitHub protected branches:
  <https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches>
- SWE-bench Verified:
  [vendor publication URL redacted by the role-neutral migration; recoverable from Git history]
- SWE-bench limitation analysis:
  [vendor publication URL redacted by the role-neutral migration; recoverable from Git history]
