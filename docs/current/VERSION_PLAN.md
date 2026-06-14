# v0.40.2 Version Plan - Product-Line Cleanup

## Objective

Make `dev` the focused v0.40 product-line branch and collapse the repository to
the product shape:

```text
openElement = Elements + UI + Framework + Protocols
```

The current local package line is `v0.40.2`. All cleanup-train work is
consolidated into the v0.40.2 release. The cleanup was manually approved as a
breaking train under ADR-0105 with approval id
`ADR-0105/v0.40.x-cleanup-train`; it is not executed as normal AutoFlow patch
automation.

## Scope

- Keep an 11-package current graph documented in `docs/current/PACKAGE_SURFACE.md`.
- Promote `@openelement/element` into the canonical component-authoring facade.
- Remove standalone `@openelement/runtime`, `@openelement/style-sheet`, and
  `@openelement/i18n` from the current package graph.
- Move `StyleSheet` into `@openelement/core/style-sheet` and re-export it from
  `@openelement/element`.
- Retain `@openelement/ssg` as the adapter-agnostic SSG build engine.
- Keep Preact island support as optional `@openelement/app/preact`.
- Switch default signal engine to `@preact/signals-core`; keep
  `alien-signals` as an optional engine via `@openelement/signal/alien-engine`.
- Keep AutoFlow3 as the single workflow/gate/evidence control plane.
- Keep active docs to current truth, ADR, roadmap/status, release evidence, and
  archive index.
- Rename public packages to singular: `@openelement/element`,
  `@openelement/protocol`, `@openelement/signal`.
- Enforce 0 explicit `any` in active TS/TSX through `type-safety:check`.
- Remove AutoFlow2 historical implementations and retain only AutoFlow3 control
  plane (`mod3.ts`, `policy.ts`, `release.ts`, and policy tests).

## Governance Rules

- ADR-0101 is the product-line reset and AutoFlow3 authority boundary.
- ADR-0104 keeps signal-engine changes behind protocol conformance.
- ADR-0105 approves the v0.40.x breaking cleanup train.
- AutoFlow3 patch automation must refuse v0.40.x cleanup-train release execution
  unless the approved plan id is present.
- Minor/major scope, public API, package topology, default runtime, default
  signal engine, release policy, security, auth, and database ownership changes
  still require human-approved ADR or version-plan evidence.

## Workstreams

All workstreams are complete in v0.40.2.

### v0.40.2 - Governance And Repo Hygiene

- [x] Add v0.40.x cleanup-train governance.
- [x] Make pre-push run `autoflow:push` on all branches.
- [x] Make `autoflow:push` select `arch:check` for package/tool/hook/config changes.
- [x] Delete tracked root `bench/`.
- [x] Add repo hygiene checks for removed package names and tracked generated root artifacts.
- [x] Remove SOP/NextVersion language from `.github` issue/PR/agent templates.
- [x] Remove historical `docs/mockups/` and `docs/conversation/` from `deno.json` excludes.

### v0.40.2 - Package Graph Collapse To 11

- [x] Remove standalone `@openelement/style-sheet`.
- [x] Move `StyleSheet` into `@openelement/core/style-sheet`.
- [x] Promote `@openelement/element` as the authoring facade.
- [x] Remove standalone `@openelement/runtime`.
- [x] Extract SSG engine into `@openelement/ssg` as adapter-agnostic build engine; `adapter-vite` delegates SSG orchestration.
- [x] Remove standalone `@openelement/i18n`; current i18n support lives under `@openelement/app/i18n`.
- [x] Update workspace, import map, release order, package count (11), publish order, and checks.
- [x] Rename public packages and directories to singular: `element`, `protocol`, `signal`.

### v0.40.2 - Preact Island Proof

- [x] Add optional `@openelement/app/preact`.
- [x] Record island metadata and hydration strategies through the existing island protocol.
- [x] Prove DSD opt-out metadata.
- [x] Browser-level client upgrade proof is deferred to a future release-candidate gate.

### v0.40.2 - Signal Candidate And Code Clean

- [x] Switch default signal engine from `alien-signals` to `@preact/signals-core`. `alien-signals` remains available as optional engine via `@openelement/signal/alien-engine` and runtime `setSignalEngine()`.
- [x] Add optional `@openelement/signal/preact-engine`.
- [x] Run shared SignalEngine conformance across alien and Preact engines.
- [x] Guard that core and elements do not require `@preact/signals-core`.
- [x] Enforce 0 explicit `any` in active code, tests, tools, and www active code.
- [x] Clean mojibake in active source/tools as gates expose it.

### v0.40.2 - Release Hardening

- [x] Add package graph and repo hygiene checks for the 11-package target.
- [x] Add hook-policy coverage proving package/tool/hook changes trigger `arch:check`.
- [x] Run full release dry-run and JSR publish dry-run in release order.
- [x] Prepare release evidence for the cleanup train.
- [x] Add `type-safety:check` gate to AutoFlow3 push/ci/release tiers.
- [x] Publish closure still requires JSR package truth and post-publish smoke evidence.

### v0.40.2 - Post-Cleanup Truth Audit Follow-Up

The 2026-06-15 repo read-through found that the implementation was ahead of the
planning layer. The follow-up is now part of v0.40.2 closure:

- [x] Reconcile ADR-0105 with the actual v0.40.2 package graph:
      `@openelement/ssg` is retained as the adapter-agnostic SSG engine,
      `@openelement/i18n` is removed from the workspace and moved under
      `@openelement/app/i18n`, and `@preact/signals-core` is the default signal
      engine after ADR-0104.
- [x] Remove the SSG contradiction in this plan: current truth is retained
      `@openelement/ssg`, removed standalone runtime/style-sheet/i18n.
- [x] Update `docs/current/PACKAGE_SURFACE.md` so the `@openelement/signal`
      row matches ADR-0104 and implementation truth: default
      `@preact/signals-core`, optional `alien-signals` engine.
- [x] Update README and README.zh package wording to use the singular package
      names and the real support-package set: `core`, `adapter-vite`, `signal`,
      `router`, `content`, and `ssg`; remove stale `i18n` and standalone-SSG
      removal wording.
- [x] Rewrite current website architecture pages so they describe the
      11-package v0.40 graph instead of the historical 20-package graph.
- [x] Clean mojibake in active current-truth docs and current website routes.
      Historical release evidence may keep original text unless it is rendered
      as current truth.
- [x] Add a text-integrity gate that catches mojibake and stale current-product
      vocabulary in active source/docs/www routes.
- [x] Remove local audit-tool residue: untracked `.github/workflows/opencode.yml`,
      root `ocr.exe`, empty `packages/i18n/`, and empty `fixtures/`.
- [x] Keep `workflow:check-slimming` strict and let repo hygiene reject local
      root/workflow residue before CI-like gates run.
- [x] Add docs-truth coverage for package graph, retained/removed packages, and
      signal-engine default.

## Acceptance

- The workspace has exactly 11 current packages.
- `graph:check`, `package-surface:check`, and release order agree on the same
  11-package graph.
- Active workflows are at most 4 and all CI gate orchestration enters through
  AutoFlow3.
- Root has no tracked generated artifacts or tracked `bench/`.
- Active code does not import removed packages.
- Preact remains optional and does not enter `core` or `element` as a required
  dependency.
- `nitro:proof:node` and `nitro:proof:workers` still pass.
- Release evidence records package removals and the cleanup-train approval
  before v0.40.2 closure.
- No explicit `any` in active TS/TSX code, tests, tools, or www active code.

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
deno task consumer:core-smoke
deno task publish:dry-run
```
