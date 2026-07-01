# ADR-0111: OpenElement App Ownership Boundary

- Status: Accepted
- Date: 2026-07-01
- Depends on: ADR-0096, ADR-0098, ADR-0110

## Context

Alpha.5 proved that OpenElement can run as an SPA and desktop-shaped Reader, but
some framework concepts still look like they belong to the current glue layer:
Vite plugin build steps, Hono request handling, Nitro runtime output, SSG file
emission, and Deno Desktop shell proof. Alpha.6 exists to make those concepts
OpenElement-owned before widening Reader and alpha.7 networked desktop dogfood.

Without a clear ownership boundary, future changes can accidentally make
`@openelement/app` a thin wrapper around Hono/Vite/Nitro instead of the framework
model that those adapters implement.

## Decision

`@openelement/app` owns the framework application model:

- `RouteGraph`
- `RenderPipeline`
- `RequestContext`
- `AssetManifest`
- `IslandManifest`
- `DeploymentTarget`

Vite, Hono, Nitro, and Deno Desktop are official defaults over those concepts:

- Vite implements dev/build and asset-manifest integration.
- Hono implements the request/server driver.
- Nitro implements deploy output/runtime proofs.
- Deno Desktop implements the first-party desktop app target contract.

The adapters may provide optimized implementations, but the public vocabulary
and tests should name the OpenElement concepts first. Hono/Vite/Nitro/Deno
Desktop details should enter through adapter contracts, not leak into the app
model as product identity.

## Non-Goals

- No replacement of Vite, Hono, or Nitro as official defaults in v0.41.
- No generic desktop abstraction over Tauri/Electron/Capacitor.
- No new server/data/forms/session/cache product surface unless alpha.6 needs a
  minimal contract to express route/request/render ownership.

## Consequences

- A6.2 and A6.7 should cite this ADR when moving SSG/render/router ownership
  from adapter-specific code into OpenElement concepts.
- Reader regression dogfood and alpha.7 Mastodon Desktop must use the same
  app/desktop target contract instead of app-specific host glue.
- Tests should prove the app model without requiring Hono first, then prove Hono
  maps into that model.
