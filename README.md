# openElement

English | [Simplified Chinese](./README.zh.md)

**A Web Components-native, static-first application framework.** Custom
Elements are the durable application contract; JSX and Basic Element are the
authoring layer; Declarative Shadow DOM is the default server representation;
interactive regions upgrade selectively.

Published package line: `0.41.0-alpha.17` (`v0.41.0-alpha.17`). This release
keeps the project in alpha while the five-package product and external adoption
evidence continue to mature; the abandoned beta naming is not an active line.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Deno](https://img.shields.io/badge/Deno-2.8%2B-000000)](https://deno.com/)
[![npm](https://img.shields.io/badge/npm-@openelement%2Felement-red)](https://www.npmjs.com/package/@openelement/element)
[![CI](https://github.com/open-element/openelement/actions/workflows/autoflow-ci.yml/badge.svg)](https://github.com/open-element/openelement/actions/workflows/autoflow-ci.yml)

## Current product

```text
OpenElement = Web Components-native fullstack application framework
current proven scope = static-first applications with fullstack output paths
official build path = Vite + Nitro
```

The current consumer graph has five packages:

| Package                     | Role                                                |
| --------------------------- | --------------------------------------------------- |
| `@openelement/element`      | Custom Elements, JSX, DSD, hydration and signals    |
| `@openelement/app`          | Pages, routes, islands and request/render semantics |
| `@openelement/adapter-vite` | Vite, content, static builds and Nitro output       |
| `@openelement/create`       | Installed starter and zero-context entrypoint       |
| `@openelement/ui`           | Optional, proven general-purpose primitives         |

The former `core`, `signal`, `router`, `protocol`, `content` and `ssg` packages
are implementation history, not supported consumer imports.

## Why openElement

Use OpenElement when a standard Custom Element should remain the same component
contract in a standalone library and in a complete application. It combines
native element authoring with routing, static generation, DSD, selective
upgrades and deployable output without making a framework-specific virtual DOM
the enduring UI model.

The strategic target is WC fullstack leadership, earned through WC SSR
compatibility evidence, third-party element interop, portable deployments and
external adoption. It is not presented as an already-achieved market claim.

## Current release state

The five-package convergence is published as `0.41.0-alpha.16`. npm beta.1
through beta.3 remain withdrawn partial artifacts and are not compatibility
baselines. External adopter pilot #390 remains the primary repository-external
condition before the project can make a stability commitment. Alpha.17 is the
active audit-remediation line (see
[ADR-0116](./docs/adr/ADR-0116-audit-driven-alpha16-correctness-reset.md)).

Stable `0.41.0` is released only when alpha releases need no more architecture,
public-interface or adoption work. Request-time data, forms, sessions and cache
remain future product work, so the current promise is static-first applications
with fullstack output paths—not broad fullstack parity.

The `1.0.0` path is a stable five-package product after the application loop, WC SSR,
production runtime and external-adoption evidence are complete.

## Start

```sh
deno run -A npm:@openelement/create my-app
cd my-app
deno task dev
```

The generated application exposes `dev`, `check`, `test`, `build` and `preview`.

## Documentation

| Section        | Link                                                                                           |
| -------------- | ---------------------------------------------------------------------------------------------- |
| Guide          | [openelement.org/guide/getting-started](https://openelement.org/guide/getting-started)         |
| API reference  | [openelement.org/apilist](https://openelement.org/apilist)                                     |
| Architecture   | [openelement.org/architecture/architecture](https://openelement.org/architecture/architecture) |
| Roadmap        | [docs/roadmap/ROADMAP.md](./docs/roadmap/ROADMAP.md)                                           |
| Current status | [docs/status/STATUS.md](./docs/status/STATUS.md)                                               |

Mandatory project workflow:
[`docs/governance/PROJECT_WORKFLOW.md`](./docs/governance/PROJECT_WORKFLOW.md).

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Architecture decisions live in
[docs/adr/](./docs/adr/); historical release and audit records remain available
as evidence, not current product documentation.

## License

MIT
