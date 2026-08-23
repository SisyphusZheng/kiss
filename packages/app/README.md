# @openelement/app

JSX-first application authoring API for openElement.

> 0.42.0 stable surface (frozen under ADR-0122):
> Framework product. Use this package for first-run pages,
> layouts, islands, route metadata, and the Vite facade.

Use the package root in route, island, and component modules:

```tsx
import { definePage } from '@openelement/app';

export default definePage({
  route: { path: '/' },
  head: { title: 'Home' },
  render() {
    return <main>Hello openElement</main>;
  },
});
```

Use the Vite facade from `@openelement/adapter-vite` in `vite.config.ts`:

```ts
import { openElement } from '@openelement/adapter-vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    openElement({
      routesDir: 'app/routes',
      islandsDir: 'app/islands',
      packageIslands: ['@openelement/ui'],
      content: { blog: { contentDir: 'content/blog' } },
      i18n: { locales: ['en', 'zh'], defaultLocale: 'en' },
    }),
  ],
});
```

## Authoring API

```tsx
import { defineElement, defineIsland, definePage } from '@openelement/app';
```

- `definePage({ route, head, renderIntent, render, error })` creates a file-route page from a canonical object descriptor.
- `defineIslandConfig({ ssr, dsd, hydrate })` defines static island metadata for adapter scanning.
- `defineIsland(tagName, render, { hydrate, dsd, ssr })` creates a browser-upgraded island.
- `defineElement(tagName, render)` creates a DSD component, including layout elements.

SPA action failures expose `{ error: 'Action failed' }` to page renderers. Raw
exceptions are logged only in development. Route matching preserves declaration
order while compiling static segments into a trie; named parameters, optional
parameters, and wildcards remain supported.

## Route execution contexts

Server route modules use `LoaderContext<Env, Platform>` and
`ActionContext<Env, Platform>`. Both derive from `ServerRouteContext` and
receive `request`, `params`, `env`, `platform`, `responseHeaders`, and `route`;
actions additionally receive `formData`. `Env` accepts concrete Worker binding
interfaces, including Queue, KV, Service Binding, and Rate Limit objects. Write
response metadata only through `responseHeaders`, which the generated server
merges into its final `Response`.

SPA handlers are a separate browser execution chain. Use `SpaLoaderContext`
and `SpaActionContext`; they intentionally expose only route params (and SPA
action form data). A server loader cannot be reused unchanged in SPA mode,
because browsers do not receive server `Request`, environment, platform,
response-header, or route-metadata capabilities.

`OpenElement` remains the runtime primitive in `@openelement/element`, but application
authors should start from this package.

Build configuration is owned by `@openelement/adapter-vite`; generated projects
and docs import its `openElement()` facade from the package root rather than an
app-package Vite subpath.

## Install

```bash
npm install @openelement/app
```

## License

MIT
