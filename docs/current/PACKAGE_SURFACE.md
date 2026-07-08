# Package Surface Inventory

This is the v0.41.0-alpha.7 11-package product-line truth table.

<!-- 11-package -->

```text
openElement = Web Components Fullstack Framework + Basic Element
supporting packages = Protocols + UI + official stack adapters
```

ADR-0101 approves the product-line reset and AutoFlow3 governance boundary.
ADR-0105 approves the v0.40.4 breaking cleanup train and the 14-to-11 package
graph collapse.
ADR-0110 is the current public product doctrine. ADR-0111 records that
`@openelement/app` owns route/render/request/asset/island/deployment concepts
while Vite, Hono, Nitro, and Deno Desktop implement official drivers/adapters.

## Current 11-package surface

| Package                     | Class      | v0.41 decision                                                                                            |
| --------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `@openelement/app`          | product    | Web Components fullstack framework authoring API, including optional Preact island proof.                 |
| `@openelement/create`       | product    | Starter and consumer entry for the fullstack framework.                                                   |
| `@openelement/element`      | product    | Basic Element facade for `OpenElement`, `StyleSheet`, islands, and signals.                               |
| `@openelement/protocol`     | supporting | Contracts plus tiny host-API-free values and guards for renderers, routes, islands, adapters, and builds. |
| `@openelement/ui`           | supporting | Open Props-backed reference `open-*` component library and dogfood surface.                               |
| `@openelement/ssg`          | supporting | Adapter-agnostic SSG engine (entry descriptor, render pipeline, route scanner, postprocess).              |
| `@openelement/core`         | supporting | Low-level implementation kernel, now including `StyleSheet`, signal contracts, and SSG types.             |
| `@openelement/router`       | supporting | Route support behind the fullstack framework.                                                             |
| `@openelement/signal`       | supporting | Signal implementation; default is `@preact/signals-core`.                                                 |
| `@openelement/content`      | supporting | Content support behind framework recipes.                                                                 |
| `@openelement/adapter-vite` | supporting | Vite/Nitro build bridge; delegates SSG orchestration to `@openelement/ssg`.                               |

## Removed from current graph

v0.40.4 removes historical packages from the current workspace and publish order:

- `@openelement/i18n` (moved to `@openelement/app/i18n`)
- `@openelement/rpc`
- `@openelement/hub`
- `@openelement/cem`
- `@openelement/compat-check`
- `@openelement/adapter-lit`
- `@openelement/adapter-react`
- `@openelement/adapter-vanilla`
- `@openelement/runtime`
- `@openelement/style-sheet`

`StyleSheet` now lives in `@openelement/core/style-sheet` and is re-exported
from `@openelement/element`. SSG engine is extracted into `@openelement/ssg` as
an adapter-agnostic build engine that depends on core, router, and content,
never on Vite. `@openelement/adapter-vite` delegates SSG orchestration to it and
keeps only Vite-specific glue (generated-data-resolver, package-resolver, CLI
entry points).

The canonical authoring import is `@openelement/element`. The signal engine is
`@preact/signals-core`.

## Package Contracts

Each retained package has a single responsibility, a public surface for app
authors, an internal surface for sibling packages, and a runtime constraint.

| Package                     | Responsibility                                                                                                 | Public surface                                                                            | Internal surface                                                       | Runtime                                                                                    |
| --------------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `@openelement/protocol`     | Shared contracts plus tiny pure runtime values and guards.                                                     | `src/**/*.ts` re-exported at package root.                                                | Direct deep imports are allowed only inside the monorepo during alpha. | Host-API-free; no DOM, `Deno.*`, or `node:*` APIs and no side effects.                     |
| `@openelement/signal`       | Signal implementation; default is `@preact/signals-core`.                                                      | Package root.                                                                             | `signal-engine.ts` wiring.                                             | Runtime-free.                                                                              |
| `@openelement/core`         | Low-level kernel: static renderer, hydration lifecycle, StyleSheet, signal integration, SSG contracts, logger. | `src/index.ts`, `src/static.ts`, `src/hydrate.ts`, `src/style-sheet.ts`, `src/logger.ts`. | Internal SSG postprocess helpers consumed by `@openelement/ssg`.       | Runtime-free; no `Deno.*` or `node:*` APIs.                                                |
| `@openelement/element`      | Canonical authoring facade for `OpenElement`, `StyleSheet`, islands, and signals.                              | Package root.                                                                             | None.                                                                  | Runtime-free browser package; must import safely in SSR via `@openelement/core/static`.    |
| `@openelement/ui`           | First-party `open-*` component library.                                                                        | `src/index.ts`, per-component tag-name exports.                                           | `daisy-classes.ts`, `open-props-tokens.ts` shared style modules.       | Runtime-free browser package.                                                              |
| `@openelement/router`       | Route support behind the framework adapter.                                                                    | Package root, `data-context`, `i18n`, and `client-router`.                                | `internal/data-context` is alpha-internal.                             | Runtime-free.                                                                              |
| `@openelement/app`          | Framework authoring API, including request model, Hono, SPA, i18n, and optional Preact proof.                  | Package root and explicit `model`, `hono`, `spa`, `i18n`, `preact` subpaths.              | None.                                                                  | Runtime-free framework package; adapters handle build-time concerns.                       |
| `@openelement/content`      | Content support behind framework recipes (MDX/markdown parsing).                                               | `src/index.ts`.                                                                           | Direct imports by `@openelement/ssg`.                                  | Build/server glue; may use Deno/Node APIs.                                                 |
| `@openelement/ssg`          | Adapter-agnostic SSG engine: entry descriptor, render pipeline, route scanner, postprocess.                    | Package root and `drivers`.                                                               | Direct imports by `@openelement/adapter-vite`.                         | Build/server glue; may use Deno/Node APIs; no Vite dependency.                             |
| `@openelement/adapter-vite` | Vite/Nitro build bridge; delegates SSG orchestration to `@openelement/ssg`.                                    | Package root, `nitro-mount`, and CLI build entry.                                         | Other exported build/plugin subpaths are alpha-internal.               | Build/server glue; prefers Node APIs in public helpers so npm consumers can run the build. |
| `@openelement/create`       | Starter and consumer entry.                                                                                    | CLI binary, scaffold templates.                                                           | None.                                                                  | Build/server glue; may use Deno/Node APIs.                                                 |

### Boundary rules

- **Host-API-free packages** (`protocol`, `signal`, `core`, `element`, `ui`, `router`, `app`) must not use `Deno.*` or `node:*` APIs in public `src/` code. Protocol additionally permits only tiny pure runtime values and guards.
- **Build/server glue packages** (`content`, `ssg`, `adapter-vite`, `create`) may use Deno/Node APIs; Deno is the development toolchain, but published helpers that npm consumers invoke directly must not crash outside Deno.
- **Public surface** is what application authors import. **Internal surface** is what sibling packages import during the alpha line; internal subpaths may change without a deprecation period until v1.0.
- The canonical component authoring import is `@openelement/element`.
  Lower-level packages are supporting surfaces unless a public guide explicitly
  names them.

## Governance

The v0.40.4 cleanup train is manually approved breaking work consolidated into
the v0.40.4 release, not normal AutoFlow patch automation. AutoFlow3 patch
release must refuse this train unless the release state references approval id
`ADR-0105/v0.40.x-cleanup-train`.
