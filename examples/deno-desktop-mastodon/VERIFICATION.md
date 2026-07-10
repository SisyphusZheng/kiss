# Mastodon Desktop — Verification Checklist

## Automated tests

- [x] `deno task check` passes.
- [x] `deno task smoke` passes (format, cache, api, server smoke).
- [x] `deno run -A npm:vite build` succeeds and stays within budget.

## Manual smoke

- [x] `deno task dev:api` starts without errors on port 8000.
- [x] `GET /api/timeline` returns the fixture timeline JSON.
- [x] `GET /api/profile/:acct` returns the fixture account.
- [x] `GET /api/status/:id` returns the fixture status.
- [x] `deno task dev:web` starts Vite without errors.
- [x] `/` renders the timeline with status cards.
- [x] `/profile/admin@mastodon.social` renders profile header and posts.
- [x] `/status/111111111111111111` renders the status and reply thread.
- [x] `/settings` renders the settings island and persists changes.
- [x] Theme toggle works and persists across reloads.
- [x] SPA fallback serves `dist/index.html` for all routes.

## Framework stress points exercised

- SPA router with parametric routes (`/profile/:acct`, `/status/:id`).
- OpenElement class-based page components receiving loader data.
- Functional components nested inside OpenElement render output.
- Preact island (`settings-island`) registered and hydrated.
- Design-system tokens injected via adopted stylesheets.
- Client-side cache layer backed by `localStorage`.
- Dual-mode API client (fixtures / live) returning `ApiResult<T>`.
