# @openelement/element

First-class Elements authoring surface for openElement.

This package exposes `OpenElement`, the product-facing base class for native Web
Components built on openElement's existing shadow/DSD implementation. Shadow/DSD
is the default render mode; light DOM remains explicit opt-in.

Also includes:

- `ErrorBoundary` — hold render-error state reported via `catchError()` and swap in fallback UI
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

`defineLayout` was removed during the alpha public-surface freeze. Replace
`defineLayout(tagName, definition)` with the identical
`defineElement(tagName, definition)` call.

## Boundary

`@openelement/element` does not own routing, Vite, Nitro, UI components,
database, auth, cache, or the default signal engine. Those remain Framework,
UI, Protocols, or adapter concerns.

## License

MIT
