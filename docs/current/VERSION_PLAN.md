# v0.40.8 Version Plan - Cleanup-Train Patch

```text
openElement = Elements + UI + Framework + Protocols
```

## Objective

Execute a cleanup-train patch on the v0.40.7 baseline. This release removes the
legacy Linear UI compatibility surface, migrates the last internal consumer to
the canonical Open Props UI, hardens the E2E server against local port
conflicts, and extends the audit-driven cleanup from explicit `any` to
unnecessary `as unknown as` and non-null assertions. It introduces no new
product feature and makes no default runtime or signal-engine change.

## Context

v0.40.7 hardened the release infrastructure: Deno static E2E server, CI
Playwright browser installation, credential-gated release steps, and local
release escape hatches. The v0.40.8 patch continues the cleanup train
authorized by ADR-0105 and closes the remaining active-code debt identified in
the 2026-06-15 architecture audit and subsequent gate runs.

The immediate blockers are:

- `docs:check-strategy` requires the strategic anchor `openElement = Elements +
  UI + Framework + Protocols` and the current execution line in
  `www/app/routes/guide/getting-started.tsx`.
- `test:e2e` fails locally when a residual Deno server holds `127.0.0.1:4174`.
- The public `@openelement/ui` surface still exports the Linear compatibility
  layer (`open-*-linear`, `linear-token-sheet`) that the product line no longer
  supports.
- Active tests and tools still contain ad-hoc `as unknown as` casts that can be
  replaced with typed helpers.

## Scope

- Restore required strategic anchors in `www/app/routes/guide/getting-started.tsx`
  and record v0.40.8 as the active execution line.
- Adjust E2E server strategy: prefer an isolated port when the default port is
  occupied, and enable `reuseExistingServer` when it is safe to coalesce with an
  already-running local server.
- Remove legacy Linear UI surface from `@openelement/ui`:
  - delete `open-button-linear`, `open-card-linear`, `open-input-linear`,
    `open-nav-linear`, `open-badge-linear`, and `linear-token-sheet` sources;
  - remove their public exports, subpath exports, manifest declarations, and
    smoke/component tests;
  - update UI README and design docs to state there is no Linear compatibility
    layer.
- Migrate `www/app/islands/scroll-reveal.tsx` from `linearTokenSheet` to
  `openPropsTokenSheet`.
- Maintain 0 explicit `any` and reduce obvious unnecessary `as unknown as` and
  non-null assertions in production code, tests, and tools. Replace ad-hoc test
  casts with typed helper/fake DOM interfaces where practical.
- Split or converge the largest redundancy hotspots:
  - extract layout navigation/theme/search helpers from `open-layout.tsx` into
    focused internal modules;
  - extract shared fake DOM/test helpers from
    `packages/ui/__tests__/components.test.ts` so they stop accumulating in a
    single file.
- Extract repeated error formatting and generated runtime `console.*` fragments
  to use existing `error` / `logger` boundaries. Preserve intentional CLI/tool
  console output.
- Bump workspace versions to `0.40.8` and publish the v0.40.8 cleanup record.

## Non-Goals

- No new product feature.
- No package additions or removals (count stays 11).
- No default runtime, signal-engine, or renderer change.
- No git history rewrite.
- No large-scale rewrite of historical ADRs or release notes.

## Governance Rules

- ADR-0101 is the product-line reset and AutoFlow3 authority boundary.
- ADR-0104 defines the `SignalEngine` default policy.
- ADR-0105 approves the v0.40.x breaking cleanup train, including public removal
  of the Linear UI compatibility layer in this patch.
- ADR-0106 approves the audit-driven quality cleanup scope.
- v0.40.8 is a cleanup-train patch under the same v0.40.x authority. It keeps the
  11-package `Package Graph Collapse` documented in
  `docs/current/PACKAGE_SURFACE.md`, retains `Preact` as the only planned
  heavy-framework island target, and changes no default runtime or signal engine.

## Test Matrix

Static gates: `deno task fmt:check`, `deno task lint`, `deno task typecheck`,
`deno task graph:check`, `deno task package-surface:check`,
`deno task repo:hygiene`, `deno task workflow:check`,
`deno task workflow:check-slimming`, `deno task docs:check-public`,
`deno task docs:check-current`, `deno task docs:check-strategy`,
`deno task arch:check`, `deno task signals:check-protocol-boundary`,
`deno task type-safety:check`, `deno task text-integrity:check`.

Build/test gates: `deno task test`, `deno task test:coverage:check`,
`deno task build`, `deno task test:e2e`, `deno task consumer:packaged`,
`deno task autoflow:dev`, `deno task autoflow:push`, `deno task autoflow:ci`,
`deno task nitro:proof:node`, `deno task nitro:proof:workers`.

## Acceptance

- `deno task fmt:check`, `deno task lint`, `deno task typecheck`, and
  `deno task test` pass.
- `deno task graph:check` confirms 11 packages with zero cycles and unified
  versions.
- `deno task package-surface:check` allows the UI public subpath surface
  reduction and confirms no package count change.
- `deno task repo:hygiene`, `deno task workflow:check`, and
  `deno task workflow:check-slimming` pass.
- `deno task docs:check-public`, `deno task docs:check-current`, and
  `deno task docs:check-strategy` pass.
- `deno task arch:check`, `deno task signals:check-protocol-boundary`, and
  `deno task type-safety:check` pass.
- `deno task text-integrity:check` passes.
- `deno task build` and `deno task test:e2e` pass.
- `deno task autoflow:ci` passes.
- Static acceptance scans show no `linearTokenSheet`, `linear-token-sheet`, or
  `open-*-linear` in active source/tests/docs current surface; no explicit `any`
  in active TS/TSX; no unreviewed `as unknown as` hotspots in production.

## Verification

- `docs/release/v0.40.8.md` summarizing the cleanup-train changes.
- Updated `docs/status/STATUS.md` active line section.
- Updated `docs/roadmap/ROADMAP.md` version ladder.
- CI run evidence showing `docs:check-strategy` and `test:e2e` pass.
