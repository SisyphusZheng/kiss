# Deno Desktop Target Contract

v0.41 alpha.6 treats Deno Desktop as a first-party OpenElement app target for
local-first dogfood applications. It is not a localhost browser preview and it
does not make Reader a separate product line.

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

Run the automated checks defined in
`examples/deno-desktop-reader/VERIFICATION.md` before tagging an alpha release
that touches the app, router, UI, Open Props tokens, SPA mode, Deno Desktop host
behavior, or Reader.

Manual native smoke remains required when Deno Desktop canary or OS integration
changes: build the Reader, open the native app, verify directory picker behavior,
and close the window through the desktop lifecycle path.
