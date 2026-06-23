---
title: 'Getting Started'
section: 'Guide'
label: 'Getting Started'
order: 1
---

# Getting Started

openElement is a JSX-first Web Components platform:

```text
openElement = Elements + UI + Framework + Protocols
```

Pages are written as JSX. The framework can render Web Components with
shadow/DSD by default, and interactive parts are upgraded as islands.

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
