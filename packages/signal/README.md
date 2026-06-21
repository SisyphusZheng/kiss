# @openelement/signal

Reactive signals system for openElement, built on @preact/signals-core.

> v0.40.0: @preact/signals-core is the default engine. alien-signals remains
> available as an optional engine through `@openelement/signal/alien-engine`.

`@openelement/signal` provides the reactive primitive layer used by the
openElement rendering pipeline and island hydration system. It wraps
[@preact/signals-core](https://github.com/preactjs/signals) with
openElement-specific framework integration.

The engine can be swapped at runtime using `setSignalEngine()`.

## Install

```bash
npm install @openelement/signal
```

## Exports

| Path              | Description                                                      |
| ----------------- | ---------------------------------------------------------------- |
| `.`               | Public signals API (signal, computed, effect)                    |
| `./framework`     | Framework-level integration (setSignalEngine, engine access)     |
| `./alien-engine`  | alien-signals engine (optional — effectScope, createAlienEngine) |
| `./preact-engine` | @preact/signals-core engine factory (createPreactEngine)         |

## Features

- Fine-grained reactivity with automatic dependency tracking.
- Computed signals with lazy evaluation.
- Effect system for side effects with cleanup.
- Runtime engine switching via `setSignalEngine()`.
- No framework lock-in — works with any Web Component.

## Engine Switching

By default, `@openelement/signal` uses `@preact/signals-core`. To switch to
alien-signals at runtime:

```ts
import { setSignalEngine } from '@openelement/signal';
import { createAlienEngine } from '@openelement/signal/alien-engine';

setSignalEngine(createAlienEngine({ signal, computed, effect }));
```

## License

MIT
