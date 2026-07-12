# openElement

English | [Simplified Chinese](./README.zh.md)

**Web Components-native fullstack framework with a JSX-first Basic Element
authoring layer. Package line: `0.41.0-alpha.8` (`v0.41.0-alpha.8` release).
Completed execution anchor: v0.41.0-alpha.7 Dogfood, Architecture Convergence,
and Adoption Readiness. Next: breaking beta architecture and adoption
convergence; first coherent candidate will be `0.41.0-beta.4`.**

openElement treats Web Components as the application's native component model.
It builds static-first applications with JSX/VNode rendering, progressive
islands, API routes, and Vite + Nitro output. Shadow/DSD is the default
component render mode; light DOM is explicit opt-in.

Mandatory project workflow:
[`docs/governance/PROJECT_WORKFLOW.md`](./docs/governance/PROJECT_WORKFLOW.md).

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Deno](https://img.shields.io/badge/Deno-2.8%2B-000000)](https://deno.com/)
[![npm](https://img.shields.io/badge/npm-@openelement%2Felement-red)](https://www.npmjs.com/package/@openelement/element)
[![CI](https://github.com/open-element/openelement/actions/workflows/autoflow-ci.yml/badge.svg)](https://github.com/open-element/openelement/actions/workflows/autoflow-ci.yml)

## Beta package status

The source workspace has converged on five products: `element`, `app`,
`adapter-vite`, `create`, and optional `ui`. Beta.1-beta.3 are withdrawn partial
artifacts. The first complete candidate is `0.41.0-beta.4`; external adopter
pilot #390 remains the only non-repository release condition.

## Product Doctrine

Current alpha.8 doctrine:

```text
openElement = Web Components Fullstack Framework + Basic Element
supporting packages = Protocols + UI + official stack adapters
```

Beta target:

```text
openElement = Web Components-native application framework
authoring modes = Basic Element standalone + full application
default path = DSD/static-first + selective islands + Vite/Nitro
```

| Product                            | Surface                                   | Role                                                                                 |
| ---------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------ |
| Web Components Fullstack Framework | `@openelement/app`, `@openelement/create` | Pages, layouts, routes, islands, app targets, and official Vite/Hono/Nitro adapters. |
| Basic Element                      | `@openelement/element`, `OpenElement`     | JSX-first native Web Components authoring layer for Shadow/DSD output.               |

`@openelement/adapter-vite` owns the Vite, content, SSG, and Nitro build
implementation. `@openelement/ui` contains only reusable optional primitives.
Runtime, signal, routing, protocol, content, and SSG internals are absorbed and
are not consumer package surfaces.

Dogfood apps validate openElement; they do not define it. The Deno Desktop
Reader and Mastodon Desktop are completed foundation evidence for the alpha.7
hardening train, not additional product lines. Alpha.7 now closes architecture,
browser, security, distribution, adoption, and release-truth gaps exposed by
that dogfood. AutoFlow3, docs truth, release evidence, and workflow gates are
project infrastructure; they stay out of the Framework product story.

The active workspace is the five-package v0.41 beta line. Historical package
names remain only in ADRs and release evidence.

## Why openElement

You want application-framework ergonomics without handing your UI over to a
virtual DOM, a bespoke build pipeline, or a single vendor's component model.
openElement is for teams shipping real web apps on **native Web Components** —
SSR, routing, islands, and desktop targets included — while keeping every
component inspectable, portable, and standards-based.

**The pain it removes**

- **No framework lock-in.** Your components are real custom elements that run
  anywhere the platform runs, not a dialect that only compiles inside one tool.
- **No hydration tax by default.** Static content ships as platform HTML via
  Declarative Shadow DOM; islands upgrade only where interaction is required, so
  first paint is real and the JS payload stays small.
- **No SSR/CSR split-brain.** One authoring model renders to DSD on the server
  and upgrades in place on the client — no duplicate templates, no hydration
  mismatch.
- **One native component contract.** The beta target makes standalone Basic
  Element and full applications two depths of one product, while hiding build,
  protocol, router, signal and rendering internals from ordinary authors.

**How it differs from adjacent options**

- **vs. Next.js / Nuxt / SvelteKit:** native Web Components instead of a
  framework runtime; the output stays portable and inspectable, not bound to one
  meta-framework.
- **vs. Astro / Fresh:** OpenElement makes native Custom Elements and DSD the
  application component contract rather than one possible UI integration.
- **vs. Lit / Stencil:** OpenElement adds application routing, SSG, deployment,
  and islands around a Web Components authoring layer. Lit also has an
  experimental Labs SSR package; alpha.7 will keep this comparison sourced.
- **vs. Enhance:** both are standards-first full-stack choices; Enhance is
  HTML/MPA-first, while OpenElement explores JSX, Shadow/DSD, islands, SPA, and
  desktop targets.

If you want components that outlive the current framework cycle and an app story
that works with the platform instead of fighting it, openElement is the lane.

## Current Line

All five current workspace packages are preparing **0.41.0-beta.4** under
[`@openelement`](https://www.npmjs.com/org/openelement). The alpha.7 dogfood
foundation proves a read-only, accountless networked desktop app. The completed
**v0.41.0-alpha.7 Dogfood, Architecture Convergence, and Adoption Readiness**
line shipped its package-gated work as alpha.8; external adopter pilot #390
remains open. ADR-0101 keeps
AutoFlow3 as the single workflow/gate control plane while reserving minor/major
product decisions for human-approved ADR and version-plan evidence.

The next stage is the breaking **v0.41.0-beta architecture train**, followed by
stable v0.41.0. It repairs the published starter, narrows product positioning,
deepens app/element/build interfaces, collapses or hides shallow support
packages, removes old and redundant surfaces, realigns tests around retained
interfaces, and completes external adoption. npm beta.1–beta.3 are already
immutable partial publishes, so the first coherent candidate will be beta.4.

Vite + Nitro remain the official build and deployment path. New database,
authentication, ORM, and additional framework adapters remain scoped to v0.42+.

The v1.0 target is a stable Web Components fullstack framework and Basic
Element authoring layer, with supporting UI, Protocols, and official adapter
contracts frozen enough for external consumers.

## Documentation

| Section       | Link                                                                                           |
| ------------- | ---------------------------------------------------------------------------------------------- |
| Guide         | [openelement.org/guide/getting-started](https://openelement.org/guide/getting-started)         |
| API Reference | [openelement.org/apilist](https://openelement.org/apilist)                                     |
| Architecture  | [openelement.org/architecture/architecture](https://openelement.org/architecture/architecture) |
| Comparison    | [openelement.org/architecture/comparison](https://openelement.org/architecture/comparison)     |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Current truth lives in
[docs/status/STATUS.md](./docs/status/STATUS.md),
[docs/roadmap/ROADMAP.md](./docs/roadmap/ROADMAP.md), and
[docs/current/VERSION_PLAN.md](./docs/current/VERSION_PLAN.md). Architecture
decisions live in [docs/adr/](./docs/adr/), and historical SOP/NextVersion
packages remain release evidence until archived by the v0.40 cleanup.

For help, use [SUPPORT.md](./SUPPORT.md). Read [SECURITY.md](./SECURITY.md)
before reporting a vulnerability, [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)
for community expectations, and [MAINTAINERS.md](./MAINTAINERS.md) for review
and release ownership.

## License

MIT
