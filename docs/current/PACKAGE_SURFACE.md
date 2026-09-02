# Package Surface Inventory

This is the current-line (0.41.x stable and later) five-package product truth. ADR-0113 authorizes the
breaking collapse from the earlier implementation graph.

<!-- 5-package -->

```text
OpenElement = Web Components-native, static-first application framework
authoring modes = Basic Element standalone + full application
```

## Current five-package surface

| Package                     | Responsibility                                                                 | Supported public interface                                        |
| --------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| `@openelement/element`      | JSX, Custom Elements, DSD, hydration, signals and component runtime contracts  | root, `jsx-runtime`, `jsx-dev-runtime`, `build-utils`, `sanitize` |
| `@openelement/app`          | Pages, routes, loaders, actions, islands and normalized request semantics      | root, `model`, `spa`, `preact`                                    |
| `@openelement/adapter-vite` | Vite, content, SSG, generated data, Hono and Nitro build/deploy implementation | root, `nitro-mount`, `cli/build`, `cli/start`, `sitemap`          |
| `@openelement/create`       | Version-coherent starter generation and consumer lifecycle                     | CLI binary (root)                                                 |
| `@openelement/ui`           | Optional, reusable and dogfood-proven Web Component primitives                 | root and retained primitive subpaths                              |

Responsibility wording follows [`STACK_CONTRACT.md`](./STACK_CONTRACT.md),
the source of truth for the five-package responsibility table.

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
layouts use `defineElement` with the same definition object. The signal
control-flow factory `For` (`<For each={items} key={...}>`, ADR-0059/
ADR-0124) is exported from the element root since 0.42.0-alpha.16 (#941);
`Show` stays internal (jsx-runtime) — open an issue if a public consumer
surface is needed. Keyed reconciliation is Solid-style: a surviving key
keeps its DOM node and its content is frozen per key (item content must be
signal-driven to update; see ADR-0124 Consequences, #915).

## Subpath inventory

The machine-readable map below is compared against each package's `exports`
field by `deno task package-surface:check`; any drift fails the gate.
"Internal but importable" subpaths stay reachable for build adapters,
generated code and optional integrations, but they carry no compatibility
promise and are not application-authoring surface.

<!-- package-surface-map
{
  "@openelement/element": {
    "supported": [".", "jsx-runtime", "jsx-dev-runtime", "build-utils", "sanitize"],
    "internal": []
  },
  "@openelement/app": {
    "supported": [".", "model", "spa", "preact"],
    "internal": ["i18n"]
  },
  "@openelement/adapter-vite": {
    "supported": [".", "nitro-mount", "cli/build", "cli/start", "sitemap"],
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
  (`transformIslandSource`, `formatJson`,
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
- v0.43.1 ownership correction (ADR-0137, #1097): adapter-specific blog,
  navigation, i18n and build-context contracts are exported by
  `@openelement/adapter-vite`, not `@openelement/element`. Migrate imports of
  `OpenElementBlogOptions`, `OpenElementNavSection`,
  `OpenElementHeaderNavLink`, `OpenElementI18nContextOptions`, and
  `OpenElementBuildContextLike` to the adapter root. Package roots route
  supported implementations through named public modules and never name an
  `internal/` module specifier.
- `@openelement/app/i18n` is the optional locale-expansion integration point.
- App's router implementation (`internal/router`) is not exported; the router
  types (`RouteConfig`, `RouterInstance`, `RouterMode`) were removed from the
  app root export in alpha.17 — SPA consumers derive the instance from
  `ReturnType<typeof defineApp>` and the options from
  `Parameters<typeof defineApp>[0]`.
- `@openelement/adapter-vite` internal subpaths (`app-vite`, `build-context`,
  `head-injection`, `i18n-plugin`, `plugin`, `generated-data-resolver`,
  `plugin-mdx`, `route-manifest`, `cli/build-client`, `cli/build-ssg`) were
  pruned at the 0.41.0 freeze (ADR-0119): they had zero consumer specifiers —
  the build pipeline and generated code import only relatively or through the
  supported root, `nitro-mount`, `cli/build`, `cli/start` and
  `sitemap` subpaths. `cli/start` carries a `--mode=start|preview` flag
  (alpha.13, ADR-0123 item 4): the former standalone `cli/preview` subpath
  merged into it as preview mode. The module
  files remain inside the package for internal relative imports only.
- The adapter root owns the content-collection authoring surface:
  `CollectionOptions`, `CollectionSchema`, `createCollectionPlugin`,
  `loadCollectionData`, and `writeCollectionDataModule`. Normal applications
  configure named collections through `openElement({ content: { collections } })`;
  `content.blog` remains the compatible blog alias and emits the unchanged
  `_generated-blog-data.ts` module contract.
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

The 0.41 freeze did not cover request-time data, forms, sessions, cache
semantics, the `@openelement/ui` stable scope, or anything marked internal in
the map above. Request-time data and form semantics were later frozen by
ADR-0122; framework session/cache capabilities remain unassigned. Any
post-freeze change to a frozen surface requires a major-version ADR.

Frozen-surface change on the alpha line (ADR-0127, #920): element's
`IslandOptions.strategy` was renamed to `hydrate` in 0.42.0-alpha.16,
matching the app-side `defineIslandConfig({ hydrate })` name; the old name
was deleted with no alias. Migration: rename the option at each
`defineIsland()` call site (`strategy` → `hydrate`).

Frozen wording narrowed on the alpha line (ADR-0128, #960): "`tagName` route
elements" now means two distinct things by route kind. On a route whose
default export is `definePage(...)`, the `tagName` export names the content
element only — the page class always registers under the route-path-derived
fallback tag (0.42.0-alpha.17). Plain element routes (no definePage) are
unaffected: their `tagName` export remains the registration tag.

### 0.42 line additions (frozen at 0.42.0 under ADR-0122)

- `definePage({ renderIntent: { mode } })`: `'static'` (default, prerendered) / `'dynamic'` (per-request; the `'auto'` alias was removed in alpha.13, #609)
  rendering modes; `'dynamic'` routes render per request through the
  generated `dist/server/index.js` (0.42.0-alpha.1). The former
  `renderIntent.revalidate` field and all ISR semantics were removed in v0.44
  (issue #1217): no ISR manifest is emitted and no route-level cache
  revalidation exists. Any future ISR capability must be re-earned from real
  evidence (#1221).
- Route-module `loader`/`action`/`actions` exports with the ADR-0120
  protocol: `fail(status, data)` 422 re-render, 303 PRG, named actions via
  `formaction='?/name'` (0.42.0-alpha.2).
- `isActionFailure(value)` type guard and the `OpenElementActionFailure<T>`
  class (app root): the structured failure carrier constructed by `fail()`
  and recognized on both the request-time and SPA action chains.
- `ActionResult` / `ACTION_FETCH_HEADER` wire types and the
  `data-open-enhance` / `data-open-preserve` / `data-open-region`
  enhancement attributes with morph-based continuity (0.42.0-alpha.3).
  Fetch-channel **error** outcomes are RFC 9457 `ProblemDetails` answered as
  `application/problem+json` (`PROBLEM_JSON_MEDIA_TYPE`) since
  0.42.0-alpha.13 (#863, ADR-0123 addendum item 13).

- alpha.13 additions (ADR-0123 train): `Middleware` /
  `composeFetchMiddleware` (element root + `./build-utils`) — the
  WinterCG-shaped `(request, next) => Response` middleware contract wired
  through `middleware.use` (#858); `cli/preview` merged into
  `cli/start --mode=preview` (#859); `PageRenderingMode` narrowed to
  `'static' | 'dynamic'` (#609).

### v0.44 experimental additions (unfrozen)

| Export (element root)                                 | Class                | Purpose                                                                                                                                                                                                                                                                                                                                 | Removal/move condition                                               |
| ----------------------------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `isDangerousKey`, `injectPropsSafe`, `DANGEROUS_KEYS` | experimental (#1214) | The one canonical prototype-pollution guard shared by page projection (SPA bootstrap, `projectPageProps`) and adapter codegen, which serializes `DANGEROUS_KEYS` into generated server runtimes at build time                                                                                                                           | May move to a dedicated security subpath at the B1.2 surface freeze  |
| `element`, `property`                                 | experimental (#1209) | Compile-time-only decorator intrinsics: the compiler admits them by binding provenance (a runtime named import from `@openelement/element`) and erases them from generated code; evaluated without the compiler (unit tests, config evaluation) they are inert no-ops, carrying no runtime semantics and acting as no second recognizer | May move to a dedicated authoring subpath at the B1.2 surface freeze |

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
  in their public execution paths (gated by `deno task deno-api:check`).
- Build packages (`adapter-vite`, `create`) run on the Deno host and may use
  host APIs behind their public build interfaces (#966: the CLI and template
  builder use `Deno.*` directly — that is in-contract; the scaffolding entry
  is `deno run`). What must stay host-agnostic is their _output_: generated
  artifacts (`dist/server`, `serve.mjs`, the client entries) run on
  Node/Deno/Bun and may use only Web/ES globals plus `node:` builtins.
- Alpha internal packages and subpaths have no compatibility promise.

The package export map, generated resolver table and the subpath inventory
above are checked together by `deno task package-surface:check`. Historical
ADR and release evidence retain their original package names; they are not
current usage documentation.
