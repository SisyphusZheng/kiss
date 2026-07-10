# openElement Desktop Reader

Alpha.5 dogfood app proving openElement SPA mode, route loaders/actions,
data-context rendering, `@openelement/ui` custom elements, and Preact islands in
a Deno Desktop native window.

The app is a WeRead-inspired, local-first PDF reader. It keeps the calm
bookshelf/reading/note-taking shape of a modern reader while avoiding WeRead
branding, assets, social features, stores, DRM, or platform cloning.

The reader is intentionally not a content platform clone. Its alpha.5 job is to
stress openElement itself: routing, navigation, form actions, loader data,
custom-element UI, and desktop host packaging. Deno owns the native shell,
filesystem, local HTTP server, cache, and future connector host APIs; the app
surface should stay as much as possible in openElement.

Alpha.5 focuses on PDF only:

- fixtures source for deterministic smoke tests
- local folder/repository source for desktop reading
- GitHub repo/path source for public PDF collections
- bookshelf, reader, notes, search, source settings, Markdown note export

Longer term, this can grow into a cross-platform aggregated reader for local
books, saved web pages, RSS/newsletters, Mastodon threads, docs, and
Obsidian-friendly notes. That future should build on the same boundary:
openElement for product surface and interaction model, Deno for trusted local
capabilities.

## Setup

```sh
# Use the Deno version pinned in the root .dvmrc (2.9.0+).
# `deno desktop` is available in stable Deno since 2.9.0.
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
- `main.ts` — Deno.serve HTTP server + reader API endpoints
- `routes/` — 6 routes with openElement loaders/actions (bookshelf, reading,
  notes, search, settings, wc-interop)
- `islands/` — Preact islands for the PDF surface, search input, note hint, and
  sync state
- `components/` — Shared components (BookCard)
- `app/` — API client, Deno host store, browser storage, repo helpers, search,
  export
- `vite.config.ts` — openElement({ mode: 'spa' })

## Reader API

The desktop host exposes a small JSON/PDF API:

- `GET /api/sources`
- `POST /api/sources`
- `POST /api/sources/:id/sync`
- `GET /api/books`
- `GET /api/books/:id`
- `GET /api/books/:id/file`
- `POST /api/books/:id/progress`
- `GET /api/search?q=...`
- `GET /api/notes`
- `POST /api/notes`
- `DELETE /api/notes/:id`
- `GET /api/notes/export.md`

## Validation

This app validates:

- `@openelement/app/spa` — SPA mode bootstrap
- `@openelement/router` — route matching, navigation, params, loaders/actions
- `@openelement/router/data-context` — `useLoaderData()` and `useActionData()`
- `@openelement/ui` — Custom element components
- `@openelement/core` — JSX runtime
- Preact islands — `definePreactIsland` for local interaction only

The intended boundary is deliberate: OpenElement owns the app shell, pages,
loaders, actions, and form submission; Deno owns trusted local/GitHub/PDF host
work; Preact owns only high-interaction islands.
