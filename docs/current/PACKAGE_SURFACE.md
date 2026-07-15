# Package Surface Inventory

This is the v0.41 beta five-package product truth. ADR-0113 authorizes the
breaking collapse from the alpha implementation graph.

<!-- 5-package -->

```text
OpenElement = Web Components-native, static-first application framework
authoring modes = Basic Element standalone + full application
```

## Current five-package surface

| Package                     | Responsibility                                       | Supported public interface             |
| --------------------------- | ---------------------------------------------------- | -------------------------------------- |
| `@openelement/element`      | Custom Elements, JSX, DSD, hydration and signals     | root, `jsx-runtime`, `jsx-dev-runtime` |
| `@openelement/app`          | Pages, routing, islands and request/render semantics | root plus documented app modes         |
| `@openelement/adapter-vite` | Vite, content, SSG and Nitro build implementation    | root, `nitro-mount`, `cli/build`       |
| `@openelement/create`       | Installed starter and coherent version entry         | CLI binary                             |
| `@openelement/ui`           | Optional, proven general-purpose primitives          | root and retained primitive subpaths   |

Application authors should normally learn `element`, `app`, `adapter-vite`,
and `create`; `ui` is optional.

The Element/App root surface exposes one functional element authoring helper:
`defineElement`. The alpha-only `defineLayout` alias was removed in alpha.13;
layouts use `defineElement` with the same definition object.

## Removed from current graph

The following alpha implementation packages are absorbed and are not supported
consumer imports: `@openelement/core`, `@openelement/signal`,
`@openelement/router`, `@openelement/protocol`, `@openelement/content`, and
`@openelement/ssg`.

Earlier removed product experiments and adapters remain historical only:
`@openelement/i18n`, `@openelement/rpc`, `@openelement/hub`, `@openelement/cem`,
`@openelement/compat-check`, `@openelement/adapter-lit`,
`@openelement/adapter-react`, `@openelement/adapter-vanilla`,
`@openelement/runtime`, and `@openelement/style-sheet`.

## Ownership and runtime rules

- Element owns the browser/runtime implementation and runtime contracts.
- `@preact/signals-core` is Element's internal signal engine, not a consumer
  OpenElement package surface.
- App owns routing and application semantics; its router is internal.
- Adapter Vite owns content, static generation, deployment and build contracts.
- Create templates and current docs may import only retained product packages.
- Runtime-free packages (`element`, `app`, `ui`) contain no Deno or Node host API
  in their public execution paths.
- Build packages (`adapter-vite`, `create`) may use host APIs behind their public
  build interfaces.
- Alpha internal packages and subpaths have no compatibility promise.

The package export map and generated resolver table are checked together by
`deno task package-surface:check`. Historical ADR and release evidence retain
their original package names; they are not current usage documentation.
