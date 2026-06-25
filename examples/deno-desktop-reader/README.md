# openElement Desktop Reader

Alpha.5 dogfood app proving SPA mode, @openelement/ui custom elements, Preact islands, and third-party web component interop in a Deno Desktop native window.

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
- `routes/` — 6 routes (bookshelf, reading, notes, search, settings, wc-interop)
- `islands/` — Preact island (reader-counter)
- `components/` — Shared components (BookCard)
- `app/` — Persistence layer (storage, repo, search, export)
- `vite.config.ts` — openElement({ mode: 'spa' })

## Validation

This app validates:
- `@openelement/app/spa` — SPA mode bootstrap
- `@openelement/ui` — Custom element components
- `@openelement/core` — JSX runtime
- Preact islands — `definePreactIsland`
- Third-party CE — Lit, Shoelace, MWC
