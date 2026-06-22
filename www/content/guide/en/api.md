---
title: 'API Reference'
section: 'Reference'
label: 'API'
order: 70
---

# API Reference

## `@openelement/app`

```tsx
import { defineElement, defineIsland, defineLayout, definePage } from '@openelement/app';
```

### `definePage(input)`

Declares a route component.

```tsx
import { definePage } from '@openelement/app';
import { useLoaderData } from '@openelement/router';

export const loader = async () => {
  return { message: 'Hello' };
};

export default definePage({
  head: {
    title: 'Home',
  },
  render() {
    const data = useLoaderData<{ message: string }>();
    return <main>{data.message}</main>;
  },
});
```

### `defineIsland(tagName, render, options?)`

Declares an interactive Custom Element and its hydration metadata.

```tsx
export default defineIsland('my-counter', () => <button>Count</button>, {
  hydrate: 'idle',
  dsd: true,
});
```

### `defineElement(tagName, render)`

Declares a reusable Elements-native custom element. Shadow/DSD is the default
render mode; light DOM remains explicit opt-in.

### `defineLayout(tagName, render)`

Declares a layout element. It is a semantic alias for `defineElement()`.

## `@openelement/app/vite`

```ts
import { openElement } from '@openelement/app/vite';
```

`openElement()` configures Vite, route scanning, SSG, islands, AppShell,
content, and i18n.

## Product And Runtime Packages

- `@openelement/app` and `@openelement/create`: Framework product surface.
- `@openelement/ui`: first-party UI product surface.
- `@openelement/protocol`: runtime-free Protocols product surface.
- `@openelement/element`: Elements product surface with `OpenElement`, signals,
  and stylesheet helpers.
- `@openelement/core`: renderer kernel and JSX runtime.
- `@openelement/signal`: signal primitives.
- `@openelement/core/style-sheet`: CSSStyleSheet abstraction.
