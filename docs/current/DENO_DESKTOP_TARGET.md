# Deno Desktop Target Contract

Introduced in `0.41.0-alpha.6` and retained as alpha.7 dogfood evidence, Deno
Desktop is a first-party OpenElement app target for local-first applications.
It is not a localhost browser preview and it does not make Reader or Mastodon
Desktop a separate product line.

## Framework Boundary

OpenElement owns:

- app routes, loaders, actions, forms, and SPA navigation;
- the app shell and component composition;
- OpenElement UI usage, Open Props tokens, Basic Element components, and
  optional islands;
- framework regression evidence through Reader smoke tasks.

Deno Desktop owns:

- native window boot and lifecycle;
- trusted local filesystem access;
- local HTTP serving for the built SPA;
- OS directory picker and future native host capabilities;
- process shutdown for close/minimize/maximize regression tracking.

Reusable framework concepts must stay in `@openelement/app`, `@openelement/ui`,
or documented adapter contracts. Reader-specific host storage, PDF indexing, and
source syncing stay inside `examples/deno-desktop-reader`.

## Reader Host Contract

The Reader host exposes local capabilities through API endpoints:

- local fixture, folder, and GitHub PDF sources;
- book metadata, cached files, progress, notes, search, and Markdown export;
- settings that affect the reading surface;
- `/api/dialog/directory` for macOS directory selection;
- `/api/app/close` for desktop close behavior.

These endpoints are dogfood evidence, not core package APIs.

## Verification

Use the automated and manual workflows in
`examples/deno-desktop-reader/VERIFICATION.md` before tagging an alpha release
that touches the app, router, UI, Open Props tokens, SPA mode, Deno Desktop host
behavior, or Reader.

Manual native smoke remains required when Deno Desktop canary or OS integration
changes: build the Reader, open the native app, verify directory picker behavior,
and verify the close button or Cmd/Ctrl+W triggers `/api/app/close` and clean
shutdown.

## v0.44 Build Status (Beta.2 ruling, #1228)

The desktop examples predate the v0.44 compiled module grammar. Their SPA
route modules colocate `loader`/`action`/`tagName` exports and helper
statements with the `@element` page class, and their `render()` bodies carry
local statements and early returns — all outside the compiled grammar — so
the full `npm:vite build` fails closed with OEC9008 (reader: 5 route modules,
mastodon: 4) and, behind it, OEC9007. The fail-closed behavior is the grammar
working as designed: no silent fallback, no wrong output.

Beta.2 investigated a bounded repair. Moving the route wiring into sibling
plain modules is mechanical, but the `render()` bodies then fail OEC9007
(single-return JSX) and OEC9006 (undecorated fields), so the repair is a full
re-authoring of nine large renders against the compiled grammar with no
browser E2E safety net — not a bounded fix. The ruling: the desktop examples
are **excluded from qualifying consumer evidence** and the re-authoring is
carried to Beta.3 (B3.8).

`deno task check` and `deno task smoke` stay green and CI-gated
(`examples:check`), so the examples still qualify the SPA runtime, loaders,
actions, and UI interop against workspace source. They are workspace dogfood
fixtures, not packed-artifact consumers.
