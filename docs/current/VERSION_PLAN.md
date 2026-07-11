# v0.41.0 Version Plan - Web Components Fullstack Framework + Basic Element

```text
openElement = Web Components Fullstack Framework + Basic Element
supporting packages = Protocols + UI + official stack adapters
```

## Objective

Execute the npm-primary distribution migration using Deno 2.8+ `deno pack`,
harden the signal-DOM architecture, and turn OpenElement into a credible
Web Components-native fullstack framework with a JSX-first Basic Element
authoring layer.
Vite, Hono, Nitro, Deno Desktop, Open Props, Preact islands, and third-party Web
Components are first-party stack decisions, but they must enter through
OpenElement-owned package contracts and protocol concepts.

The release is staged through alpha lines with explicit execution plans:

- **alpha.1** (shipped): npm distribution + audit cleanup.
- **alpha.2**: Signal-DOM deepening (`HydrationScope` to `@openelement/core/hydrate`,
  renderer/activation split, `BindingDescriptor` registry).
- **alpha.3–4** (merged): Cross-Framework WC Integration —
  consume Lit/Shoelace/MWC + client runtime for Deno Fresh
  interop proof; pure-ESM/ECMAScript npm gates.
- **alpha.5**: SPA mode + Deno Desktop Reader proof, Reader polish, and current
  PR/framework closure.
- **alpha.6** (released): Front-half cleanup audit closure, OpenElement App/protocol
  architecture hardening, official stack contracts, Deno Desktop target
  contract, and Reader regression-grade dogfood. Published to npm as
  `0.41.0-alpha.6` with provenance.
- **alpha.7** (implementation complete): Dogfood, Architecture Convergence, and
  Adoption Readiness. Its implementation, distribution, evidence, and adoption
  slices ship on the complete `v0.41.0-alpha.8` package set because the
  partially published `alpha.7` npm version is immutable. External adopter
  pilot #390 remains a post-release validation item and is not a package gate.
- **beta.1** (planned validation): Re-run the alpha.7-frozen starter, API,
  website, package, evidence, and release surfaces as a release candidate. It
  owns no new implementation train.

## Context

v0.41.0-alpha.1 removed the legacy Linear UI surface, closed the audit-driven
cleanup train, and shipped the first npm-only alpha under ADR-0107. JSR publish
was removed as a release gate; distribution evidence is produced by `deno pack`
and the npm provenance workflow. The next strategic blockers are signal-DOM
architecture hardening and WC ecosystem integration.

A previous v0.41.0 line proposed making Vite+ treat Deno as a first-class
package manager. That upstream PR (voidzero-dev/vite-plus#1888) was declined,
so this plan pivots to Deno's own `deno pack` tooling while keeping Vite as the
official OpenElement build adapter.

## Scope

### Toolchain

- Pin `.dvmrc` to Deno `2.9.0` (stable). CI reads `.dvmrc` via
  `setup-deno-workspace`, and the standalone JSR consumer monitor reads the same
  `.dvmrc`. Deno 2.8+ remains the documented public minimum; the repo itself
  converges on the latest stable release that passes the full gate matrix.
- Convert all internal `@openelement/*` imports from `jsr:` to `npm:` in root
  and `packages/*/deno.json`.
- Add `deno task pack` and `deno task publish:npm` that pack and publish the
  11-package graph in dependency order.
- Add `deno task pack:dry-run` for CI validation.

### Runtime-agnostic boundaries

- ~~Move `FileIsrCache` from `@openelement/core/isr` to
  `@openelement/ssg/file-isr-cache`; keep the interface and `MemoryIsrCache` in
  `core`.~~ Superseded by architecture audit cleanup: `FileIsrCache` was removed
  because no production code consumed it. `MemoryIsrCache` remains the reference
  implementation in `@openelement/core/isr`.
- ~~Change `router/src/page-loader.ts` `loadPage()` to accept raw markdown text
  instead of reading files with `Deno.readTextFile`.~~ Superseded by cleanup:
  `router/src/page-loader.ts` was removed during architecture audit. Raw markdown
  rendering remains available in `@openelement/content`.
- Add `tools/check-deno-api-free.ts` and a `deno task deno-api:check` gate that
  fails if `core/element/ui/protocol/signal/router/app` source files use
  `Deno.*` or host-specific runtime APIs that do not belong in browser-facing
  package surfaces.

### Adapter-vite

- Default `createOpenJsrPackageResolverPlugin` to npm mode: skip virtual-module
  source fetching and let Vite resolve `@openelement/*` from `node_modules`.
- Keep JSR source resolution available via explicit `registry: 'jsr'` option.

### Starter template

- Update `@openelement/create` to emit `npm:@openelement/*` imports.
- Resolve remote package versions from the npm registry instead of JSR.

### Release flow

- Replace JSR publish with `deno pack` + `npm publish --provenance` in
  `tools/autoflow/release.ts`.
- Keep `jsr-consumer-monitor.yml` and `wait-jsr-release-metadata.ts` as
  historical observation tools, not release gates.

### Consumer smoke

- Add npm-registry consumer smoke for Node ESM, Deno `npm:`, jsDelivr CDN, and
  Nitro Node/Workers output.
- Add third-party WC smoke for Lit, Shoelace, Material Web Components, and
  bidirectional Lit/openElement nesting.
- Add packed artifact quality gate using publint, arethetypeswrong, and
  tarball extraction scans.
- Add Fresh example smoke for openElement component hydration.

### alpha.4 Merge and Release Closure

alpha.4 is merge-ready when PR #113 is green on `dev`: both AutoFlow CI jobs,
CodeQL/Analyze jobs, Cloudflare Pages preview, and review bot must pass. After
merge, alpha.4 is not called released until `main` CI is green and the approved
release workflow records npm publish plus post-publish npm consumer smoke
evidence.

alpha.5 is released: SPA mode + Deno Desktop Reader proof, Reader
usability/polish, and framework closure for the alpha.5 PR. The Reader is a
WeRead-style desktop practice app backed by fixtures, local PDF
folders/repositories, and public GitHub repo/path sources; it must not use WeRead
private APIs, account cookies, scraping, or copyrighted book content.
React/Vue/Svelte adapters stayed out of alpha.5 unless required to validate SPA
navigation disposal semantics.

alpha.6 is released. It keeps Vite/Hono/Nitro as official defaults, but moves
framework ownership to OpenElement concepts: RouteGraph, RenderPipeline,
RequestContext, AssetManifest, IslandManifest, DeploymentTarget, and Deno Desktop
target contracts. It closed the cleanup-audit front half (#205 through #212):
release truth, package surface drift, router internal exports, tracked ignored
generated artifacts, stale resolver maps, duplicate tooling helpers,
route-scanner test ownership, stale design artifacts, and active-source audit
labels. Final review extended the front-half slice with #226 and #227 to
capture duplicate implementations across packages and redundant
dependencies/configs/tooling helpers discovered during release-candidate review.
It also closed the product-truth and CodeQL/code-scanning backlog
(#192 through #194 and #186 through #191) as part of A6.6/A6.8 governance and
release hygiene. The final release-candidate cleanup closed the remaining
CodeQL dynamic-import code-generation alert with admitted island module
specifiers and shared CodeQL-recognized JavaScript literal escaping for generated
client and server entry code before the `0.41.0-alpha.6` package workflow ran.

## Non-Goals

- No Node runtime migration for openElement development.
- No npm/pnpm/yarn workspace source of truth.
- No further upstream Vite+ Deno PM advocacy in this release.
- No removal of existing JSR published versions.
- No server/data/forms/session/cache primitives (deferred to v0.42.0+).
- No new product line for Reader, Mastodon Desktop, AutoFlow, or governance
  tooling. Dogfood apps validate the Framework contract; governance tooling
  protects releases.

## Staged Alpha/Beta Plans

The active work is tracked in per-alpha plan files:

- `docs/release/v0.41.0-alpha.2-plan.md` — Signal-DOM Deepening
- `docs/release/v0.41.0-alpha.3-plan.md` — Third-party Web Components inside OpenElement
- `docs/release/v0.41.0-alpha.4-plan.md` — OpenElement components inside Fresh
- `docs/release/v0.41.0-alpha.5-plan.md` — SPA Mode + Deno Desktop Reader Proof
- `docs/release/v0.41.0-alpha.6-plan.md` — Front-half cleanup audit, App/protocol architecture hardening, CodeQL cleanup, and Reader dogfood
- `docs/release/v0.41.0-alpha.7-plan.md` — Dogfood, Architecture Convergence, and Adoption Readiness
- `docs/release/v0.41.0-beta.1-plan.md` — Release-candidate validation

Alpha.7 started after alpha.6 closed the first framework architecture loop. Its
dogfood foundation is complete; the active A7.01–A7.21 issue train in the
alpha.7 release plan must close before beta.1. Beta.1 does not add product
surface or absorb alpha architecture debt; it validates the frozen result
before stable v0.41.0.

## Governance Rules

- ADR-0101 (Product-Line Reset + AutoFlow3 Governance) — current governance baseline.
- ADR-0104 (Architecture Audit + PACKAGE_SURFACE definition).
- ADR-0105 (Cleanup Train Implementation + approval-gated patch releases).
- ADR-0107 (npm-only distribution) is the authority for this release.
- ADR-0110 (Two-Product Doctrine and Package Truth) is the current public
  product doctrine.
- ADR-0111 (OpenElement App Ownership Boundary) is the alpha.6 app/protocol
  ownership boundary.
- ADR-0096 (protocol-first Vite + Nitro runtime) and ADR-0098
  (EntryDescriptor route manifest) remain in force.
- Runtime-free/browser-facing packages must not use `Deno.*` or `node:*` APIs
  in their public source surface, and should prefer native W3C/WHATWG/Web
  Platform APIs before custom wrappers. Build/server glue (`ssg`, `content`,
  `adapter-vite`, `create`) may use Deno/Node APIs, with Deno-first
  implementations preferred when a host API is necessary.
- Package Graph Collapse: reduced from 20 to 11 packages (ADR-0105 cleanup train).
- AutoFlow3 remains the single CI/release gating plane.
- Preact + SignalEngine: default reactive stack is `@preact/signals-core` via `@openelement/signal`.
- Moving package topology in #273 or changing the default signal engine in
  #387 still requires the normal ADR and approved version-plan authority;
  inclusion in alpha.7 is not independent permission for a public reset.
- `docs/current/PACKAGE_SURFACE.md` defines the current 11-package surface.
- `docs/current/STACK_CONTRACT.md` defines the first-party stack roles for
  Vite, Hono, Nitro, Deno Desktop, Open Props, Preact islands, and third-party
  Web Components.
- `docs/current/HYDRATION_CONTRACT.md` defines `@openelement/core/hydrate` as a
  low-level building-block subpath and points higher-level authoring to
  `@openelement/app` and `@openelement/element`.
- `docs/current/DENO_DESKTOP_TARGET.md` defines Deno Desktop as a first-party
  app target and records Reader's regression-grade dogfood evidence.
- Dogfood apps may block release quality only as evidence. They must not define
  OpenElement's public product identity.
- AutoFlow3 and docs-truth gates are infrastructure. They should become more
  reusable over time, but they are not Framework product features.

## Test Matrix

Static gates: `deno task fmt:check`, `deno task lint`, `deno task typecheck`,
`deno task graph:check`, `deno task package-surface:check`,
`deno task repo:hygiene`, `deno task workflow:check`,
`deno task workflow:check-slimming`, `deno task docs:check-public`,
`deno task docs:check-current`, `deno task docs:check-strategy`,
`deno task arch:check`, `deno task signals:check-protocol-boundary`,
`deno task type-safety:check`, `deno task text-integrity:check`,
`deno task deno-api:check`.
Alpha.3 also adds `deno task third-party-wc:smoke` and
`deno task package-artifacts:check`.

Build/test gates: `deno task test`, `deno task test:coverage:check`,
`deno task build`, `deno task test:e2e`, `deno task pack:dry-run`,
`deno task consumer:packaged`, `deno task third-party-wc:smoke`,
`deno task package-artifacts:check`, `deno task autoflow:dev`,
`deno task autoflow:push`, `deno task autoflow:ci`,
`deno task nitro:proof:node`, `deno task nitro:proof:workers`.

## Acceptance

- `deno task deno-api:check` passes.
- Runtime-free/browser-facing package artifacts stay pure ESM, avoid
  host-specific APIs, and use modern Web Platform APIs as the default runtime
  substrate.
- `deno task pack:dry-run` succeeds for all 11 packages.
- `deno task package-artifacts:check` passes for all 11 packed npm artifacts.
- `deno task third-party-wc:smoke` proves Lit, Shoelace, and Material Web
  Components can be consumed directly in an openElement app.
- No `jsr:@openelement/` or `@jsr/openelement__*` specifiers remain in product
  code or generated tarballs.
- GitHub Actions `autoflow-release.yml` successfully publishes to npm with
  provenance.
- npm consumer smoke passes for Node ESM and Deno `npm:`.
- jsDelivr browser-safe export smoke passes.
- Alpha.6 trust-boundary debt is closed or replaced by stricter evidence:
  route codegen literals, island manifest extraction, JSR source URL
  construction, and dynamic import specifier admission.
- Alpha.6 front-half cleanup debt is closed: release behavior, package surface,
  router internals, generated artifacts, resolver maps, tooling helpers, scanner
  test ownership, stale design artifacts, and active-source audit labels.
- Deno toolchain truth is explicit: `.dvmrc` pinned to stable `2.9.0`, CI and
  consumer monitor aligned, canary reserved only for Deno Desktop preview
  features outside the main gate matrix.
- Alpha.7 exit additionally requires all 21 hardening/adoption slices, native
  browser-baseline evidence, production BuildPlan artifacts, app/router-owned
  navigation, risk-weighted critical-path tests, auditable dependencies,
  a clean five-minute npm starter, reproducible performance reports, and the
  external adopter pilot.

## Verification

- `docs/release/v0.41.0.md` summarizing the distribution migration.
- Updated `docs/status/STATUS.md` active line section.
- Updated `docs/roadmap/ROADMAP.md` version ladder and v0.41.0 section.
- CI run evidence showing `deno-api:check` and `pack:dry-run` pass.
