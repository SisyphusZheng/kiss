# v0.40.5 Version Plan - Audit-Driven Quality Cleanup

## Objective

Close the internal quality gaps identified by the 2026-06-15 architecture audit
(`docs/audit/2026-06-15-architecture-audit.md`) without changing the v0.40.4
public product surface or package graph.

This release is executed under the v0.40.x cleanup-train authority defined in
ADR-0105 and recorded in ADR-0106.

## Context

v0.40.5 continues the product line established by v0.40.4:

```text
openElement = Elements + UI + Framework + Protocols
```

The current 11-package graph is documented in `docs/current/PACKAGE_SURFACE.md`.
v0.40.4 completed the Package Graph Collapse To 11, the Preact island proof, the
SignalEngine default switch under ADR-0104, and release hardening. v0.40.5 does
not revisit those decisions; it only cleans up the internal quality gaps that
the audit exposed.

## Scope

- Publish the architecture audit report as a docs artifact.
- Add tests to `element` and `ui` to close the most critical coverage gaps.
- Split over-large source files into smaller internal modules.
- Unify error formatting and error handling.
- Reduce unsafe non-null assertions and type assertions at SSR/DSD boundaries.
- Remove historical `less` / `LessJS` naming debt.
- Simplify `adapter-vite` internals without changing the public Vite plugin API.
- Clean up ad-hoc `console.*` usage.

## Non-Goals

- No public API changes.
- No package additions or removals.
- No default runtime / signal-engine / renderer changes.
- No new product features (forms, mutations, sessions, auth, database recipes).

## Governance Rules

- ADR-0101 is the product-line reset and AutoFlow3 authority boundary.
- ADR-0105 approves the v0.40.x breaking cleanup train.
- ADR-0106 approves the audit-driven quality cleanup scope for v0.40.5.
- AutoFlow3 patch automation must refuse v0.40.5 execution unless the release
  state references the approved plan id `ADR-0105/v0.40.x-cleanup-train` or
  `ADR-0105+ADR-0106/v0.40.5-audit-cleanup`.

## Workstreams

### v0.40.5 - Audit Documentation

- [x] Add `docs/audit/2026-06-15-architecture-audit.md`.
- [x] Reference the audit and ADR-0106 in `docs/status/STATUS.md`.
- [x] Archive the v0.40.4 plan to `docs/release/v0.40.4-plan.md`.

### v0.40.5 - Element Test Hardening

- [x] Add unit tests for `OpenElement` lifecycle, DSD/CSR switching, signal
      hydration, prop reflection, and error boundaries.
- [x] Achieve `element` test/source ratio ≥ 0.7:1 (22 tests, ~1188 lines of
      tests vs ~1648 lines of source).

### v0.40.5 - UI Component Tests

- [x] Add rendering and interaction tests for each `open-*` component.
- [x] Add missing `open-dropdown`, `open-modal`, and `open-tabs` entries to
      `packages/ui/src/manifest.ts`.
- [x] Achieve `ui` test/source ratio ≥ 0.25:1 (67 tests, ~1264 lines of tests
      vs ~4544 lines of source).

### v0.40.5 - File Size Reduction

- [x] Split `packages/ssg/src/route-scanner.ts` into
      `route-scanner-ast.ts` + `route-scanner-fs.ts` + orchestrator
      (`route-scanner.ts` reduced from ~795 to ~555 lines).
- [x] Split `packages/element/src/open-element.ts` into
      `open-element-render.ts` + `open-element-hydration.ts` + base class
      (`open-element.ts` reduced from ~719 to ~602 lines).
- [x] Extract alias normalization and build constants from
      `packages/adapter-vite/src/cli/build-ssg.ts` into `alias-utils.ts` and
      `build-constants.ts` (`build-ssg.ts` reduced from ~526 to ~492 lines).
- [x] Ensure all public exports remain unchanged.

### v0.40.5 - Error Handling Unification

- [x] Introduce a shared `formatError(e: unknown): string` utility in
      `packages/core/src/errors.ts`.
- [x] Replace all `e instanceof Error ? e.message : String(e)` patterns across
      packages.
- [x] Convert remaining bare `throw new Error(...)` calls in the touched files
      to framework error types where appropriate.

### v0.40.5 - Runtime Assertion Cleanup

- [x] Replace `shadowRoot!` assertions in `element/src/open-element.ts` with a
      local `root` variable guarded by an early return.
- [x] Add runtime guards for RegExp match indices in `ssg/src/postprocess.ts`.
- [x] Add runtime guard for `openElement.module` in
      `ssg/src/entry-descriptor.ts` and remove the non-null assertion chain.

### v0.40.5 - Naming Debt Cleanup

- [x] Verify no `less:` virtual module prefixes remain in active source.
- [x] Verify no `lessjs` / `LessJS` references remain in active source comments
      or identifiers (only the architecture-contract checker retains the
      legacy-name detection regex by design).

### v0.40.5 - Adapter-Vite Simplification

- [x] Move alias normalization into `packages/adapter-vite/src/alias-utils.ts`.
- [x] Move build constants into `packages/adapter-vite/src/build-constants.ts`.
- [x] Replace hardcoded fallback version `'0.35.1'` and `chunkSizeWarningLimit`
      with named constants.
- [x] Move the HTML sanitizer specifier into a shared constant.
- [x] No change to the public Vite plugin API.

### v0.40.5 - Logging Cleanup

- [x] Replace `console.*` calls in `router/src/client-router.ts`,
      `adapter-vite/src/cli/build.ts`, `create/cli.ts`,
      `ui/src/open-layout.tsx`, and `ui/src/open-code-block.tsx` with
      `OpenElementLogger`.
- [x] Document intentional exceptions: generated runtime code in
      `ssg/src/entry-render-helpers.ts` and `ssg/src/entry-generators.ts`
      remains self-contained; `signal/src/engine.ts` keeps a minimal console
      logger to avoid a core dependency in the signal foundation.

## Acceptance

- All v0.40.4 release gates still pass.
- `element` test/source ratio is ≥ 0.7:1.
- `ui` test/source ratio is ≥ 0.25:1.
- `deno task type-safety:check` reports 0 explicit `any`.
- `deno task graph:check` shows no package additions, removals, or cycles.
- `deno task package-surface:check` confirms no public surface changes.
- `deno task docs:check-current` passes with the new audit doc and ADR-0106
  referenced.
- `deno task workflow:check` and `deno task workflow:check-slimming` pass.
- `deno task arch:check` passes.
- `deno task test` passes with no regressions.
- `deno task consumer:local` and `deno task consumer:packaged` pass.

## Test Matrix

```bash
deno task fmt:check
deno task lint
deno task typecheck
deno task test
deno task test:coverage:check
deno task build
deno task graph:check
deno task arch:check
deno task repo:hygiene
deno task workflow:check
deno task workflow:check-slimming
deno task docs:check-public
deno task docs:check-current
deno task docs:check-strategy
deno task package-surface:check
deno task signals:check-protocol-boundary
deno task type-safety:check
deno task autoflow:test
deno task autoflow:push
deno task autoflow:ci
deno task nitro:proof:node
deno task nitro:proof:workers
deno task consumer:local
deno task consumer:packaged
deno task publish:dry-run
```

## Release Evidence

- `docs/release/v0.40.5.md` summarizing audit-driven changes.
- Updated `docs/status/STATUS.md` active line section.
- JSR publish dry-run and post-publish consumer smoke evidence.
