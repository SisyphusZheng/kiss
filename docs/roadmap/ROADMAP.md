# OpenElement Roadmap

Execution and release state follow the
[`Project Workflow`](../governance/PROJECT_WORKFLOW.md).

> Source package line: `v0.43.3`.\
> npm registry line: `v0.43.3` (published 2026-08-26, dist-tag `latest`).\
> Latest landed train: `v0.43.3`.\
> Active execution target: `v0.44.0-alpha.0`.\
> Next planned train: `v0.44.0-alpha.1`.\
> Stable support line: `0.43.x` maintenance while 0.44 is prerelease.

`0.43.3` is both the current source package line and the published stable npm line;
the active execution target is planning and implementation truth, not a published
package claim.

## Product direction

```text
OpenElement = Web Components-native fullstack application framework

Element = native component model and local reactive DOM owner
Island  = client capability delivery boundary
App     = route, data, server rendering and deployment orchestration
```

The 0.43 line proved the application loop, Universal WC SSR, DSD/light activation and
portable application delivery, then entered maintenance under ADR-0140. Architecture
review subsequently established that its runtime reconstructs compile-time knowledge
through too many overlapping concepts. ADR-0143 is the explicit re-entry decision:
0.44 replaces that path with a mandatory compiler and a single Part Program.

## Current and forward lines

| Version           | State                | Product claim and exit evidence                                                                      |
| ----------------- | -------------------- | ---------------------------------------------------------------------------------------------------- |
| `0.41.0`          | Shipped              | Scoped five-package interface freeze                                                                 |
| `0.42.0`          | Shipped              | WC Application Loop: loader/action, progressive forms, build-to-start                                |
| `0.43.0`          | Shipped              | Universal WC SSR admission, DSD/light/client-only classification and diagnostics                     |
| `0.43.1`–`0.43.3` | Stable maintenance   | Cumulative qualification, runtime containment and in-place light-DOM activation                      |
| `0.44.0-alpha.0`  | Active               | Architecture constitution, governance offload, Content Graph and executable compiler spike           |
| `0.44.0-alpha.1`  | Planned next         | Standard decorators and canonical OpenElement compiler contract                                      |
| `0.44.0-alpha.2`  | Planned              | Part Program and fresh browser DOM without VNodes                                                    |
| `0.44.0-alpha.3`  | Planned              | Element kernel, SignalEngine, lifecycle, roots, context and forms                                    |
| `0.44.0-alpha.4`  | Planned              | Same-program server serialization and existing-DOM claim                                             |
| `0.44.0-alpha.5`  | Planned              | Runtime-free static output and generated Island delivery                                             |
| `0.44.0-alpha.6`  | Planned              | App, SSG/request-time, Vite and Nitro convergence                                                    |
| `0.44.0-alpha.7`  | Planned              | Old-path removal, migration, CEM and ecosystem interop                                               |
| `0.44.0-alpha.8`  | Planned              | Final-alpha framework, performance, portability and packed-consumer qualification                    |
| `0.44.0-beta.1`   | Gated                | Rebuilt UI system and validated Zag composition on final-alpha artifacts                             |
| `0.44.0-beta.2`   | Gated                | Rebuilt website and Starter on exact beta.1 framework and UI artifacts                               |
| `0.44.0-rc.1`     | Gated, not automatic | Exact-SHA framework, UI and website matrix passes and freezes the candidate                          |
| `0.44.0`          | Gated                | Independent SaaS qualifies the RC; soak, release evidence and explicit Stable GO pass                |
| `1.0.0`           | Long-term goal       | External production evidence proves the Element/App/build contracts deserve compatibility permanence |

Qualification expands deliberately: final alpha proves the framework, beta.1 proves UI,
beta.2 proves the website, and RC proves the independent SaaS before Stable. Failures may
produce additional betas or RCs. A required architecture/framework-surface change after
final alpha returns the line to alpha; a public-surface change after RC also returns it.

## 0.44 architecture

```text
source                               delivery
-------------------------------      ------------------------------------
@element class extends OpenElement   App -> HTML/DSD
@property fields                     static -> done, zero client runtime
TSX                                  interactive -> Island activation module
       |                                          |
       v                                          v
compiler -> Part Program             browser Custom Element upgrade
              |                                   |
       +------+-------+                           v
       |      |       |                    Element-owned Parts/Regions
      SSR   create   claim                         ^
                                                  |
                                             SignalEngine
```

The architecture has one public authoring grammar, one generated program and three
execution modes. It has no runtime Template layer, VNode renderer, binding-descriptor
tree or application-wide Client model.

## Parallel foundation work

The compiler rewrite does not excuse repository debt. `alpha.0` also starts two
foundational tracks:

1. **Governance offload (ADR-0144).** Deno and mature open-source tools own generic
   formatting, dependencies, Markdown, links, workflow validation, workflow security,
   security posture and package quality. AutoFlow shrinks to OE-specific conformance,
   coherent versioning, publish ordering and evidence.
2. **Unified Content Graph (ADR-0145).** `deno doc` extracts TypeScript/JSDoc, the
   compiler emits Custom Elements Manifest metadata, Markdown supplies authored
   explanation, and Content Collections normalizes them into API docs, nav, search,
   SEO, release and roadmap outputs.

These tracks block RC because they remove duplicate authorities and make the new
public surface mechanically visible. They do not block early compiler experiments.

## Roadmap rules

- OpenElement itself is the core Custom Element model; it is not replaced by a
  decorator, a generated function or the App layer.
- Mechanism belongs to Element, delivery policy to Island, orchestration to App.
- One fact has one owner. Generated views replace handwritten copies.
- No new public package without an independent consumer or a package-boundary ADR.
- No abstraction is called pluggable without a second conformance implementation or
  test engine.
- No fallback renderer is shipped to hide unsupported compiler syntax.
- Composition is the default. Auth, databases, storage, queues, telemetry backends and
  provider products remain recipes unless repeated provider-neutral evidence proves a
  framework seam.
- A layer is complete only when the next product boundary consumes its public artifacts:
  UI consumes final alpha, the website consumes beta.1 and the SaaS consumes RC.

## Release governance

The authoritative release ladder, RC gate, Stable gate and verification matrix are in
[`VERSION_PLAN.md`](../current/VERSION_PLAN.md). The executable task graph is in
[`v0.44.0-ISSUES.md`](./v0.44.0-ISSUES.md). Historical plans and superseded product
doctrines remain in [`docs/release/`](../release/) and [`docs/adr/`](../adr/); they are
evidence of their own time, not current instructions.
