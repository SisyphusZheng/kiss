# @openelement/app

JSX-first application authoring API for openElement.

> 0.42 alpha surface (v0.42.0-alpha.15, unfrozen; ADR-0122 freeze proposed):
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
