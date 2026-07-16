# Hydration Surface Contract

The v0.41 alpha line exposes one supported component runtime:
`@openelement/element`. Hydration internals are deliberately not public
subpaths.

## Supported imports

| Use case                                          | Import                      |
| ------------------------------------------------- | --------------------------- |
| Components, JSX, signals, DSD and hydration       | `@openelement/element`      |
| Pages, routes, loaders, actions and SPA bootstrap | `@openelement/app`          |
| Vite, content, SSG and Nitro build integration    | `@openelement/adapter-vite` |

`OpenElement` detects a pre-existing Declarative Shadow DOM root and activates
its markers in place. When no server-rendered root exists, the same authoring
contract renders through the client DOM path. Authors do not select separate
static, hydrate, or CSR implementation packages.

## Boundary rules

- Declarative Shadow DOM is the static-first default.
- Client JavaScript is emitted only for declared islands.
- Marker activation, event hydration, binding scopes and DOM rendering are
  internal Element implementation details.
- Starter, docs, dogfood and application code may import only supported product
  entries.
- Third-party custom elements are hydrated only according to validated package
  or Custom Elements Manifest metadata.
