# Mastodon Desktop — Verification Checklist

## Manual smoke

- [ ] `deno task dev:api` starts without errors on port 8000.
- [ ] `GET /api/timeline` returns the fixture timeline JSON.
- [ ] `GET /api/profile/admin%40mastodon.social` returns the fixture account.
- [ ] `GET /api/status/111111111111111111` returns the fixture status.
- [ ] `deno task dev:web` starts Vite without errors.
- [ ] Browser navigates to `/` and renders the timeline route.
- [ ] Theme toggle works and persists across reloads.

## Type checking

- [ ] `deno task check` passes.

## Automated tests

- [ ] `deno task smoke` passes once tests are added.

## Known limitations (alpha.7)

- Components, islands, and storage layers are stubbed; they will be filled in
  Workstreams S2–S6.
- Profile/status routes render minimal placeholder cards.
