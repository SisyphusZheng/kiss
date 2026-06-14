# ADR-0105: v0.40.x Cleanup Train Exception

Date: 2026-06-14

Status: Accepted

Supersedes in part: ADR-0090, ADR-0101 package graph assumptions

## Context

ADR-0101 established AutoFlow3 as the workflow, gate, evidence, and release
state control plane. It also drew a hard boundary: AutoFlow3 cannot decide
minor/major product scope, public API, package topology, default runtime,
default signal engine, or release policy.

The v0.40 repository still carried too much historical surface after the first
cleanup pass. In particular, `@openelement/element` was still thin, while
standalone runtime/style-sheet/i18n surfaces and old interop packages blurred
the product line.

## Decision

v0.40.x is a manually approved breaking cleanup train. These patches are not
normal AutoFlow patch releases.

The approved cleanup target is an 11-package package graph:

- `@openelement/core`
- `@openelement/element`
- `@openelement/ui`
- `@openelement/app`
- `@openelement/create`
- `@openelement/protocol`
- `@openelement/adapter-vite`
- `@openelement/signal`
- `@openelement/router`
- `@openelement/content`
- `@openelement/ssg`

The following packages are removed from the current package graph:

- `@openelement/runtime`
- `@openelement/style-sheet`
- `@openelement/i18n`

`@openelement/element` uses the singular public package name and becomes the
canonical component-authoring facade. It re-exports `OpenElement`,
`StyleSheet`, signals, island helpers, JSX runtime helpers, and key authoring
types.

`StyleSheet` moves to `@openelement/core/style-sheet` and is re-exported from
`@openelement/element`.

`@openelement/ssg` is retained as the adapter-agnostic SSG engine. It owns route
scanning, entry descriptors, rendering, and postprocess behavior. The
`@openelement/adapter-vite` package keeps Vite-specific plugin and CLI glue and
delegates SSG orchestration to `@openelement/ssg`.

The standalone `@openelement/i18n` package is removed from the current graph.
Current i18n support lives under `@openelement/app/i18n`.

Preact islands are supported through optional `@openelement/app/preact`. Fresh
is a comparison target for Preact island semantics, not an adopted router or
server runtime.

ADR-0104 and the v0.40.0 implementation make `@preact/signals-core` the default
signal engine. `alien-signals` remains available as an optional engine through
`@openelement/signal/alien-engine`.

## AutoFlow Boundary

AutoFlow3 patch automation must refuse v0.40.x cleanup-train releases unless
the release state or command references this approved plan id:

```text
ADR-0105/v0.40.x-cleanup-train
```

AutoFlow3 may run gates, produce evidence, classify changes, and execute an
approved release flow. It may not infer that package removals, public API
changes, or default engine changes are ordinary patch work.

## Consequences

- The publish order shrinks to 11 packages.
- Active code must not import removed packages.
- Root generated artifacts and stale root benchmarks are rejected by repo
  hygiene checks.
- `autoflow:push` must include `arch:check` for package, tool, hook, workflow,
  and root config changes.
- `core` and `element` must not require `@preact/signals-core`.
- Historical ADR and release evidence may still mention removed packages as
  history; active truth lives in current docs, ADRs, roadmap/status, checks, and
  release evidence.
