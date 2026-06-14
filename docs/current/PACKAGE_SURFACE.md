# Package Surface Inventory

This is the v0.40.3 11-package product-line truth table.

<!-- 11-package -->

```text
openElement = Elements + UI + Framework + Protocols
```

ADR-0101 approves the product-line reset and AutoFlow3 governance boundary.
ADR-0105 approves the v0.40.3 breaking cleanup train and the 14-to-11 package
graph collapse.

## Current 11-package surface

| Package                     | Class          | v0.40.3 decision                                                                             |
| --------------------------- | -------------- | -------------------------------------------------------------------------------------------- |
| `@openelement/app`          | product-facing | Framework authoring API, including optional Preact island proof under `./preact`.            |
| `@openelement/create`       | product-facing | Starter and consumer entry.                                                                  |
| `@openelement/element`      | product-facing | Canonical component-authoring facade for `OpenElement`, `StyleSheet`, islands, and signals.  |
| `@openelement/protocol`     | product-facing | Runtime-free replacement boundary. Now includes SSG engine contracts.                        |
| `@openelement/ui`           | product-facing | First-party `open-*` component library.                                                      |
| `@openelement/ssg`          | foundation     | Adapter-agnostic SSG engine (entry descriptor, render pipeline, route scanner, postprocess). |
| `@openelement/core`         | foundation     | Low-level implementation kernel, now including `StyleSheet`.                                 |
| `@openelement/router`       | foundation     | Route support behind Framework.                                                              |
| `@openelement/signal`       | foundation     | Signal implementation behind protocols; default is `@preact/signals-core`.                   |
| `@openelement/content`      | foundation     | Content support behind Framework recipes.                                                    |
| `@openelement/adapter-vite` | foundation     | Vite/Nitro build bridge; delegates SSG orchestration to `@openelement/ssg`.                  |

## Removed from current graph

v0.40.3 removes historical and collapsed packages from the current workspace and
publish order:

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
an adapter-agnostic build engine that depends only on protocol, core, router,
and content, never on Vite. `@openelement/adapter-vite` delegates SSG
orchestration to it and keeps only Vite-specific glue (generated-data-resolver,
package-resolver, CLI entry points).

The canonical authoring import is `@openelement/element`. The default signal
engine is `@preact/signals-core`; `alien-signals` remains available through
`@openelement/signal/alien-engine`.

## Governance

The v0.40.3 cleanup train is manually approved breaking work consolidated into
the v0.40.3 release, not normal AutoFlow patch automation. AutoFlow3 patch
release must refuse this train unless the release state references approval id
`ADR-0105/v0.40.x-cleanup-train`.
