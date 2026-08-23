# @openelement/element

First-class Elements authoring surface for openElement.

This package exposes `OpenElement`, the product-facing base class for native Web
Components built on openElement's existing shadow/DSD implementation. Shadow/DSD
is the default render mode; light DOM remains explicit opt-in.

Also includes:

- `ErrorBoundary` — error boundary (`static isErrorBoundary = true`) that automatically captures subtree render failures: on SSR the boundary renders its `onError()` fallback in place of the failed subtree, and on the client a failing descendant's render/update bubbles to the nearest boundary's `catchError()`. A subclass `render()` branches on `hasError` to swap in the `onError()` fallback UI; `retry()` re-renders both the boundary and the captured source element, `reset()` clears the state entirely. Without a boundary, SSR keeps the bare-tag degradation and CSR keeps the per-element `onRenderError()` fallback
- `defineElement` — functional component-style authoring for elements and layouts
- Prop system: `PropDecl`, `PropsFrom`, `PropType`
- Full re-export of JSX, VNode, context, signals, StyleSheet, and island utilities

## Install

```bash
npm install @openelement/element
```

## Usage

```tsx
import { OpenElement } from '@openelement/element';
import type { VNode } from '@openelement/element';

class MyCard extends OpenElement {
  render(): VNode {
    return (
      <article>
        <slot />
      </article>
    );
  }
}
```

## Functional Component Style

```tsx
import { defineElement } from '@openelement/element';

defineElement('my-card', ({ title }) => (
  <article>
    <h2>{title}</h2>
    <slot />
  </article>
));
```

Static prop getters intentionally return a `Signal`, so read and write through
`.value` (for example, `this.count.value`). Removing a reflected attribute
restores the default declared in `static props`.

For instance signals used in JSX, call `registerSignal(name, signal)` once in
the component constructor. CSR and SSR then derive the same `data-signal`
hydration markers automatically for signal text and attribute bindings; do not
hand-write those internal marker attributes. Only signals created by
openElement's `signal()`/`computed()` engine satisfy the reactive signal
contract—plain `{ value, subscribe }` lookalikes are treated as ordinary data.

`defineLayout` was removed during the alpha public-surface freeze. Replace
`defineLayout(tagName, definition)` with the identical
`defineElement(tagName, definition)` call.

## Boundary

`@openelement/element` does not own routing, Vite, Nitro, UI components,
database, auth, cache, or the default signal engine. Those remain Framework,
UI, Protocols, or adapter concerns.

## License

MIT
