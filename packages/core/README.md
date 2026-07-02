# @openelement/core

Advanced openElement runtime kernel.

Most users should start from `@openelement/app`, `@openelement/element`, or
`@openelement/ui`. `@openelement/core` owns low-level primitives used by those
products:

- JSX and VNode runtime primitives.
- DSD rendering through `renderDsd()` and `renderDsdStream()`.
- Static props, event hydration, island metadata, and SSR context helpers.
- Unified errors, signal-like utilities, and DOM rendering helpers.
- StyleSheet (SSR-safe CSSStyleSheet abstraction).

The `OpenElement` base class is now authored from `@openelement/element`.

This package does not contain Vite, CLI, or build orchestration logic.

## Hydration Subpaths

`@openelement/core/hydrate` is a low-level building-block subpath for DSD
marker, event, binding, and `HydrationScope` hydration. It is not a complete
standalone third-party framework hydration runtime. Use:

- `@openelement/app` for routes, pages, islands, and SPA bootstrap.
- `@openelement/element` for Basic Element component authoring.
- `@openelement/core/static` for SSR/DSD rendering without DOM hydration.
- `@openelement/core/hydrate` for DSD marker/event/binding hydration helpers.
- `@openelement/core/csr` for full client-side DOM rendering primitives.

The active contract is documented in
`docs/current/HYDRATION_CONTRACT.md`.

## Install

```bash
npm install @openelement/core
```

## Low-Level Component Authoring

For component authoring with `OpenElement`, ErrorBoundary, prop system,
and defineElement helper, use `@openelement/element`:

```bash
npm install @openelement/element
```

## License

MIT
