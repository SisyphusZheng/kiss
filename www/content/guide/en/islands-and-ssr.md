---
title: 'Islands and SSR'
section: 'Guide'
label: 'Islands and SSR'
order: 4
---

# Islands and SSR

openElement renders the page first, then upgrades interactive components.

## Island Authoring

```tsx
import { defineIsland } from '@openelement/app';
import { signal } from '@openelement/element';

const count = signal(0);

export default defineIsland(
  'my-counter',
  () => <button onClick={() => count.value++}>Count: {count.value}</button>,
  { hydrate: 'idle', dsd: true },
);
```

## Hydration Strategy

- `load`: upgrade as soon as the client module loads.
- `idle`: wait until the browser is idle.
- `visible`: upgrade when the element enters the viewport.
- `only`: render only on the client.

## SSR Boundary

SSR admission is explicit. Components that cannot render safely on the server
must be declared as client-only instead of silently falling back.

## Why DSD

Declarative Shadow DOM lets server-rendered Web Components keep encapsulated DOM
and styles without waiting for JavaScript to create the shadow root.
