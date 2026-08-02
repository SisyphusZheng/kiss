# openElement Roadmap

Execution and release state follow the
[`Project Workflow`](../governance/PROJECT_WORKFLOW.md).

> Source of truth for forward product planning.\
> Source package line: `v0.42.0-alpha.12`.\
> npm registry line: `v0.42.0-alpha.12` (published 2026-08-02, dist-tag `alpha` — see Current release state).\
> Active execution target: `v0.42.0-alpha.12`.\
> Current implementation state: five-package convergence is published;
> 0.42 alphas through alpha.7 closed the light-fullstack floor (morph
> residuals, start path, SSG fail-closed, CSRF default, honest tags);
> alpha.9 shipped the cleanup train and the first fully completed AutoFlow3
> five-package publish; alpha.10 shipped the audit round 4 remediation
> trains; alpha.11 shipped the audit round 5 remediation trains;
> alpha.12 is published to npm (2026-08-02) and alpha.13 (TP-6) is the
> next train.\
> Planned line: `0.42.0` (WC light fullstack) under ADR-0120 and the active
> version plan in `docs/current/VERSION_PLAN.md`.\
> Maturity stage: stable (0.41.x interface freeze under ADR-0119); the
> abandoned beta naming is retired.

## Product direction

```text
OpenElement = Web Components-native fullstack application framework
current proven scope = static-first applications with fullstack output paths
component contract = standard Custom Elements
authoring = JSX + Basic Element
rendering = DSD/shadow default + explicit light DOM
interactivity = selective element upgrade
official build path = Vite + Nitro
```

OpenElement makes Custom Elements the durable application contract rather than
a renderer integration or a leaf-widget format. `@openelement/element` supports
standalone element authors; `@openelement/app` and
`@openelement/adapter-vite` add routes, rendering, islands, static generation
and deployable output around the same contract.

The current product graph has five packages:

| Package                     | Product role                                                                   |
| --------------------------- | ------------------------------------------------------------------------------ |
| `@openelement/element`      | JSX, Custom Elements, DSD, hydration, signals and component runtime contracts  |
| `@openelement/app`          | Pages, routes, loaders, actions, islands and normalized request semantics      |
| `@openelement/adapter-vite` | Vite, content, SSG, generated data, Hono and Nitro build/deploy implementation |
| `@openelement/create`       | Version-coherent starter generation and consumer lifecycle                     |
| `@openelement/ui`           | Optional, reusable and dogfood-proven Web Component primitives                 |

Responsibility wording follows
[`STACK_CONTRACT.md`](../current/STACK_CONTRACT.md), the source of truth for
the five-package responsibility table.

`core`, `signal`, `router`, `protocol`, `content` and `ssg` are retired public
packages. Their historical names remain in ADRs and release evidence only.

## North Star: WC fullstack leadership

The goal is not to outgrow every general-purpose framework. The goal is to make
OpenElement the first choice when a team wants Web Components to define the
whole application architecture: component authorship, SSR, DSD, forms, routing,
selective upgrades and deployment.

The claim is earned through evidence, not feature count:

1. **WC authoring** — ordinary authors learn the small supported surface:
   `defineElement`, `definePage`, `defineApp` and `buildApp`.
2. **WC SSR correctness** — builds explain whether a component can use DSD,
   light DOM or client-only rendering, and why.
3. **Interop** — native, Lit, FAST, Stencil and representative third-party
   elements are continuously tested across supported browsers.
4. **Continuity** — the same page model works from static HTML through
   request-time rendering and selective upgrade.
5. **Application interaction** — standard `Request`, `Response`, `FormData`
   and Custom Element semantics support load, action, errors and redirects.
6. **Portable operations** — packed artifacts build and deploy predictably to
   Node and Workers with actionable diagnostics.

Astro, Fresh and other static-first frameworks set a high application baseline;
Lit, FAST and Stencil set a high component baseline; Enhance is the closest
HTML-first Custom Elements fullstack comparison. OpenElement differentiates by
making the standard Custom Element contract span both layers. See the official
[Astro integrations](https://docs.astro.build/en/guides/integrations/),
[Fresh islands](https://fresh.deno.dev/docs/1.x/concepts/islands),
[Lit SSR](https://lit.dev/docs/ssr/server-usage/),
[FAST SSR](https://fast.design/docs/3.x/declarative-templates/server-rendering/),
[Stencil output targets](https://stenciljs.com/docs/output-targets),
[Enhance](https://enhance.dev/) and
[open-wc testing](https://open-wc.org/guides/developing-components/testing/).

## Forward versions

> Rows through `0.41.2` are **already published** and kept here only as
> release-history context; their authoritative evidence lives in
> [`docs/release/`](../release/). Forward planning starts at `0.42.0`.

| Version           | Theme                         | Required evidence                                                                                                                                                                                                                                                                                                   |
| ----------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `0.41.0-alpha.10` | Five-package convergence      | Exact published CLI lifecycle; browser gates; npm, tag, GitHub Release, docs and evidence agree                                                                                                                                                                                                                     |
| `0.41.0-alpha.11` | Audit remediation             | Runtime regressions, Workers, artifacts, protocol seam, coverage, and two-phase release truth                                                                                                                                                                                                                       |
| `0.41.0-alpha.14` | Release recovery              | Exact-version starter, published consumers and honest two-stage evidence                                                                                                                                                                                                                                            |
| `0.41.0-alpha.15` | Adoption and interface proof  | #390, current CI runtime, cross-platform consumers and stable-interface rehearsal                                                                                                                                                                                                                                   |
| `0.41.0-alpha.16` | Correctness reset             | ADR-0116 audit findings: hydration/props correctness, island chunk matching, npm `latest` policy, #460, drift clearance                                                                                                                                                                                             |
| `0.41.0-alpha.17` | Remediation completion        | Real-browser test credibility, convergence hygiene, release-tooling evidence fixes, #390 pilot launch                                                                                                                                                                                                               |
| `0.41.0-alpha.18` | Second audit sweep            | ADR-0117: sibling-path closures, evidence honesty, reflect-prop correctness, redundancy cleanup                                                                                                                                                                                                                     |
| `0.41.0-alpha.19` | Third audit sweep             | ADR-0118 cleanup sweep: stale-claim clearance, evidence and tooling hygiene; full AutoFlow3 publish evidence                                                                                                                                                                                                        |
| `0.41.0`          | Core interface freeze         | Five-package graph plus `defineElement`, `definePage`, `defineApp` and `buildApp` require no further architecture-level breaking change                                                                                                                                                                             |
| `0.41.1`          | Stable-line tooling hardening | Shared path constants, repo-hygiene gate, vite pin alignment; no public API, package-topology or runtime-default change                                                                                                                                                                                             |
| `0.41.2`          | Release tooling self-repair   | TP-0: patch-resume mis-bump fix, release line-prose gate, mechanized active-target anchors, two-phase tag provenance                                                                                                                                                                                                |
| `0.42.0`          | WC light fullstack            | ADR-0120 loop (load → DSD → form → action → revalidate, no-JS) + first-mile `start`, fail-closed SSG, default CSRF same-origin; login via recipes (better-auth), not framework session                                                                                                                              |
| `0.43.0`          | Universal WC SSR              | CEM/admission information, DSD/light/client-only classification, native/Lit/FAST/Stencil corpus, hydration-mismatch developer diagnostics (#631), streaming SSR candidate (#626), `validateAction` pipeline (#624), cross-runtime start CLI (#628), recipes: rate-limit (#627), auth-guard (#630), file-data (#629) |
| `0.44.0`          | Production Runtime            | Framework session/flash floor, stream/abort/timeout (#626), cache/ISR/SWR external KV adapters, deploy manifests, OTel request tracing (#625), version-skew handling and recovery proof — not a prerequisite for recipe-based login on 0.42                                                                         |
| `0.45.0`          | WC Ecosystem Platform         | Component and application starters, CEM/open-wc workflows, migration guides, compatibility registry and external adopters                                                                                                                                                                                           |
| `0.46.0`          | v1 Product Freeze             | Remove unused exports, decide the UI commitment, freeze errors, browser/runtime support and upgrade policy                                                                                                                                                                                                          |
| `1.0.0-rc.x`      | Stability only                | No new capability; compatibility, reliability and documentation fixes only                                                                                                                                                                                                                                          |
| `1.0.0`           | Stable five-package product   | External production users prove that the core interfaces are stable                                                                                                                                                                                                                                                 |

## Roadmap rules

- No new package is created by default.
- A public adapter seam requires two real adapters or an ADR backed by runtime
  isolation, dependency-cycle, artifact-size or independent-consumer evidence.
- Auth, OAuth, ORM, databases and storage remain recipes. OpenElement owns the
  application contract, not those service products. Signed-in apps on 0.42 use
  recipes (e.g. better-auth on Web-standard `Request`); they do not wait for
  framework session APIs.
- Framework session and cache become App behavior in 0.44 when Production
  Runtime has a proven semantic need; they do not get speculative packages and
  must not be confused with “login is impossible before 0.44.”
- `@openelement/ui` must have two non-site consumers by v0.46 or shrink to
  proven primitives outside the v1 compatibility promise.
- A feature is complete only when starter, docs, packed artifacts, dogfood and
  an external adopter can use its public interface.

## Current release state

`0.42.0-alpha.12` is the published package line (npm, 2026-08-02). Alpha.8
was a release attempt whose npm publish failed (see CHANGELOG.md) and whose
source changes were carried forward into alpha.9; the npm registry's `alpha`
dist-tag therefore jumped straight to alpha.9 and has since advanced to
alpha.12. The next train is alpha.13.
npm beta.1 through beta.3 are immutable partial artifacts and remain withdrawn
from the active release story. The planned beta name was cancelled so the
version label honestly reflects that breaking architecture and interface
changes are still allowed.

Alpha.17 completed the first audit remediation (test credibility, convergence,
release tooling). Alpha.18 completed the second audit sweep (ADR-0117):
sibling-path closures, evidence honesty, reflect-prop correctness and
redundancy cleanup. Alpha.19 completed the third audit cleanup sweep
(ADR-0118). Stable `0.41.0` is published under ADR-0119 as a scoped interface
freeze; the #390 pilot requirement was retired by maintainer decision. The
`0.42.0` WC Application Loop line is scoped by ADR-0120 — standard form POST
wire format, the 303/422 status rule, the throw/return error dichotomy and
the after-action revalidation invariant, evidence-backed by the archived
six-framework study — with its task packages and entry/exit criteria in the
active version plan.

## Historical record

Older version plans, package graphs and product doctrines are preserved in
[`docs/release/`](../release/), [`docs/adr/`](../adr/) and
[`docs/audit/`](../audit/). They describe their original decisions and are not
current consumer documentation.
