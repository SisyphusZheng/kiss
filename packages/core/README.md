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
