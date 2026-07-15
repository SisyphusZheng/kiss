# openElement Roadmap

Execution and release state follow the
[`Project Workflow`](../governance/PROJECT_WORKFLOW.md).

> Source of truth for forward product planning.\
> Published package line: `v0.41.0-alpha.13`.\
> Current implementation state: five-package convergence is published;
> external adopter pilot #390 remains open.\
> Maturity stage: alpha; the abandoned beta naming is retired.

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

| Package                     | Product role                                         |
| --------------------------- | ---------------------------------------------------- |
| `@openelement/element`      | Custom Elements, JSX, DSD, hydration and signals     |
| `@openelement/app`          | Pages, routing, islands and request/render semantics |
| `@openelement/adapter-vite` | Vite, content, static builds and Nitro output        |
| `@openelement/create`       | Installed starter and zero-context entrypoint        |
| `@openelement/ui`           | Optional, proven general-purpose primitives          |

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

| Version           | Theme                        | Required evidence                                                                                                                       |
| ----------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `0.41.0-alpha.10` | Five-package convergence     | Exact published CLI lifecycle; browser gates; npm, tag, GitHub Release, docs and evidence agree                                         |
| `0.41.0-alpha.11` | Audit remediation            | Runtime regressions, Workers, artifacts, protocol seam, coverage, and two-phase release truth                                           |
| `0.41.0-alpha.x`  | Adoption and interface proof | #390 and further external use expose any remaining architectural or authoring corrections                                               |
| `0.41.0`          | Core interface freeze        | Five-package graph plus `defineElement`, `definePage`, `defineApp` and `buildApp` require no further architecture-level breaking change |
| `0.42.0`          | WC Application Loop          | One route-to-interaction loop: load, DSD render, progressive form, action, error/redirect and revalidation; works without JavaScript    |
| `0.43.0`          | Universal WC SSR             | CEM/admission information, DSD/light/client-only classification, native/Lit/FAST/Stencil corpus and hydration-mismatch diagnostics      |
| `0.44.0`          | Production Runtime           | Node and Workers behavior, stream/abort/timeout, cache/ISR/SWR, deploy manifests, version-skew handling and recovery proof              |
| `0.45.0`          | WC Ecosystem Platform        | Component and application starters, CEM/open-wc workflows, migration guides, compatibility registry and external adopters               |
| `0.46.0`          | v1 Product Freeze            | Remove unused exports, decide the UI commitment, freeze errors, browser/runtime support and upgrade policy                              |
| `1.0.0-rc.x`      | Stability only               | No new capability; compatibility, reliability and documentation fixes only                                                              |
| `1.0.0`           | Stable five-package product  | External production users prove that the core interfaces are stable                                                                     |

## Roadmap rules

- No new package is created by default.
- A public adapter seam requires two real adapters or an ADR backed by runtime
  isolation, dependency-cycle, artifact-size or independent-consumer evidence.
- Auth, OAuth, ORM, databases and storage remain recipes. OpenElement owns the
  application contract, not those service products.
- Session and cache may become App behavior only when the Application Loop or
  Production Runtime has a proven semantic need; they do not get speculative
  packages.
- `@openelement/ui` must have two non-site consumers by v0.46 or shrink to
  proven primitives outside the v1 compatibility promise.
- A feature is complete only when starter, docs, packed artifacts, dogfood and
  an external adopter can use its public interface.

## Current release state

`0.41.0-alpha.10` is the published package line. npm beta.1 through beta.3 are
immutable partial artifacts and remain withdrawn from the active release story.
The planned beta name was cancelled so the version label honestly reflects
that breaking architecture and interface changes are still allowed.

The repository-side five-package work is complete. Alpha releases continue
through external adopter pilot #390 and any resulting interface maturation.
Stable `0.41.0` is cut only when those efforts uncover no further architecture,
public-interface or adoption work.

## Historical record

Older version plans, package graphs and product doctrines are preserved in
[`docs/release/`](../release/), [`docs/adr/`](../adr/) and
[`docs/audit/`](../audit/). They describe their original decisions and are not
current consumer documentation.
