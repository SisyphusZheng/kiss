# openElement Reader

PDF-first desktop reading app powered by GitHub repos as content backend, using
openElement SPA mode (`defineApp` from `@openelement/app`).

## Setup

Install deno canary:

```sh
deno upgrade canary
```

Configure the GitHub repo containing your books (defaults to
`open-element/reader-fixtures`):

```sh
export READER_REPO="your-org/your-reader-repo"
```

## Run

```sh
deno task dev      # Run as HTTP server (development)
deno task build    # Compile to desktop binary
deno task check    # Type-check main.ts
```

## Architecture

- `main.ts` — `Deno.serve()` HTTP server: SPA shell, `/api/*` JSON endpoints,
  PDF file serving
- `app/index.html` — SPA shell, mounts `defineApp({ mode: 'spa' })` via
  `@openelement/app`
- `app/routes.ts` — Route table (placeholder, wired in S3)
- `app/reader.ts` — SPA bootstrap
- `app/types.ts` — Data model interfaces (Book, Progress, Note, Settings)
- `app/dom.ts` — Minimal DOM helpers (createElement, createTextNode, setStyles)
- `app/styles.css` — Themed reader CSS with custom properties
- `app/storage.ts` — Local persistence stubs (S4)
- `app/repo.ts` — GitHub repo sync stub (S4)
- `app/search.ts` — Full-text search stub (S4)
- `app/export.ts` — Markdown export stub (S5)
- `fixtures/books.json` — Sample book data for development
- `fixtures/books/` — PDF file directory for development

## Fixtures

The `fixtures/books/` directory contains placeholder PDF files for development. To use real books:

1. Download public domain PDFs from [Project Gutenberg](https://www.gutenberg.org/)
2. Place them in `fixtures/books/` matching the names in `books.json`
3. Or point the reader to your own GitHub book repo via `READER_REPO` env var

All fixture books are public domain works. No copyrighted content.
