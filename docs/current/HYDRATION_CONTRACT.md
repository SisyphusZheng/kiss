# Hydration Surface Contract

v0.41 alpha.6 treats `@openelement/core/hydrate` as a low-level hydration
building-block subpath. It is not a complete independent hydration runtime for
arbitrary third-party frameworks.

## Which Import To Use

| Use case                                      | Import                      |
| --------------------------------------------- | --------------------------- |
| App routes, pages, islands, and SPA bootstrap | `@openelement/app`          |
| Basic Element component authoring             | `@openelement/element`      |
| Static SSR/DSD rendering only                 | `@openelement/core/static`  |
| DSD marker, event, and binding hydration      | `@openelement/core/hydrate` |
| Full client-side DOM rendering fallback       | `@openelement/core/csr`     |

## `@openelement/core/hydrate`

The hydrate subpath provides:

- the static SSR/DSD render surface;
- `HydrationScope`;
- binding descriptor activation helpers;
- marker-based event hydration helpers;
- DSD event/root hydration helpers;
- `hydrateOpenElement()` and `disposeOpenElement()` client runtime hooks.

It deliberately does not present itself as a full application, router, or
third-party framework hydration API. Use `@openelement/app` for framework
authoring and `@openelement/element` for Basic Element authoring.

## `@openelement/core/csr`

The CSR subpath includes the static surface plus full DOM rendering helpers such
as `renderToDom()`, `applyProps()`, and `collectPropBindings()`. Import it when a
client-only island or fallback needs DOM rendering primitives directly.

## Boundary Rule

`core/hydrate` may be used by higher-level packages, but public docs should not
describe it as the default user-facing hydration entry. The default authoring
paths remain `@openelement/app` and `@openelement/element`.
