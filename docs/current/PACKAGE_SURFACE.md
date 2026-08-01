# Package Surface Inventory

This is the v0.41 alpha five-package product truth. ADR-0113 authorizes the
breaking collapse from the earlier implementation graph.

<!-- 5-package -->

```text
OpenElement = Web Components-native, static-first application framework
authoring modes = Basic Element standalone + full application
```

## Current five-package surface

| Package                     | Responsibility                                       | Supported public interface                                              |
| --------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------- |
| `@openelement/element`      | Custom Elements, JSX, DSD, hydration and signals     | root, `jsx-runtime`, `jsx-dev-runtime`, `build-utils`                   |
| `@openelement/app`          | Pages, routing, islands and request/render semantics | root, `model`, `spa`, `preact`                                          |
| `@openelement/adapter-vite` | Vite, content, SSG and Nitro build implementation    | root, `nitro-mount`, `cli/build`, `cli/start`, `cli/preview`, `sitemap` |
| `@openelement/create`       | Installed starter and coherent version entry         | CLI binary (root)                                                       |
| `@openelement/ui`           | Optional, proven general-purpose primitives          | root and retained primitive subpaths                                    |

Application authors should normally learn `element`, `app`, `adapter-vite`,
and `create`; `ui` is optional.

## Vocabulary

- **Hydration** — element-level: how and when a component's client JavaScript
  is loaded (`load`, `idle`, `visible`, `only`; see `HYDRATION_CONTRACT.md`).
- **Upgrade** — island-level: the moment a server-rendered custom element is
  defined and its instance takes over the existing markup.
- **Activation** — framework takeover: marker activation, event binding and
  state restoration performed by the runtime after upgrade.

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
    "internal": []
  },
  "@openelement/app": {
    "supported": [".", "model", "spa", "preact"],
    "internal": ["i18n"]
  },
  "@openelement/adapter-vite": {
    "supported": [".", "nitro-mount", "cli/build", "cli/start", "cli/preview", "sitemap"],
    "internal": []
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
- The `open-element-render` and `open-element-hydration` modules are
  internal-only hydration implementation modules (see
  `HYDRATION_CONTRACT.md`); their subpath exports were removed in alpha.19.
  The module files remain inside the package for internal relative imports
  only.
- The branded types `SafeHtml` and `UnsafeHtml` and the internal
  `StyleSheetRule` type are no longer exported from the element root
  (alpha.18 release notes already claimed their removal; alpha.19 makes it
  true). Their declarations stay in the internal protocol files.
- The element root no longer carries `export type *` seams (alpha.19); the
  public type surface is an explicit export list in
  `packages/element/src/index.ts`.
- `@openelement/app/i18n` is the optional locale-expansion integration point.
- App's router implementation (`internal/router`) is not exported; the router
  types (`RouteConfig`, `RouterInstance`, `RouterMode`) were removed from the
  app root export in alpha.17 — SPA consumers derive them from
  `SpaAppInstance` / `SpaAppOptions`.
- `@openelement/adapter-vite` internal subpaths (`app-vite`, `build-context`,
  `head-injection`, `i18n-plugin`, `plugin`, `generated-data-resolver`,
  `plugin-mdx`, `route-manifest`, `cli/build-client`, `cli/build-ssg`) were
  pruned at the 0.41.0 freeze (ADR-0119): they had zero consumer specifiers —
  the build pipeline and generated code import only relatively or through the
  supported root, `nitro-mount`, `cli/build`, `cli/start`, `cli/preview` and
  `sitemap` subpaths. The module
  files remain inside the package for internal relative imports only.
- `@openelement/ui` supported subpaths: `open-badge`, `open-button`,
  `open-callout`, `open-card`, `open-code-block`, `open-dialog`,
  `open-dropdown`, `open-input`, `open-props-tokens`, `open-tabs`,
  `open-theme-toggle`.
- `@openelement/ui/open-props-tokens.js` is a resolver-compatibility alias of
  `open-props-tokens`.

## 0.41.0 interface freeze boundary (ADR-0119)

Frozen at 0.41.0: `defineElement`, `definePage`, `buildApp`, the five-package
graph, the supported subpaths above, and the static/SPA semantics of
`defineApp` as shipped — file routes, `tagName` route elements, island
configuration (`ssr`/`dsd`/`hydrate`), DSD output, and the SPA-mode
loader/action chain.

Explicitly not frozen: request-time data, forms, sessions and cache
semantics (0.42 WC Application Loop and 0.44 Production Runtime scope), the
`@openelement/ui` stable scope (decided at v0.46), and everything marked
internal in the map above. Post-freeze changes to the frozen surface require
a major-version ADR.

### 0.42 line additions (unfrozen until the 0.42.0 stable decision)

- `definePage({ renderIntent: { mode } })`: `'auto'`/`'static'`/`'dynamic'`
  rendering modes; `'dynamic'` routes render per request through the
  generated `dist/server/index.js` (0.42.0-alpha.1). `renderIntent.revalidate`
  declares the ISR revalidate window in seconds for static routes.
- Route-module `loader`/`action`/`actions` exports with the ADR-0120
  protocol: `fail(status, data)` 422 re-render, 303 PRG, named actions via
  `formaction='?/name'` (0.42.0-alpha.2).
- `isActionFailure(value)` type guard and the `OpenElementActionFailure<T>`
  class (app root): the structured failure carrier constructed by `fail()`
  and recognized on both the request-time and SPA action chains.
- `ActionResult` / `ACTION_FETCH_HEADER` wire types and the
  `data-open-enhance` / `data-open-preserve` / `data-open-region`
  enhancement attributes with morph-based continuity (0.42.0-alpha.3).

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
