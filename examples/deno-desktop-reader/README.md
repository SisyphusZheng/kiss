# openElement Desktop Reader

Alpha.5 dogfood app proving openElement SPA mode, route loaders/actions,
data-context rendering, @openelement/ui custom elements, Preact islands, and
third-party web component interop in a Deno Desktop native window.

The reader is intentionally not a content platform clone. Its alpha.5 job is to
stress openElement itself: routing, navigation, form actions, loader data,
custom-element UI, and desktop host packaging. Deno owns the native shell,
filesystem, local HTTP server, cache, and future connector host APIs; the app
surface should stay as much as possible in openElement.

Longer term, this can grow into a cross-platform aggregated reader for local
books, saved web pages, RSS/newsletters, Mastodon threads, docs, and
Obsidian-friendly notes. That future should build on the same boundary:
openElement for product surface and interaction model, Deno for trusted local
capabilities.

## Setup

```sh
deno upgrade canary    # deno desktop requires canary
```

## Dev

```sh
deno task dev          # Vite HMR at http://localhost:5173
```

## Build Desktop

```sh
deno task build        # Vite build + deno desktop compile
open deno-desktop-reader.app
```

## Architecture

- `reader.tsx` — Vite client entry, SPA bootstrap
- `main.ts` — Deno.serve HTTP server + API + GitHub sync
- `routes/` — 6 routes with openElement loaders/actions (bookshelf, reading, notes, search, settings, wc-interop)
- `islands/` — Preact island (reader-counter)
- `components/` — Shared components (BookCard)
- `app/` — Persistence layer (storage, repo, search, export)
- `vite.config.ts` — openElement({ mode: 'spa' })

## Validation

This app validates:

- `@openelement/app/spa` — SPA mode bootstrap
- `@openelement/router` — route matching, navigation, params, loaders/actions
- `@openelement/router/data-context` — `useLoaderData()` and `useActionData()`
- `@openelement/ui` — Custom element components
- `@openelement/core` — JSX runtime
- Preact islands — `definePreactIsland`
- Third-party CE — Lit, Shoelace, MWC
