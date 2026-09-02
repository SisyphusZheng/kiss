# Hydration Surface Contract

The current line (0.41.x stable and later) exposes one supported component runtime:
`@openelement/element`. Hydration internals are not application-authoring
surface: the `open-element-render` and `open-element-hydration` implementation
modules are internal-only — their package subpath exports were removed in
alpha.19 and application or tooling code must not import them. Build-time
helpers for adapters live behind `@openelement/element/build-utils`.

## Supported imports

| Use case                                          | Import                             |
| ------------------------------------------------- | ---------------------------------- |
| Components, JSX, signals, DSD and hydration       | `@openelement/element`             |
| Build adapters (SSG, island transform, deploy)    | `@openelement/element/build-utils` |
| Pages, routes, loaders, actions and SPA bootstrap | `@openelement/app`                 |
| Vite, content, SSG and Nitro build integration    | `@openelement/adapter-vite`        |

`OpenElement` detects a pre-existing Declarative Shadow DOM root and the
compiled claim artifact takes over the existing DOM in place. When no
server-rendered root exists, the same authoring contract renders through the
client DOM path. Authors do not select separate
static, hydrate, or CSR implementation packages.

## Boundary rules

- Declarative Shadow DOM is the static-first default.
- Client JavaScript is emitted only for declared islands.
- Part/Region claim, event binding and DOM rendering are internal Element
  implementation details of the compiled pipeline.
- Starter, docs, dogfood and application code may import only supported product
  entries.
- Third-party custom elements are hydrated only according to validated package
  or Custom Elements Manifest metadata.
- `render()` (and nested component branches reachable from it) must be a pure
  function of declared props, attributes, and declared signals — no
  `Date.now()`/`Math.random()`/async-init state in the render path
  (ADR-0125). The SSR and claim passes each construct their own
  component instances; the DSD DOM serializes the SSR result, so render
  impurity surfaces as a structured claim mismatch
  (`PartProgramClaimError`), attributed to the exact owning root or Region.

## Island scheduling events

`open:ready` fires once per non-empty strategy bucket when the generated
island scheduler starts loading that bucket's islands — consistently for
`load`, `only`, `idle`, and `visible` strategies (#605, alpha.13). A
morph-replaced island is a new element and receives a fresh observer, so
`open:ready` can fire again for the same strategy after an enhanced update
(#562).

## Known limitations

- Islands located outside the project root are emitted through the Vite
  `/@fs/` absolute-path specifier convention. That branch is covered by unit
  tests (`module-specifier.test.ts`) but has not been verified on a real
  Windows build; the regular root-relative path is exercised on every change.
- `reflect` attribute mirroring normalizes values at the boundary: `NaN`
  becomes `0`, `-0` becomes `0`, objects are mirrored as `String(value)`, a
  failed `Number` parse falls back to `0`, and `removeAttribute` restores the
  declared default, which is then re-mirrored to the attribute.
