# openElement

English | [Simplified Chinese](./README.zh.md)

**Web Components-native fullstack framework with a JSX-first Basic Element
authoring layer. Package line: `0.41.0-alpha.6` (`v0.41.0-alpha.6` release).
Active execution: v0.41.0-alpha.7 Mac Mastodon Desktop incubation.**

openElement treats Web Components as the application's native component model.
It builds static-first applications with JSX/VNode rendering, progressive
islands, API routes, and Vite + Nitro output. Shadow/DSD is the default
component render mode; light DOM is explicit opt-in.

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
| Basic Element                      | `@openelement/element`, `OpenElement`     | JSX-first native Web Components authoring layer for Shadow/DSD output.               |

Supporting packages such as `@openelement/core`, `@openelement/adapter-vite`,
`@openelement/signal`, `@openelement/router`, `@openelement/content`, and
`@openelement/ssg` are advanced or implementation surfaces. `@openelement/protocol`
is the runtime-free contract foundation. `@openelement/ui` is the Open
Props-backed reference component library and dogfood surface. These packages
support the two products; they are not separate first-class product lines.

Dogfood apps validate openElement; they do not define it. The Deno Desktop
Reader and alpha.7 Mastodon Desktop line are evidence surfaces for the framework
contract, not additional product lines. AutoFlow3, docs truth, release evidence,
and workflow gates are project infrastructure; they stay out of the Framework
product story.

The active workspace is the 11-package v0.41 line. Hub, RPC, CEM,
compat-check, Lit/React/vanilla interop adapters, and standalone
runtime/style-sheet/i18n packages are removed from the current package graph;
`@openelement/protocol` and `@openelement/ssg` are retained as support
packages. Historical details remain in git history and release evidence.

## Why openElement

openElement renders Web Components on the server through Declarative Shadow DOM
where that mode is selected. Static content ships as HTML first. Interactive
pieces are islands that upgrade only when their hydration strategy says they
should.

```tsx
import { definePage } from '@openelement/app';

export default definePage({
  route: { path: '/' },
  head: { title: 'Home' },
  render() {
    return <main>Hello openElement</main>;
  },
});
```

For browser-upgraded UI:

```tsx
import { defineIsland } from '@openelement/app';
import { signal } from '@openelement/element';

const count = signal(0);

export default defineIsland(
  'my-counter',
  () => <button onClick={() => count.value++}>Count: {count.value}</button>,
);
```

## Current Line

All 11 current workspace packages are aligned at **0.41.0-alpha.6**
(`v0.41.0-alpha.6`) under
[`@openelement`](https://www.npmjs.com/org/openelement). The alpha.6 release
hardens the App/protocol architecture and Reader dogfood evidence. The active next line is
**v0.41.0-alpha.7 Mac Mastodon Desktop incubation**. ADR-0101 keeps
AutoFlow3 as the single workflow/gate control plane while reserving minor/major
product decisions for human-approved ADR and version-plan evidence.

The next staged lines are **v0.41.0-beta.1 Adoption Freeze**
and **stable v0.41.0**. Alpha.7 proves a read-only,
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
