# First-Party Stack Contract

This page defines the current v0.41 alpha.7 stack vocabulary. OpenElement owns the
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

OpenElement App owns the semantics. Dependency-neutral route and asset contracts
are carried by `@openelement/protocol/app-model`, then re-exported through
`@openelement/app/model` and `@openelement/app` for authors.

`@openelement/app/hono` is the official default request-driver bridge. It maps a
Hono-like context into `RequestContext` before OpenElement framework code sees
request data.

## Page And Component Contracts

OpenElement has two supported Web Component page/component paths:

- **Basic Element pages** use `@openelement/element` and the `OpenElement`
  class. They are the default authoring path and may use OpenElement render,
  StyleSheet, signal, DSD, hydration, and island conveniences.
- **Third-party WC interop pages** use custom elements from outside Basic
  Element. They enter the build through explicit package manifest metadata or
  Custom Elements Manifest input. They are first-class compatibility targets,
  but only the capabilities declared in metadata are assumed.

The protocol-level `WebComponentContract` records `authoring`,
`render`, `metadataSource`, and a diagnostic `reason`. Unsupported or unknown
third-party SSR behavior must become a clear client-only or rejected admission
decision, not a silent partial render.

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

`@openelement/ssg/drivers` contains adapter-facing driver contracts:

- `createHonoRequestDriver()` keeps Hono entry generation behind an explicit
  request-driver boundary.
- `createViteAssetDriver()` maps Vite manifest output into OpenElement
  `AssetManifest`.
- `createRouteGraphFromEntries()` maps scanned route entries into `RouteGraph`.

`@openelement/adapter-vite/nitro-mount` contains the first-party Nitro deploy
adapter bridge. The adapter-vite root keeps a temporary alpha compatibility
re-export, but stack docs and new proof code should use the explicit subpath.

These are the current proven implementations, not evidence of unlimited
replaceability. Alpha.7 makes BuildPlan the production owner (#380), converges
the adapter-vite interface (#272), separates build/deploy/resolver ownership
(#273), and resolves whether SignalEngine is fixed or genuinely replaceable
(#387). Until those slices close, public claims should name the implemented
Vite/Hono/Nitro/Preact path directly.

## Browser Baseline

Declarative Shadow DOM is available in current Chromium, Firefox, and WebKit.
The project still carries a legacy injected fallback, so alpha.7 #386 must turn
the browser target into an executable contract and either remove the default
fallback or make legacy support explicit. Current output must not claim that
modern Firefox lacks `shadowrootmode`, and strict CSP behavior must be tested.

## Boundary Rules

- App model tests must run without booting Hono.
- Hono request-driver tests must prove request data crosses into
  `RequestContext` before app code uses it.
- Hono, Nitro, Vite, and Deno Desktop may optimize their implementations, but
  public docs and tests should name OpenElement concepts first.
- Nitro output proof must execute generated Node and Workers output. Nitro
  route files are deploy-adapter glue, not the authoring API for OpenElement
  pages.
- Basic Element conveniences must not be promised to arbitrary third-party Web
  Components unless their manifest declares the capability. Third-party WC
  packages without validated SSR metadata use explicit client-only interop.
- Deno Desktop proof is a native app target check, not merely a localhost
  browser preview.
- Dogfood apps prove the framework contract; they do not create extra product
  lines.
- Generic SPA navigation belongs to app/router, not the reusable OpenLayout;
  #381 migrates the current implementation and #274 layers the remaining UI.
