# ADR-0113: Beta Four Product Boundary

## Status

Accepted for `0.41.0-beta.4` implementation.

## Context

The alpha line exposes eleven packages and over one hundred public subpaths.
Most are implementation seams rather than independently adopted products.
They make a Basic Element author learn renderer, signal, protocol and router
details, while an app author must understand build-phase order and package
aliases. The previous beta.1 through beta.3 npm publishes are immutable,
incomplete 8-of-11 artifacts and must not become a compatibility baseline.

## Decision

The beta.4 product graph is five consumer packages:

1. `@openelement/element` owns custom-element, JSX, DSD, hydration and signal
   authoring. `@openelement/element/jsx-runtime` and
   `@openelement/element/jsx-dev-runtime` are the supported transform entries.
2. `@openelement/app` owns app descriptors, pages, routes, request and render
   semantics.
3. `@openelement/adapter-vite` owns the Vite/content/static-build/Nitro
   implementation and exposes one `buildApp()`-style build boundary.
4. `@openelement/create` is the zero-context consumer entrypoint and embeds its
   own published version so a packed CLI cannot consult a workspace manifest.
5. `@openelement/ui` is optional and retains only primitives demonstrated by a
   non-site consumer.

`core`, `signal`, `router`, `protocol`, `content`, and `ssg` are migration
sources, not beta public products. Their implementation may remain temporarily
behind the five owners while imports and callers are migrated. A separate
package may survive only through a new ADR with independent-consumer, runtime
isolation, dependency-cycle, artifact-size, or two-adapter evidence.

The starter may name only `element`, `app`, `adapter-vite`, and its direct tool
dependencies. Internal implementation aliases are permitted only in repository
test harnesses and must never appear in generated apps, docs, or dogfood.

## Consequences

- Alpha internal subpaths have no compatibility promise.
- JSX moves from `@openelement/core` to `@openelement/element`.
- Legacy VNode SPA paths, router hooks, root Nitro compatibility exports and
  unused UI exports are removed rather than wrapped.
- A release is coherent only when npm, tag, GitHub prerelease, provenance,
  docs, and final evidence describe the same package graph. beta.1–beta.3 are
  explicitly withdrawn historical artifacts; beta.4 is the first candidate.
- #390 remains an external adopter gate: local and packed smoke tests are
  necessary evidence, not a substitute for an outside maintainer's install,
  build and deploy report.
