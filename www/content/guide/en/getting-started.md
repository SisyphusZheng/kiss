---
title: 'Getting Started'
section: 'Guide'
label: 'Getting Started'
order: 1
---

# Getting Started

openElement is a Web Components-native fullstack framework with a JSX-first
Basic Element authoring layer:

```text
openElement = Web Components Fullstack Framework + Basic Element
supporting packages = Protocols + UI + official stack adapters
```

Pages are written as JSX. The framework owns routes, layouts, islands, API
routes, deployment, and desktop targets. Basic Element is the native
custom-element authoring layer. Shadow/DSD is the default render mode, and
interactive parts are upgraded as islands. Dogfood apps validate the framework;
they do not define new product lines.

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
import { openElement } from '@openelement/app/vite';

export default defineConfig({
  plugins: [openElement()],
});
```

The root `@openelement/app` package is for authoring. Build configuration lives
under `@openelement/app/vite`.
