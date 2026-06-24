# openElement

English | [Simplified Chinese](./README.zh.md)

**JSX-first Web Components platform. Package line: `0.41.0-alpha.1` (`v0.41.0-alpha.1`
release). Active execution: `v0.41.0-alpha.1` Cleanup-Train Patch.**

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

## Product Matrix

```text
openElement = Elements + UI + Framework + Protocols
```

| Product   | Surface                                   | Role                                                                    |
| --------- | ----------------------------------------- | ----------------------------------------------------------------------- |
| Elements  | `@openelement/element`, `OpenElement`     | Native Web Components authoring layer, competing with Lit and FAST.     |
| UI        | `@openelement/ui`                         | First-party `open-*` components built on the Elements model.            |
| Framework | `@openelement/app`, `@openelement/create` | Pages, layouts, islands, API routes, Vite + Nitro build/runtime output. |

Supporting packages such as `@openelement/core`, `@openelement/adapter-vite`,
`@openelement/signal`, `@openelement/router`, `@openelement/content`, and
`@openelement/ssg` are advanced or implementation surfaces. They support the
three products; they are not separate first-class product lines.

In v0.40.x, the active workspace is the 10-package cleanup-train product line.
Hub, RPC, CEM, compat-check, Lit/React/vanilla interop adapters, standalone
runtime/style-sheet/i18n packages, and the `@openelement/protocol` contract
package are removed from the current package graph; `@openelement/ssg` is
retained as the adapter-agnostic SSG engine. Historical
details remain in git history and release evidence.

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

All 11 current workspace packages are aligned at **0.41.0-alpha.1** (`v0.41.0-alpha.1`) under
[`@openelement`](https://www.npmjs.com/org/openelement). The active execution line is
**v0.41.0-alpha.1**. ADR-0101 keeps AutoFlow3 as the single workflow/gate control plane
while reserving minor/major product decisions for human-approved ADR and
version-plan evidence.

v0.40.x removes Hub, RPC, CEM, compat-check, Lit/React/vanilla interop
adapters, and standalone runtime/style-sheet/i18n packages from the current
product line, keeps `@openelement/ssg` as the adapter-agnostic SSG engine,
keeps Vite + Nitro as the Framework base, and keeps Preact island work bounded
behind the v0.40 plan. `@preact/signals-core` is the signal engine.

The v1.0 target is a stable four-product platform with frozen Elements, UI,
Framework, and Protocols contracts.

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
