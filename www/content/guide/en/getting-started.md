---
title: 'Getting Started'
section: 'Guide'
label: 'Getting Started'
order: 1
---

# Getting Started

OpenElement is a Web Components-native, static-first application framework.
Standard Custom Elements are the component contract; JSX and Basic Element are
the authoring layer:

```text
OpenElement = Web Components-native fullstack application framework
current proven scope = static-first applications with fullstack output paths
```

Pages are written as JSX. The framework owns pages, routes, islands and
rendering semantics; Vite and Nitro provide the official build and output path.
Basic Element is the native custom-element authoring layer. Shadow/DSD is the
default render mode, and interactive parts are upgraded selectively. Dogfood
apps validate the framework; they do not define new product lines.

## Create a Project

```bash
deno run -A npm:@openelement/create my-app
cd my-app
deno task dev
```

## Write a Page

```tsx
import { definePage } from '@openelement/app';

export default definePage({
  route: { path: '/' },
  head: {
    title: 'Home',
    description: 'My openElement app',
  },
  renderIntent: {
    mode: 'static',
    streaming: 'auto',
    revalidate: false,
  },
  render() {
    return <main>Hello openElement</main>;
  },
});
```

`definePage()` uses one canonical object descriptor. `route` is intent metadata;
the file scanner still owns route matching.

## Add an Island

```tsx
import { defineIsland, defineIslandConfig } from '@openelement/app';
import { signal } from '@openelement/element';

export const openElement = defineIslandConfig({
  hydrate: 'idle',
  dsd: true,
  ssr: true,
});

const count = signal(0);

export default defineIsland(
  'my-counter',
  () => <button onClick={() => count.value++}>Count: {count.value}</button>,
  { hydrate: openElement.hydrate, dsd: openElement.dsd, ssr: openElement.ssr },
);
```

## Configure Vite

```ts
import { defineConfig } from 'vite';
import { openElement } from '@openelement/adapter-vite';

export default defineConfig({
  plugins: [openElement()],
});
```

The root `@openelement/app` package is for authoring. Build configuration lives
under `@openelement/adapter-vite`.
