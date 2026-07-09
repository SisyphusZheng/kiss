# openElement

English | [Simplified Chinese](./README.zh.md)

**JSX-first Web Components fullstack framework. Package line:
`0.41.0-alpha.5` (`v0.41.0-alpha.5` release). Active execution:
v0.41.0-alpha.6 App/protocol architecture hardening.**

openElement builds static-first applications with Web Components, JSX/VNode
rendering, progressive islands, API routes, and Vite + Nitro output. Shadow/DSD
is the default component render mode; light DOM is explicit opt-in.

Mandatory project workflow:
[`docs/governance/PROJECT_WORKFLOW.md`](./docs/governance/PROJECT_WORKFLOW.md).

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Deno](https://img.shields.io/badge/Deno-2.8%2B-000000)](https://deno.com/)
[![npm](https://img.shields.io/badge/npm-@openelement%2Fcore-red)](https://www.npmjs.com/package/@openelement/core)
[![CI](https://github.com/open-element/openelement/actions/workflows/autoflow-ci.yml/badge.svg)](https://github.com/open-element/openelement/actions/workflows/autoflow-ci.yml)

## Quick Start

```bash
deno run -A npm:@openelement/create my-app
cd my-app
deno task dev
```

## Product Doctrine

```text
openElement = Web Components Fullstack Framework + Basic Element
supporting packages = Protocols + UI + official stack adapters
```

| Product                            | Surface                                   | Role                                                                                 |
| ---------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------ |
| Web Components Fullstack Framework | `@openelement/app`, `@openelement/create` | Pages, layouts, routes, islands, app targets, and official Vite/Hono/Nitro adapters. |
| Basic Element                      | `@openelement/element`, `OpenElement`     | Native Web Components authoring layer, competing with Lit and FAST.                  |

Supporting packages such as `@openelement/core`, `@openelement/adapter-vite`,
`@openelement/signal`, `@openelement/router`, `@openelement/content`, and
`@openelement/ssg` are advanced or implementation surfaces. `@openelement/protocol`
is the runtime-free contract foundation. `@openelement/ui` is the Open
Props-backed reference component library and dogfood surface. These packages
support the two products; they are not separate first-class product lines.

The active workspace is the 11-package v0.41 line. Hub, RPC, CEM,
compat-check, Lit/React/vanilla interop adapters, and standalone
runtime/style-sheet/i18n packages are removed from the current package graph;
`@openelement/protocol` and `@openelement/ssg` are retained as support
packages. Historical details remain in git history and release evidence.

## Why openElement

You want the ergonomics of a full framework without handing your UI over to a
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
- **No build-tool churn.** A Deno-first toolchain takes you from zero to a
  running app in minutes:

```sh
deno run -A npm:@openelement/create my-app
cd my-app && deno task dev
```

**Why it beats the adjacent options**

- **vs. Next.js / Nuxt / SvelteKit:** native Web Components instead of a
  framework runtime; the output stays portable and inspectable, not bound to one
  meta-framework.
- **vs. Astro / Fresh:** islands are first-class OpenElement contracts with
  shared route and package graphs, not an afterthought wrapper around arbitrary
  components.
- **vs. Lit / Enhance / Stencil:** a full app framework — routing, data, deploy,
  desktop — on top of the same standards, not just a component library.

If you want components that outlive the current framework cycle and an app story
that works with the platform instead of fighting it, openElement is the lane.

## Current Line

All 11 current workspace packages are aligned at **0.41.0-alpha.5**
(`v0.41.0-alpha.5`) under
[`@openelement`](https://www.npmjs.com/org/openelement). The alpha.5 release
proved SPA mode plus the Deno Desktop Reader proof. The active next line is
**v0.41.0-alpha.6 App/protocol architecture hardening**. ADR-0101 keeps
AutoFlow3 as the single workflow/gate control plane while reserving minor/major
product decisions for human-approved ADR and version-plan evidence.

The next staged lines are **v0.41.0-alpha.7 Mac Mastodon Desktop incubation**
and **v0.41.0-beta.1 Adoption Freeze**. Alpha.7 proves a read-only,
accountless networked desktop app; beta.1 freezes the five-minute starter path,
API docs, website positioning, logo/brand rendering, npm metadata, and release
truth before stable v0.41.0.

v0.40.x removes Hub, RPC, CEM, compat-check, Lit/React/vanilla interop
adapters, and standalone runtime/style-sheet/i18n packages from the current
product line, keeps `@openelement/ssg` as the adapter-agnostic SSG engine,
keeps Vite + Nitro as the Framework base, and keeps Preact island work bounded
behind the v0.40 plan. `@preact/signals-core` is the signal engine.

The v1.0 target is a stable Web Components fullstack framework and Basic
Element authoring layer, with supporting UI, Protocols, and official adapter
contracts frozen enough for external consumers.

## Documentation

| Section       | Link                                                                                           |
| ------------- | ---------------------------------------------------------------------------------------------- |
| Guide         | [openelement.org/guide/getting-started](https://openelement.org/guide/getting-started)         |
| API Reference | [openelement.org/apilist](https://openelement.org/apilist)                                     |
| Architecture  | [openelement.org/architecture/architecture](https://openelement.org/architecture/architecture) |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Current truth lives in
[docs/status/STATUS.md](./docs/status/STATUS.md),
[docs/roadmap/ROADMAP.md](./docs/roadmap/ROADMAP.md), and
[docs/current/VERSION_PLAN.md](./docs/current/VERSION_PLAN.md). Architecture
decisions live in [docs/adr/](./docs/adr/), and historical SOP/NextVersion
packages remain release evidence until archived by the v0.40 cleanup.

## License

MIT
