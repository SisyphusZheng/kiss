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
import { useLoaderData } from '@openelement/app';

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

## `@openelement/adapter-vite`

```ts
import { openElement } from '@openelement/adapter-vite';
```

`openElement()` configures Vite, route scanning, SSG, islands, AppShell,
content, and i18n.

## Product Packages

- `@openelement/element`: JSX, Custom Elements, DSD, hydration, signals, and
  stylesheet helpers.
- `@openelement/app`: pages, routes, loaders, actions, and islands.
- `@openelement/adapter-vite`: Vite, content, SSG, and Nitro integration.
- `@openelement/create`: starter CLI.
- `@openelement/ui`: optional reusable primitives.
