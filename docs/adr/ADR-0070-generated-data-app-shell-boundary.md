# ADR-0070: Generated Data Namespace and App Shell Boundary

> Status: ACCEPTED
> Date: 2026-05-31
> Version: v0.27.0
> Related: ADR-0069, SOP-008, SOP-009, SOP-010
> Supersedes: the ADR-0069 P0 assumption that `@openelement/ui` should import
> app-generated content data directly.
>
> Numbering collision: shares ADR-0070 with
> [0070-bridge-contracts.md](./0070-bridge-contracts.md) (三层桥接可信化, LessJS era) —
> they are different decisions, both retained; cite by filename.

## Context

SOP-008 correctly rejected the `window.__ROUTE_MANIFEST__` workaround. That
global mixed route metadata, UI navigation data, i18n data, and layout state in
one browser-side object. It was a framework-layer leak into the docs site.

SOP-009 then tried to remove the remaining data virtual modules by making
`less-layout` import generated data from `@openelement/content/nav`. That direction
is also wrong. `@openelement/ui` is a package-level UI library. It must not import
app-specific generated files, and it must not depend on the `@openelement/content`
package to render its default shell.

The repo audit found four separate issues that were being treated as one
resolver bug:

1. `@openelement/content/nav`, `@openelement/content/blog-data`, and `@openelement/i18n/data`
   are overloaded. Package `deno.json` files expose them as package API
   subpaths, while `www/deno.json` remaps the same specifiers to app-generated
   files.
2. `less-layout` currently imports `virtual:less-nav`, which keeps app data
   inside the UI package import graph.
3. `adapter-vite` resolves generated data in several places with duplicated
   logic and hardcoded `www/app/data` paths.
4. `www` still manually renders `<open-layout>` in route components and passes
   locale data per page, even though the framework already supports
   `_renderer.ts` route wrapping.

The current checkout also shows that the root-cause text in ADR-0069 is now
stale. `createLessJsrPackageResolverPlugin` no longer intercepts
`@openelement/content/*` or `@openelement/i18n/*`; optional packages are explicitly left
to other resolver layers. The remaining problem is package/app boundary
overloading, not merely resolver order.

## Decision

Generated app data must use a distinct app-private namespace. Package public
subpaths and generated application modules must not share the same specifier.

The new generated data contract is:

```text
@openelement/generated/nav
@openelement/generated/blog-data
@openelement/generated/i18n
```

These specifiers are not package exports. They are app-local build products
resolved by `adapter-vite` and the app import map. They point to real generated
disk files such as:

```text
app/data/_generated-nav.ts
app/data/_generated-blog-data.ts
app/data/_generated-i18n-data.ts
```

`@openelement/content/nav`, `@openelement/content/blog-data`, and `@openelement/i18n/data`
remain package API subpaths only. They must not be remapped to app-generated
files in new code.

`@openelement/ui\/open-layout` remains a pure UI component. It accepts data through
properties, attributes, or framework-owned context. It must not import:

```text
virtual:less-nav
@openelement/content/nav
@openelement/generated/nav
```

The app shell boundary owns the connection between generated app data and UI
layout. The framework should use the existing renderer wrapping model, or an
auto-generated equivalent, to wrap route output with `<open-layout>` and inject
nav, header nav, locale, locale list, and current path.

The target data flow is:

```text
@openelement/content and @openelement/i18n plugins
  -> scan routes/content/config
  -> write app/data/_generated-*.ts
  -> @openelement/generated/* resolver
  -> app shell renderer
  -> <open-layout ...>
  -> page content
```

Route components should render page content. They should not own framework
layout wiring, locale wiring, search index wiring, or generated navigation
data.

## Architecture Boundaries

### Package APIs

Package APIs are stable source APIs published by LessJS packages:

```text
@openelement/content/nav
@openelement/content/blog-data
@openelement/i18n/data
```

They expose scanner, loader, writer, and helper code. They do not mean "the
current app's generated data".

### App Generated Data

Generated app data is owned by the active app build:

```text
@openelement/generated/nav
@openelement/generated/blog-data
@openelement/generated/i18n
```

It is resolved from app root and data directory settings. It can be consumed by
route modules, generated renderers, and SSG helpers, but not by package-level UI
components.

### UI Components

`@openelement/ui` must remain reusable outside the docs site. Its dependency graph
may include core UI/runtime packages, but it must not depend on content/i18n
generated app data.

### App Shell

The app shell is the correct boundary for route-level layout composition. It
may be an explicit `_renderer.ts` file, an auto-generated renderer produced by
`adapter-vite`, or both composed together. It is the only layer that should
translate generated nav/i18n data into `less-layout` attributes.

## Implementation Implications

1. Add a shared `createGeneratedDataResolverPlugin()` in `adapter-vite`.
2. Replace duplicated generated-data resolution in dev, SSG, and client build
   paths with that one resolver.
3. Parameterize generated data paths from app root and data directory. Do not
   hardcode `www/app/data`.
4. Add app-shell renderer support that can wrap page output with `less-layout`
   without every route component hand-authoring layout tags.
5. Migrate `www` routes so route components return page content only.
6. Remove data virtual modules after all generated-data consumers use
   `@openelement/generated/*`.

Builder virtual modules remain acceptable when they represent generated code
entries or build triggers:

```text
virtual:less-hono-entry
virtual:less-build-trigger
virtual:less-client-entry
virtual:less-ssg-entry
virtual:less-routes
```

Data virtual modules are not acceptable as the long-term app-data contract:

```text
virtual:less-nav
virtual:less-blog-data
virtual:less-i18n-data
```

## Consequences

### Positive

- Removes app-data meaning from package API subpaths.
- Keeps `@openelement/ui` reusable and package-pure.
- Gives `www` a framework-level path to zero manual layout wiring.
- Removes duplicated resolver snippets and hardcoded data paths.
- Makes SSG, dev, and client builds share one generated-data contract.
- Turns SOP-009 from a resolver-order chase into a clean layer-boundary
  migration.

### Negative

- Requires a controlled migration of route imports and `www/deno.json`.
- Requires route components to stop wrapping themselves in `<open-layout>`.
- Requires renderer/app-shell tests because route output shape changes.
- Existing virtual-data imports need temporary compatibility while the migration
  is in progress.

### Neutral

- The generated data still lives on disk. That remains the correct durable
  contract for build-known app data.
- `@openelement/content` and `@openelement/i18n` remain optional framework features.
- Existing explicit `_renderer.ts` files must continue to work; auto app-shell
  wrapping should compose with user renderers or be disabled when a user opts
  out.

## Alternatives Considered

### Keep `virtual:less-nav`

Rejected. It builds today, but it keeps app data inside package UI resolution
and forces client stubs, SSG dispatch, and phase-context style bridges.

### Make `less-layout` import `@openelement/content/nav`

Rejected. This couples `@openelement/ui` to an optional content package and to an
app-specific generated file. It also makes the UI package depend on app import
maps to load.

### Keep remapping `@openelement/content/*` in `www/deno.json`

Rejected. The same specifier cannot safely mean "package API" in one graph and
"this app's generated data" in another. That ambiguity is the source of the
workaround chain.

### Restore `__ROUTE_MANIFEST__`

Rejected. It was a browser global carrying framework, UI, and app state in one
object. SOP-008 was correct to delete it.

## Verification Signals

This ADR is implemented only when these checks are true:

```text
packages/ and www/app source contain no data virtual imports:
  virtual:less-nav
  virtual:less-blog-data
  virtual:less-i18n-data

www route files contain no framework layout wiring:
  <open-layout
  locale=
  locales=
  nav-items=
  header-nav=

adapter-vite contains no hardcoded generated-data path:
  www/app/data

@openelement/ui contains no content/generated-data imports:
  @openelement/content/nav
  @openelement/generated/nav
  virtual:less-nav
```

The release gate is:

```text
deno task fmt:check
deno task lint
deno task typecheck
deno task graph:check
deno task test
deno task build
deno task test:e2e
```

## SOP

Implementation plan:
`docs/sop/v0.27.0/SOP-010-generated-data-app-shell-boundary.md`
