# openElement Mastodon Desktop

A read-only, account-less Mastodon desktop client built as the v0.41.0-alpha.7
framework dogfood. It deliberately exercises openElement's SPA router, custom
element pages, Preact islands, third-party web component interop, and Deno
Desktop packaging.

## Scope

- Read-only timeline, profile, and status detail views.
- Fixture-backed API by default (no account required).
- Optional live mode via `MASTODON_LIVE=true` and a public Mastodon instance.
- Client-side cache with TTL for timeline, profile, and status data.
- Persisted settings: instance URL, theme, timeline density.
- No OAuth, notifications, DMs, or mutations.

## Project layout

```
app/
  api.ts           Fixture/live Mastodon API client
  api-client.ts    Cached wrapper used by route loaders
  cache.ts         localStorage TTL cache
  format.ts        Date, count, and HTML presentation helpers
  settings.ts      Persisted app settings
  storage.ts       Safe localStorage wrapper
  styles.css       Shell and layout styles
  types.ts         Mastodon domain types
  __tests__/       Unit + smoke tests
components/
  Avatar.tsx       Account avatar with fallback
  RelativeTime.tsx Relative/absolute timestamp
  StatusCard.tsx   Status card (account, content, media, actions)
islands/
  settings-island.tsx  Preact island for the settings form
fixtures/        JSON fixtures for offline dogfood
routes/
  index.tsx      Timeline route
  profile.tsx    Profile route
  status.tsx     Status detail + conversation route
  settings.tsx   Settings route
deno.json        Deno Desktop manifest
index.html       Vite entry
main.ts          Deno serve: static assets + API proxy
mastodon.tsx     Client bootstrap
vite.config.ts   openElement SPA adapter config
```

## Development

```bash
# Run the API server and Vite dev server together
deno task dev

# Or run them separately
deno task dev:api   # Deno serve on http://localhost:8000
deno task dev:web   # Vite on http://localhost:5173
```

## Build

```bash
deno task build
```

This builds the SPA with Vite and then packages the Deno Desktop app.

## Live mode

```bash
MASTODON_LIVE=true deno task dev:api
```

Live mode hits real Mastodon public endpoints. It is read-only and requires no
tokens, but rate limits apply.

## Tests

```bash
deno task smoke
```
