# First-Party Stack Contract

This page defines the v0.41 alpha.6 stack vocabulary. OpenElement owns the
framework concepts; the official tools implement those concepts as drivers or
adapters.

## OpenElement-Owned Concepts

`@openelement/app` owns the application model:

- `RouteGraph` describes page and API routes without requiring Hono.
- `RequestContext` normalizes a Web `Request`, params, environment, platform,
  and matched route without depending on a server driver.
- `RenderPipeline` names the framework phases: route, layout, head, assets,
  islands, serialization, and error handling.
- `AssetManifest` and `IslandManifest` describe output evidence consumed by
  build, render, deploy, and dogfood checks.
- `DeploymentTarget` names the runtime shape before a concrete deploy adapter
  writes platform output.

These contracts are exported from `@openelement/app/model` and re-exported from
`@openelement/app`.

## Official Defaults

| Tool / target       | Role                                                                 |
| ------------------- | -------------------------------------------------------------------- |
| Vite                | Default dev/build and asset-manifest driver.                         |
| Hono                | Default request/server driver over OpenElement request concepts.     |
| Nitro               | Default deployment output adapter for Node and Workers proofs.       |
| Deno Desktop        | First-party desktop app target for local-first OpenElement dogfood.  |
| Open Props          | Token foundation for `@openelement/ui` and Reader visual regression. |
| Preact islands      | Optional island authoring adapter, not the default UI model.         |
| Third-party WC libs | Compatibility target beside Basic Element conveniences.              |

## Boundary Rules

- App model tests must run without booting Hono.
- Hono, Nitro, Vite, and Deno Desktop may optimize their implementations, but
  public docs and tests should name OpenElement concepts first.
- Nitro output proof remains required evidence, but Nitro-specific routes are
  not the authoring API for OpenElement pages.
- Deno Desktop proof is a native app target check, not merely a localhost
  browser preview.
- Dogfood apps prove the framework contract; they do not create extra product
  lines.
