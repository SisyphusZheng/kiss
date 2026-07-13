# Reader Dogfood

> **Framework surface under test**: SPA mode, Deno Desktop target, local-first documents, Preact islands, `@openelement/ui`, Open Props theming.\
> **First released**: v0.41.0-alpha.5\
> **Regression grade**: v0.41.0-alpha.6

## What It Is

A WeRead-style desktop reading practice app. It is backed by local/open fixtures and public GitHub repo/path sources. It does **not** integrate WeRead private APIs, account cookies, scraping, or copyrighted book content.

## Stress Surfaces

- **SPA mode**: `defineApp({ mode: 'spa' })`, client-side routing, history/hash navigation for `file://`.
- **Deno Desktop**: window lifecycle, menu/shortcuts, local storage persistence.
- **Local-first state**: bookshelf, reading progress, theme/font settings, annotations, notes, search.
- **Preact islands**: heavy-island integration inside a Basic Element app.
- **UI components**: `open-dropdown`, `open-dialog`, `open-tabs`, and semantic Open Props token sheets.
- **Content rendering**: PDF/text rendering, Markdown export.

## Entry Points

- Implementation: `examples/deno-desktop-reader/`
- Regression smoke: `examples/deno-desktop-reader/e2e/`

## Non-Goals

- No WeRead private API integration.
- No copyrighted content.
- No server/data/cache framework primitives.

## Evidence

Release evidence is recorded in `docs/release/autoflow3/v0.41.0-alpha.6.json` and the alpha.6 release notes.
