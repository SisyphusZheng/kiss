# @openelement/signal

Reactive signals system for openElement, built on @preact/signals-core.

`@openelement/signal` provides the reactive primitive layer used by the
openElement rendering pipeline and island hydration system. It wraps
[@preact/signals-core](https://github.com/preactjs/signals) with
openElement-specific framework integration.

## Install

```bash
npm install @openelement/signal
```

## Exports

| Path          | Description                                          |
| ------------- | ---------------------------------------------------- |
| `.`           | Public signals API (signal, computed, effect)        |
| `./framework` | Compatibility entry point for the public signals API |

## Features

- Fine-grained reactivity with automatic dependency tracking.
- Computed signals with lazy evaluation.
- Effect system for side effects with cleanup.
- Works with any Web Component; `@preact/signals-core` is an implementation
  detail and is not mutable at runtime.

## License

MIT
