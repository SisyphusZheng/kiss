---
title: 'API Reference'
section: 'Reference'
label: 'API'
order: 70
---

# API Reference

The current public product surface has five packages. Most authors use
`@openelement/element`, `@openelement/app` and
`@openelement/adapter-vite`; `create` starts a project and `ui` is optional.

## Element authoring

```tsx
import { defineElement, defineLayout } from '@openelement/element';
```

`defineElement()` declares a reusable native custom element. Shadow/DSD is the
default render mode; light DOM remains explicit opt-in. `defineLayout()` is the
semantic layout alias for element authoring.

## Application authoring

```tsx
import { defineApp, defineIsland, definePage } from '@openelement/app';
```

`definePage()` declares a route descriptor with route, head, render intent,
render and error behavior.

```tsx
import { definePage } from '@openelement/app';

export default definePage({
  route: { path: '/' },
  head: { title: 'Home' },
  render() {
    return <main>Hello OpenElement</main>;
  },
});
```

`defineIsland()` marks an interactive custom element for selective upgrade.
`defineApp()` starts the documented application mode, including SPA mode when
that is the selected product path.

## Build and starter

```ts
import { buildApp, openElement } from '@openelement/adapter-vite';
```

`openElement()` configures the official Vite integration. `buildApp()` owns the
supported build invocation so callers do not need to understand plugin ordering
or internal manifests.

```sh
deno run -A npm:@openelement/create my-app
cd my-app
deno task dev
```

Generated projects provide `dev`, `check`, `test`, `build` and `preview`.

## Future application interaction

The route-to-action loop—request-time data, progressive forms, actions and
revalidation—is planned for the `0.42` WC Application Loop. It is not presented
as a stable public contract in the current package line.
