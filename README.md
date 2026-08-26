# openElement

English | [Simplified Chinese](./README.zh.md)

**OpenElement is the Web Components-native, static-first application
framework for delivering DSD-first applications with a standard Custom
Element contract.** Custom Elements are the durable application contract;
JSX and Basic Element are the authoring layer; Declarative Shadow DOM is the
default server representation; interactive regions upgrade selectively.

Source package line: `0.43.3` (`v0.43.3`) — the current
five-package source line; the request-time Application Loop froze under
ADR-0122 on top of ADR-0119's untouched static freeze.
npm registry line: `v0.43.3` — the published five-package release
(dist-tag `latest`). During alpha trains the registry line may lag the
source line by one alpha; at stable cuts they are equal.

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

| Package                     | Role                                                                           |
| --------------------------- | ------------------------------------------------------------------------------ |
| `@openelement/element`      | JSX, Custom Elements, DSD, hydration, signals and component runtime contracts  |
| `@openelement/app`          | Pages, routes, loaders, actions, islands and normalized request semantics      |
| `@openelement/adapter-vite` | Vite, content, SSG, generated data, Hono and Nitro build/deploy implementation |
| `@openelement/create`       | Version-coherent starter generation and consumer lifecycle                     |
| `@openelement/ui`           | Optional, reusable and dogfood-proven Web Component primitives                 |

(Role wording follows `docs/current/STACK_CONTRACT.md`, the source of truth.)

The former `core`, `signal`, `router`, `protocol`, `content` and `ssg` packages
are implementation history, not supported consumer imports.

## Why openElement

Use OpenElement when a standard Custom Element should remain the same component
contract in a standalone library and in a complete application. It combines
native element authoring with routing, static generation, DSD, selective
upgrades and deployable output without making a framework-specific virtual DOM
the enduring UI model.

The strategic target is WC fullstack leadership, earned through
[WC SSR compatibility evidence](./docs/evidence/third-party-wc-ssr-corpus.json),
third-party element interop, portable deployments and
external adoption. It is not presented as an already-achieved market claim.

## The fullstack composition path

The official fullstack delivery path is OpenElement × Supabase × Cloudflare,
with explicit ownership boundaries: OpenElement owns the application UX;
Supabase owns data, Auth, RLS, Storage and Realtime; Cloudflare owns edge
delivery, security, cache and async execution. Supabase and Cloudflare are
composed providers, not built-in framework features.

Evidence: the [Supabase recipe](./docs/integrations/supabase.md), the
verified [reference starter](./examples/supabase-cloudflare-starter/), the
[tier-1 boundary gate](./tools/check-fullstack-boundary.ts), the
[real-project qualification workflow](./.github/workflows/supabase-project-smoke.yml)
and the
[real Workers deploy smoke](./.github/workflows/fullstack-deploy-smoke.yml)
(green run
[31925944647](https://github.com/open-element/openelement/actions/runs/31925944647)),
built on the
[ADR-0129](./docs/adr/ADR-0129-response-header-channel.md) response-header
channel. Delivered scope is the 0.43 line together with Universal WC SSR;
framework-owned production-runtime recovery and cache semantics remain
unfrozen and unscheduled under ADR-0140.

## Current release state

The five-package convergence is published as stable `0.43.3`: the patch that
hydrates renderer-owned light DOM in place across SSR upgrade (ADR-0142) and
closes the robustness adversarial audit with committed per-case evidence,
over the cumulative `0.43.2`/`0.43.1` maintenance baseline
for Universal WC SSR under ADR-0135, on top of the ADR-0122 application loop
and untouched ADR-0119 static freeze. npm beta.1
through beta.3 remain withdrawn partial artifacts and
are not compatibility baselines. The third audit sweep completed in alpha.19 (see
[ADR-0118](./docs/adr/ADR-0118-third-audit-round-alpha19-cleanup-sweep.md)),
and the #390 pilot was retired by maintainer decision after zero recruitment
(see [ADR-0119](./docs/adr/ADR-0119-stable-0-41-0-scoped-interface-freeze.md)).

`0.42 = WC light fullstack`. The `0.42.0` stable line ships the request-time
Application Loop: dynamic loader/action routes, no-JS + enhanced forms,
`build → start`, fail-closed static prerender and a default same-origin CSRF
check on generated action POSTs. Login apps are supported via the better-auth
recipe on Web-standard `Request` headers.

The historical 0.42 freeze explicitly excluded framework session/flash,
cache/ISR, streaming SSR, performance SLOs, production-runtime recovery and
auth packages. The third-party WC SSR corpus was subsequently delivered in
0.43. Framework-owned recovery and cache semantics remain outside the current
contract and have no assigned version; adding them requires evidence and an
approved ADR. The current promise is static-first applications with fullstack
output paths—not broad fullstack parity.

The `1.0.0` path remains unscheduled. It requires a maintainer-approved ADR,
real-product compatibility evidence and external adoption before the
five-package surface can receive a long-term compatibility commitment.

## Start

```sh
deno run -A --minimum-dependency-age 0 npm:@openelement/create my-app
cd my-app
deno task dev
```

The default dist-tag is the stable 0.43 line, and
`--minimum-dependency-age 0` is needed because Deno's default
minimumDependencyAge (~24h) refuses packages published within the last day.

The generated application exposes `dev`, `check`, `test`, `build`, `start` and `preview`.

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

## Brand

The canonical compact mark is the dark `<open/>` SVG in
[`www/public/favicon.svg`](./www/public/favicon.svg)
([`open-favicon-inverted.svg`](./www/public/assets/open-favicon-inverted.svg)
is the maintained light-surface variant). Brand
SVGs are distributed under the repository MIT license; forks may reuse them
with attribution but should not imply endorsement.

## License

MIT
