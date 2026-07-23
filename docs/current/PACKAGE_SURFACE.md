# Package Surface Inventory

This is the v0.41 alpha five-package product truth. ADR-0113 authorizes the
breaking collapse from the earlier implementation graph.

<!-- 5-package -->

```text
OpenElement = Web Components-native, static-first application framework
authoring modes = Basic Element standalone + full application
```

## Current five-package surface

| Package                     | Responsibility                                       | Supported public interface                            |
| --------------------------- | ---------------------------------------------------- | ----------------------------------------------------- |
| `@openelement/element`      | Custom Elements, JSX, DSD, hydration and signals     | root, `jsx-runtime`, `jsx-dev-runtime`, `build-utils` |
| `@openelement/app`          | Pages, routing, islands and request/render semantics | root, `hono`, `model`, `spa`, `preact`                |
| `@openelement/adapter-vite` | Vite, content, SSG and Nitro build implementation    | root, `nitro-mount`, `cli/build`, `sitemap`           |
| `@openelement/create`       | Installed starter and coherent version entry         | CLI binary (root)                                     |
| `@openelement/ui`           | Optional, proven general-purpose primitives          | root and retained primitive subpaths                  |

Application authors should normally learn `element`, `app`, `adapter-vite`,
and `create`; `ui` is optional.

The Element/App root surface exposes one functional element authoring helper:
`defineElement`. The alpha-only `defineLayout` alias was removed in alpha.13;
layouts use `defineElement` with the same definition object.

## Subpath inventory

The machine-readable map below is compared against each package's `exports`
field by `deno task package-surface:check`; any drift fails the gate.
"Internal but importable" subpaths stay reachable for build adapters,
generated code and optional integrations, but they carry no compatibility
promise and are not application-authoring surface.

<!-- package-surface-map
{
  "@openelement/element": {
    "supported": [".", "jsx-runtime", "jsx-dev-runtime", "build-utils"],
    "internal": ["open-element-render", "open-element-hydration"]
  },
  "@openelement/app": {
    "supported": [".", "hono", "model", "spa", "preact"],
    "internal": ["i18n"]
  },
  "@openelement/adapter-vite": {
    "supported": [".", "nitro-mount", "cli/build", "sitemap"],
    "internal": ["app-vite", "build-context", "head-injection", "i18n-plugin", "plugin", "generated-data-resolver", "plugin-mdx", "route-manifest", "cli/build-client", "cli/build-ssg"]
  },
  "@openelement/create": {
    "supported": ["."],
    "internal": []
  },
  "@openelement/ui": {
    "supported": [".", "open-badge", "open-button", "open-callout", "open-card", "open-code-block", "open-dialog", "open-dropdown", "open-input", "open-props-tokens", "open-tabs", "open-theme-toggle"],
    "internal": ["open-props-tokens.js"]
  }
}
-->

- `@openelement/element/build-utils` (alpha.17): build-time helpers
  (`transformIslandSource`, `createIsrCacheKey`, `formatJson`,
  `pathToTagName`, `normalizeSeparators`, `SsrRenderError`,
  `createRuntimeAdapter` and the runtime handler types) for build adapters.
  They were removed from the element root export; application code must not
  import them.
- `@openelement/element/open-element-render` and
  `@openelement/element/open-element-hydration` are hydration implementation
  modules (see `HYDRATION_CONTRACT.md`), kept importable for build tooling
  and Deno type generation.
- `@openelement/app/i18n` is the optional locale-expansion integration point.
- App's router implementation (`internal/router`) is not exported; the router
  types (`RouteConfig`, `RouterInstance`, `RouterMode`) were removed from the
  app root export in alpha.17 — SPA consumers derive them from
  `SpaAppInstance` / `SpaAppOptions`.
- `@openelement/adapter-vite` internal subpaths (`app-vite`, `build-context`,
  `head-injection`, `i18n-plugin`, `plugin`, `generated-data-resolver`,
  `plugin-mdx`, `route-manifest`, `cli/build-client`, `cli/build-ssg`) serve
  the build pipeline and generated code; they may be pruned at the v0.41
  freeze.
- `@openelement/ui` supported subpaths: `open-badge`, `open-button`,
  `open-callout`, `open-card`, `open-code-block`, `open-dialog`,
  `open-dropdown`, `open-input`, `open-props-tokens`, `open-tabs`,
  `open-theme-toggle`.
- `@openelement/ui/open-props-tokens.js` is a resolver-compatibility alias of
  `open-props-tokens`.

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

The package export map, generated resolver table and the subpath inventory
above are checked together by `deno task package-surface:check`. Historical
ADR and release evidence retain their original package names; they are not
current usage documentation.
