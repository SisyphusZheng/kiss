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

| Path              | Description                                                  |
| ----------------- | ------------------------------------------------------------ |
| `.`               | Public signals API (signal, computed, effect)                |
| `./framework`     | Framework-level integration (setSignalEngine, engine access) |
| `./preact-engine` | @preact/signals-core engine factory (createPreactEngine)     |

## Features

- Fine-grained reactivity with automatic dependency tracking.
- Computed signals with lazy evaluation.
- Effect system for side effects with cleanup.
- No framework lock-in — works with any Web Component.

## License

MIT
