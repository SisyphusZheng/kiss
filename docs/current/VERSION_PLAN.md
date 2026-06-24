# v0.41.0 Version Plan - Deno-native npm Distribution + WC Interop

```text
openElement = Elements + UI + Framework + Protocols
```

## Objective

Execute the npm-primary distribution migration using Deno 2.8+ `deno pack`,
harden the signal-DOM architecture, and prove cross-framework Web Components
interoperability. The release is staged through four alphas and one beta:

- **alpha.1** (shipped): npm distribution + audit cleanup.
- **alpha.2**: Signal-DOM deepening (`HydrationScope` to `@openelement/core/hydrate`,
  renderer/activation split, `BindingDescriptor` registry).
- **alpha.3**: Consume Lit/Shoelace/Material Web Components inside openElement;
  pure-ESM / pure-ECMAScript npm quality gates.
- **alpha.4**: Lightweight client runtime so openElement components work in Deno
  Fresh.
- **alpha.5**: SPA mode + desktop shell proof (Tauri 2 / Electron) with a
  client-side router.
- **beta.1**: Stabilization and surface freeze before stable v0.41.0.

## Context

v0.41.0-alpha.1 removed the legacy Linear UI surface, closed the audit-driven
cleanup train, and shipped the first npm/JSR dual-published alpha. The next
strategic blockers are signal-DOM architecture hardening and WC ecosystem
integration.

A previous v0.41.0 line proposed making Vite+ treat Deno as a first-class
package manager. That upstream PR (voidzero-dev/vite-plus#1888) was declined,
so this plan pivots to Deno's own `deno pack` tooling.

## Scope

### Toolchain

- Bump minimum Deno version to 2.8.0 across docs, READMEs, and CI.
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
  `Deno.*`.

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
- Add third-party WC smoke for Shoelace and Material Web Components.
- Add Fresh example smoke for openElement component hydration.

## Non-Goals

- No Node runtime migration for openElement development.
- No npm/pnpm/yarn workspace source of truth.
- No further upstream Vite+ Deno PM advocacy in this release.
- No removal of existing JSR published versions.
- No server/data/forms/session/cache primitives (deferred to v0.42.0+).

## Staged Alpha/Beta Plans

The active work is tracked in per-alpha plan files:

- `docs/release/v0.41.0-alpha.2-plan.md` — Signal-DOM Deepening
- `docs/release/v0.41.0-alpha.3-plan.md` — Cross-Framework Web Components Integration
- `docs/release/v0.41.0-alpha.4-plan.md` — openElement Components in Fresh
- `docs/release/v0.41.0-alpha.5-plan.md` — SPA Mode + Desktop Shell Proof

The stabilization phase will be recorded in `docs/release/v0.41.0-beta.1-plan.md`
when alpha.5 is complete.

## Governance Rules

- ADR-0101 (Product-Line Reset + AutoFlow3 Governance) — current governance baseline.
- ADR-0104 (Architecture Audit + PACKAGE_SURFACE definition).
- ADR-0105 (Cleanup Train Implementation + approval-gated patch releases).
- ADR-0107 (npm-only distribution) is the authority for this release.
- ADR-0096 (protocol-first Vite + Nitro runtime) and ADR-0098
  (EntryDescriptor route manifest) remain in force.
- Runtime-free/browser-facing packages must not use `Deno.*` or `node:*` APIs
  in their public source surface. Build/server glue (`ssg`, `content`,
  `adapter-vite`, `create`) may use Deno/Node APIs.
- Package Graph Collapse: reduced from 20 to 11 packages (ADR-0105 cleanup train).
- AutoFlow3 remains the single CI/release gating plane.
- Preact + SignalEngine: default reactive stack is `@preact/signals-core` via `@openelement/signal`.
- `docs/current/PACKAGE_SURFACE.md` defines the v0.41.0-alpha.1 11-package surface.

## Test Matrix

Static gates: `deno task fmt:check`, `deno task lint`, `deno task typecheck`,
`deno task graph:check`, `deno task package-surface:check`,
`deno task repo:hygiene`, `deno task workflow:check`,
`deno task workflow:check-slimming`, `deno task docs:check-public`,
`deno task docs:check-current`, `deno task docs:check-strategy`,
`deno task arch:check`, `deno task signals:check-protocol-boundary`,
`deno task type-safety:check`, `deno task text-integrity:check`,
`deno task deno-api:check`.

Build/test gates: `deno task test`, `deno task test:coverage:check`,
`deno task build`, `deno task test:e2e`, `deno task pack:dry-run`,
`deno task consumer:packaged`, `deno task autoflow:dev`,
`deno task autoflow:push`, `deno task autoflow:ci`,
`deno task nitro:proof:node`, `deno task nitro:proof:workers`.

## Acceptance

- `deno task deno-api:check` passes.
- `deno task pack:dry-run` succeeds for all 11 packages.
- No `jsr:@openelement/` or `@jsr/openelement__*` specifiers remain in product
  code or generated tarballs.
- GitHub Actions `autoflow-release.yml` successfully publishes to npm with
  provenance.
- npm consumer smoke passes for Node ESM and Deno `npm:`.
- jsDelivr browser-safe export smoke passes.

## Verification

- `docs/release/v0.41.0.md` summarizing the distribution migration.
- Updated `docs/status/STATUS.md` active line section.
- Updated `docs/roadmap/ROADMAP.md` version ladder and v0.41.0 section.
- CI run evidence showing `deno-api:check` and `pack:dry-run` pass.
