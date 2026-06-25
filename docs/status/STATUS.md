# openElement Project Status

> AI assistant: read this file first on every session start.

Mandatory workflow: `docs/governance/PROJECT_WORKFLOW.md`. Active version plan:
`docs/current/VERSION_PLAN.md`.

## Current Version Line: v0.41.0-alpha.4 Active (Cross-Framework WC Integration)

v0.41.0-alpha.4 is the active package line. It follows the v0.41.0-alpha.1
npm-only distribution pivot and focuses on narrowing the signal-to-DOM binding
seam: extracting `HydrationScope` to `@openelement/core/hydrate`, splitting the
renderer from the activation layer, replacing the central `BindingDescriptor`
switch with a registry of small binding factories, validating the
`static`/`hydrate`/`csr` subpath split with at least one real static-only
consumer, and resolving the Safari adoptedStyleSheets theme-color follow-up.
Runtime-free packages (`core`, `element`, `ui`, `protocol`, `signal`, `router`,
`app`) retain zero `Deno.*` and zero `node:*` usage; build/server glue (`ssg`,
`content`, `adapter-vite`, `create`) owns the necessary runtime-specific code.
The release introduces no new product feature and makes no default runtime,
signal-engine, or package-topology change.

v0.41.0 is executed under ADR-0108 and the active version plan in
`docs/current/VERSION_PLAN.md`. AutoFlow3 is the workflow, gate, evidence, and
release-state control plane, but it cannot decide minor/major product scope,
public API, package topology, default runtime, default signal engine,
security/auth/database ownership, or release policy without human ADR or
approved version-plan evidence.

## v0.41.0-alpha.4 PR State: CI Green, Awaiting Release Closure

v0.41.0-alpha.4 proves the inverse of alpha.3: Fresh 2.3+ hosts openElement custom elements with Preact islands: openElement components can be
consumed inside a third-party framework, starting with Deno Fresh. PR #113 is
green on `dev` with both AutoFlow CI jobs, CodeQL/Analyze jobs, Cloudflare Pages
preview, and review bot passing at commit `06b21d37`. The release is not closed
until the PR is merged to `main`, `main` CI passes, and the approved release
workflow records npm publish plus post-publish npm consumer smoke evidence.

Remaining alpha.4 follow-up is release-process evidence, not runtime scope. The
next implementation version remains v0.41.0-alpha.5: SPA mode + Deno Desktop
shell proof, with React/Vue/Svelte adapters deferred unless needed to validate
SPA disposal semantics.

## Prior Version Line: v0.40.6 Released (Audit-Driven Quality Cleanup)

v0.40.6 is released as the audit-driven quality cleanup release. It addresses
the findings from the 2026-06-15 architecture audit
(`docs/audit/2026-06-15-architecture-audit.md`) without changing the v0.40.4
public product surface or package graph. The release adds test hardening for
`element` and `ui`, splits over-large source files, unifies error handling,
cleans up runtime assertions, and simplifies `adapter-vite` internals. It is
recorded in ADR-0106 and executed under the v0.40.x cleanup-train authority
from ADR-0105.

Public package names are singular: `@openelement/element`,
`@openelement/protocol`, and `@openelement/signal`. Active code, tests, tools,
and www active code enforce 0 explicit `any` through the `type-safety:check`
gate.

The signal engine is `@preact/signals-core`.

ADR-0101 is the governance boundary for this line. ADR-0105 approves the
v0.40.4 breaking cleanup train consolidated into the v0.40.4 release.

Local v0.41.0 release-readiness evidence passes: `fmt:check`, `lint`, `typecheck`, `test`,
`build`, `graph:check`, `arch:check`, `repo:hygiene`, `workflow:check`,
`workflow:check-slimming`, `docs:check-public`, `docs:check-current`,
`docs:check-strategy`, `package-surface:check`,
`signals:check-protocol-boundary`, `type-safety:check`, `autoflow:push`,
`autoflow:ci`, `nitro:proof:node`, `nitro:proof:workers`, `consumer:local`,
`consumer:core-smoke`, `deno-api:check`, `pack:dry-run`, and `publish:npm:dry-run`.
Distribution closure is completed by the `main` branch `Publish to npm` workflow,
which packs and publishes the 11-package line with provenance and runs the
post-publish npm consumer smoke.

v0.41.0 repository cleanup (2026-06-21, 1068 tests / 0 failed):

- Round 1: Deleted dead files (validators, file-isr-cache, engine, content barrels, ~530 lines). Removed dead exports (LogLevel, renderSequential/Parallel). Shrink/stdlib fixes (hoisted conditionKeys, unified renderSsrError, extname→path.extname, warnOnce helper).
- Round 2: Deleted createDefaultEngine, _textEncoder, data.ts barrel, use-loader-data.ts barrel, hasControlCharacter, joinUrlPath, section-matter dep, stale file-isr-cache export. Inlined renderEndTimeFallback/now/escapeRoutePath. Converted codeForRenderError to lookup table. Merged switch fallthrough. Annotated speculative errors.
- Round 3: Deleted router dead files (client-router, page-loader, ssr-data-stubs, define-routes, pattern-translate, locale-path, ~500 lines). Removed marked dep from router. Converted cem-compat/entry-descriptor/route-scanner switches to lookup tables. Extracted safeNow() for performance.now() fallback. Unified 404 rendering blocks. (useActionData/useLoaderData preserved — used by www.)

## v0.41.0-alpha.1 Architecture Audit

### 🔴 CRITICAL — ✅ Resolved (Phase 1, 2026-06-21)

- ~~Broken `protocol/validators` subpath~~ → removed from `protocol/deno.json`
- ~~Vite string leaked into `core`~~ → `wrapInDocument()` now accepts generic `devScripts`; `/@vite/client` moved to engine layer
- ~~Protocol types imported from `core`, not `protocol`~~ → `HydrationStrategy`/`ComponentLayer`/`HydrationHint`/`RenderError` now routed via `@openelement/protocol/renderer` (8+ locations)

### 🟠 HIGH — ✅ Resolved (Phase 2, 2026-06-21)

- ~~Core types missing from protocol~~ → created `protocol/src/build-types.ts` with `FrameworkOptions`/`RouteEntry`/`OpenElementPackageManifest`/`IsrManifestEntry`/`CompatibilityClassification`; core re-exports from protocol
- ~~Deep subpath bypass: `createLogger`~~ → added `protocol/logger`, 23 files updated
- ~~Deep subpath bypass: `formatError`~~ → added `protocol/errors`, 18 files updated

### 🟡 MEDIUM — ✅ Annotated (Phase 3, 2026-06-21)

- `wrapInDocument` params cleaned via Phase 1
- `app/vite.ts` + `app/i18n-plugin.ts` annotated
- `content/deno.json` annotated
- Unused protocol surface annotated with `ponytail:` comments

### ✅ Verification (2026-06-21)

- `core`/`element`/`ui`/`signal` — 66 files, zero violations
- `router` + `app` runtime — 7 files clean, 2 build-time (acceptable)
- `protocol` — zero Vite/Nitro/signal-engine imports

---

## v0.41.0-alpha.1 — Remaining Tasks

Full byte-level audit (66 core + 7 app + 58 engine + 30 tools = 161 files) complete. Open items below.

### 🟠 Engine Protocol Import Migration (14 locations, ~30 lines)

Types that exist in `protocol/build-types` but are still imported from `@openelement/core`:

| Package        | Files                                                                                                                                                          | Types still from core                                                                         |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `adapter-vite` | `build.ts`, `plugin.ts`, `head-injection.ts`, `build-pipeline.ts`, `build-context.ts`, `cli/build-ssg.ts`                                                      | `FrameworkOptions`, `OpenElementPackageManifest`, `RouteEntry`, `CompatibilityClassification` |
| `ssg`          | `entry-renderer.ts`, `ssg-helpers.ts`, `ssg-render.ts`, `route-type-generator.ts`, `entry-descriptor.ts`, `ssg-report.ts`, `route-scanner.ts`, `cem-compat.ts` | Same + `IsrManifestEntry`                                                                     |

### 🟡 Protocol Coverage Gaps (6 types + 5 runtime fns)

Types defined ONLY in `core` that engine packages need — should be added to protocol:

| Type                          | Defined In               | Needed By                                      |
| ----------------------------- | ------------------------ | ---------------------------------------------- |
| `SsrAdmissionDecision`        | `core/render-schemas.ts` | `ssg/entry-descriptor.ts`, `ssg/ssg-render.ts` |
| `CemCompatibilityReport`      | `core/render-schemas.ts` | `ssg/ssg-report.ts`                            |
| `DsdBuildReport`              | `core/render-schemas.ts` | `ssg/ssg-report.ts`                            |
| `DsdHydrationStrategySummary` | `core/render-schemas.ts` | `ssg/ssg-report.ts`                            |
| `ManifestDecision`            | `core/render-schemas.ts` | `ssg/ssg-report.ts`                            |
| `SpecialFileType`             | `core/schemas.ts`        | `ssg/route-scanner.ts`                         |

Runtime functions that need protocol re-exports:

| Function                | From                    | Used By                                      |
| ----------------------- | ----------------------- | -------------------------------------------- |
| `escapeAttr`            | `core/html-escape`      | `adapter-vite/head-injection`, `ssg/ssg-pwa` |
| `isValidTagName`        | `core/tag-utils`        | `ssg/cem-compat`                             |
| `createIsrCacheKey`     | `core/isr`              | `ssg/ssg-helpers`                            |
| `transformIslandSource` | `core/island-transform` | `adapter-vite/island-transform`              |
| `StyleSheet`            | `core/style-sheet`      | `ssg/ssr-polyfills`                          |

### 🟢 Dead Dependencies & Tools (3 deps + 4 import-map + 2 tools)

| Category                | Detail                                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Dead npm deps           | `hono` in `adapter-vite/deno.json`, `hono` in `ssg/deno.json`, `typescript` in `adapter-vite/deno.json`                  |
| Stale import-map (root) | `flexsearch`, `sanitize-html`, `@types/sanitize-html`, `@types/node` — zero .ts imports                                  |
| Broken tool             | `tools/verify-package-configs.ts` — stale `deno.land` URL + references deleted `i18n` package                            |
| API leak                | `adapter-vite/build-pipeline.ts` re-exports `FrameworkOptions` from `@openelement/core` — should re-export from protocol |

## Prior Version Line: v0.39.0 (Framework RC + Four-Product Matrix Reset)

v0.39.0 is released. It proved generated starter behavior from
`@openelement/create`, pages/layouts/islands/API routes/static output, assets,
SSR/ISR intent, and Nitro runtime behavior through `consumer:local`, aligned
docs/templates with the four-product matrix, excluded Web Awesome from the
current target, and recorded Preact as the v0.40 heavy-framework island
priority. JSR publish evidence passed in `Publish to JSR` run `27425438225`.
The old v0.39 architecture state is frozen on `arch/v0.39-line`; `dev` is the
product-line reset branch.

## Prior Version Line: v0.38.0 (Product Surface Reset)

v0.38.0 is released. Tag `v0.38.0` and the GitHub release exist at commit
`e729bee4`. All 20 `@openelement/*` workspace packages are aligned to
`0.38.0`. Local implementation and post-bump release gates passed; `dev` and
`main` non-JSR CI passed before tag/release. Local JSR publish evidence ran
after release and confirmed all 20 package versions already existed on JSR, so
the publish task skipped immutable versions successfully.

v0.38.0 turned the v0.37.x protocol and Nitro evidence into a documented public
product/package surface. It recorded a package/subpath inventory,
product-surface classification, and product map under `docs/next/v0.38.0/`.
The product map retains existing package names, classifies Hub as archived for
the v1 public product map, and moves internal build/tooling packages out of
first-run documentation. Root README, README.zh,
`docs/arch/current-architecture.md`, package READMEs, website guide/API pages,
and `@openelement/create` templates now separate product, advanced, internal,
and archived surfaces. Migration notes record the starter import-map change,
archived RPC status, and internal SSG status.

## Prior Version Line: v0.37.6 (Vite + Nitro Runtime Proof)

v0.37.6 is released. Tag `v0.37.6` and the GitHub release exist at commit
`19d77dee`. All 20 `@openelement/*` workspace packages are aligned to
`0.37.6`. The implementation exposes the openElement universal request handler
from the generated route pipeline, keeps the Nitro boundary in
`@openelement/adapter-vite`, and proves that boundary through a real Nitro
fixture under `fixtures/nitro-proof/`.

Local evidence: `deno task nitro:proof:node` builds Nitro `node-server` output
and verifies the mounted openElement Web `Response`, public asset serving,
route/render behavior, explicit island minimality, static zero-JS output, API
routes, and Nitro-owned cache-control for `/isr`. `deno task
nitro:proof:workers` builds Nitro `cloudflare-module` output and verifies the
generated Workers server entry, wrangler config, public asset, openElement
route/render markers, and route-rule cache markers. Local, `dev`, and `main`
non-JSR release gates passed. JSR publish ran locally and in CI under the
ADR-0097-era distribution policy.

## Prior Version Line: v0.37.5 (Protocol-First Runtime Architecture)

v0.37.5 is released. Tag `v0.37.5` and the GitHub release exist at commit
`e1016ec0`. All 20 `@openelement/*` workspace packages are aligned to
`0.37.5`, `ACTIVE_VERSION` points at `v0.37.5`, and local release gates passed
for workflow, graph, architecture, docs, format, lint, typecheck, test, build,
and publish dry-run. v0.37.5 establishes `@openelement/protocol` as the
replacement boundary for renderer, component, runtime, route, island, cache,
signal, and data contracts while positioning Vite + Nitro as the default base
engine for the v0.37.6 runtime proof.

ADR-0097 changed the release policy for that historical line: JSR package
visibility was no longer a version-exit gate, and registry health became a
release-note caveat.

## Prior Version Line: v0.37.4 (Hygiene + Pure CSS UI + Architecture Decoupling) - JSR Distribution Caveat

v0.37.4 implementation is complete. All 20 `@openelement/*` workspace packages
were aligned to `0.37.4`, tag `v0.37.4` exists, and the GitHub release exists.

Live registry state on 2026-06-11: `@openelement/rpc`,
`@openelement/protocol`, and `@openelement/router` are visible on JSR at
`0.37.4`; publish recovery has progressed to 15/20 packages. The first recovery
patch failed because a 5-minute per-package timeout interrupted
`@openelement/style-sheet` before JSR accepted the immutable version; the next
attempt proved the 20-minute window still fails for slower packages such as
`@openelement/content`. The current recovery patch uses a 45-minute package
window, keeps provenance enabled, polls live JSR version metadata during
`deno publish`, stops the hung publish process after the immutable version
becomes visible, extends the publish job to 360 minutes for the recovery path,
and makes post-publish consumer smoke wait for package-level `meta.json`
propagation before invoking a fresh `jsr:@openelement/create@0.37.4` consumer.

Follow-up registry check on 2026-06-12 with
`deno info --no-config jsr:@openelement/<pkg>@0.37.4` only resolved `rpc`,
`protocols`, `router`, `runtime`, and `cem`; key dependencies such as
`style-sheet`, `signals`, and `core` still failed package-level resolver
visibility. Treat 2026-06-11 registry counts as a historical recovery snapshot,
not release closure.

v0.37.4 delivered the 2026-06-10 audit hygiene fixes, ADR-0094 Core Type
Consolidation, adapter-vite deprecated shell removal, SSG ownership cleanup,
dsd-hydration helper deduplication, UI/router decoupling, a daisyUI-inspired
pure CSS foundation, three DsdElement interactive thin-shell proofs
(`open-dropdown`, `open-modal`, `open-tabs`), and test supplementation. Local
evidence recorded for the release: 1600 tests passed before publish recovery.

v0.37.3 (Data / Database Boundary) is done as a validation-train stop:
ADR-0095 accepted and implemented with MemoryDataAdapter baseline,
FileDataAdapter deferred to recipe, and the 2026-06-10 JSR publish hotfix
closed for the prior package line. v0.37.4 JSR distribution remains externally
unhealthy, but ADR-0097 prevents that external state from blocking roadmap
execution.

The active implementation line is now v0.41.0. It proceeds from the v0.40.4
product-line cleanup release and focuses on replacing JSR distribution with
npm artifacts, Deno `deno pack`, and trusted npm publishing.

Governing docs:

- `docs/current/VERSION_PLAN.md`
- `docs/current/PACKAGE_SURFACE.md`
- `docs/audit/2026-06-15-architecture-audit.md`
- `docs/roadmap/ROADMAP.md`
- `docs/archive/README.md`
- `docs/release/v0.40.4-product-line-cleanup.md`
- `docs/release/v0.40.4-plan.md`
- `docs/adr/ADR-0091-four-product-platform-roadmap.md`
- `docs/adr/ADR-0092-dsdelement-render-mode.md`
- `docs/adr/ADR-0093-ssr-isr-runtime-contract.md`
- `docs/adr/ADR-0095-data-database-boundary.md`
- `docs/adr/ADR-0096-protocol-first-vite-nitro-runtime.md`
- `docs/adr/ADR-0097-jsr-best-effort-release-gate.md`
- `docs/adr/ADR-0098-entry-descriptor-route-manifest-contract.md`
- `docs/adr/ADR-0099-four-product-matrix-and-elements-reset.md`
- `docs/adr/ADR-0100-jsr-publish-exit-gate-restored.md`
- `docs/adr/ADR-0101-product-line-reset-autoflow3-governance.md`
- `docs/adr/ADR-0105-v040x-cleanup-train-exception.md`
- `docs/adr/ADR-0106-audit-driven-quality-cleanup.md`
- `docs/governance/BRANCHING.md`

v0.36.4 Status: **IMPLEMENTED.** It closed the Firefox/WebKit cross-browser
proof line, documented remaining browser-specific limitations, added the
cross-browser E2E gate, and bumped all 20 packages to 0.36.4.

v0.36.5 Status: **IMPLEMENTED.** It closed release-truth and AutoFlow drift
without product-code changes or package version bumps.

v0.37.0 Status: **IMPLEMENTED.** It reset the roadmap, SOP, ADR, NextVersion,
status, and website truth around the four-product validation train without
product-code changes.

v0.36.3 Status: **IMPLEMENTED.** It completed SSG file ownership migration so
`@openelement/ssg` owns route scanning, entry generation, generated data
resolution, SSG Vite plugin logic, render, and postprocess code. `adapter-vite`
is now Vite build orchestration glue.

v0.36.2 Status: **IMPLEMENTED.** It moved Vite-free SSG render and HTML
postprocess helpers into `@openelement/ssg`, while keeping adapter-vite as the
Vite shell for the remaining bridge work.

v0.36.1 Status: **IMPLEMENTED.** It closed the v0.36 release truth and AutoFlow
evidence gap with `cell-v0.36.1-001`, non-zero metrics, Windows-safe generated
test paths, and aligned v0.36.0 deferrals.

v0.36.0 Status: **IMPLEMENTED WITH DEFERRED ITEMS.** Delivered signals docs,
deployment docs, version sync, error-boundary retry/degraded fallback coverage,
FileIsrCache, `@openelement/ssg` Phase 1, parallel SSG evidence, and AutoFlow
built-in cell generation.

## Next Targets

| Version | Theme                                              | Status              | Purpose                                                                                                                                                 |
| ------- | -------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| v0.31.0 | JSX-first Application API                          | Done                | App authoring API, `/vite` config split, docs/template DX                                                                                               |
| v0.32.0 | App Lifecycle Contract                             | Done                | Route, load, context, layout, error, redirect lifecycle                                                                                                 |
| v0.33.0 | AI-Readable API Foundation                         | Done                | Structured page, island, head, route, and render intent APIs                                                                                            |
| v0.34.0 | AutoFlow2 Sidecar Kernel                           | Done                | Workflow state, cells, evidence ledger, allowed-action report                                                                                           |
| v0.35.x | AutoFlow2 Mechanical Autonomy                      | Done                | Harness Gate, Cell Execution, Evolution Loop, and full-auto evidence                                                                                    |
| v0.36.0 | Rendering Runtime, Deployment & Deferred Refactors | Done with deferrals | Rendering/runtime evidence and Phase 1 SSG extraction                                                                                                   |
| v0.36.1 | AutoFlow Closure & v0.36 Release Truth             | Done                | AutoFlow proof and release truth alignment                                                                                                              |
| v0.36.2 | SSG Bridge Migration + Rendering Evidence Closure  | Done                | Move Vite-free SSG core into `@openelement/ssg` and close ISR/SSR/stream evidence                                                                       |
| v0.36.3 | Complete SSG File Ownership Migration              | Done                | Move route scanner, entry generator, Vite plugin, generated data resolver out of adapter-vite                                                           |
| v0.36.4 | Firefox/WebKit Cross-Browser Proof                 | Done                | Resolve Firefox/WebKit E2E timeout and behavior differences                                                                                             |
| v0.36.5 | Release Truth and AutoFlow Closure                 | Done                | Align workflow, release docs, AutoFlow evidence, and website truth                                                                                      |
| v0.37.0 | Product Doctrine + Rendering Contract Reset        | Done                | ADR-0091, default 0JS doctrine, DSD/shadow default, light opt-in terms, v0.37.x SOP split                                                               |
| v0.37.1 | DsdElement Shadow + Light Contract                 | Done                | Explicit `DsdElement.renderMode = 'light'` opt-in with SSR/CSR proof                                                                                    |
| v0.37.2 | SSR / ISR Server Runtime Contract                  | Done                | Request-time SSR/ISR runtime boundary, cache contract, server adapter evidence                                                                          |
| v0.37.3 | Data / Database Boundary                           | Done                | Data/database adapter contracts and recipes without built-in ORM ownership                                                                              |
| v0.37.4 | Hygiene + Pure CSS UI + Architecture Decoupling    | Done / JSR caveat   | Implementation complete; JSR distribution followed ADR-0097-era caveats                                                                                 |
| v0.37.5 | Protocol-First Runtime Architecture                | Done                | Make `@openelement/protocol` the real replacement boundary and define Vite + Nitro as the default base engine                                           |
| v0.37.6 | Vite + Nitro Runtime Proof                         | Done                | Prove openElement routes, rendering, islands, assets, SSR/ISR intent, and deployment output through Nitro                                               |
| v0.38.0 | Product Surface Reset and Hardening                | Done                | Reset public package/API/product surface based on protocol and Nitro runtime evidence                                                                   |
| v0.39.0 | Framework RC + Four-Product Matrix Reset           | Done                | ADR-0099, public docs integrity, Elements direction, Preact handoff, starter/deploy/consumer gates                                                      |
| v0.40.4 | Elements + Preact + Repository Slimming            | Release-ready       | Productize `OpenElement`, prove Preact islands, and collapse root/docs/Hub/package/gate shape to 11 packages                                            |
| v0.41.0 | npm-only Distribution                              | Active              | Replace JSR release closure with npm artifacts, npm trusted publishing, Deno `npm:` smoke, jsDelivr smoke, Fresh interop, and alpha.5 SPA/Desktop proof |
| v0.42.0 | Server Primitives                                  | Planned             | Add server request/action primitives and prove Node + Workers runtime paths through Nitro                                                               |
| v0.43.0 | Data + Cache Primitives                            | Planned             | Add loader/action/data/cache contracts and recipes without built-in ORM ownership                                                                       |
| v0.44.0 | Forms + Mutations                                  | Planned             | Add progressive-enhancement forms, action result serialization, validation protocol, and island handoff                                                 |
| v0.45.0 | Session + Auth Recipes                             | Planned             | Add signed session primitives and official auth recipes without becoming an auth platform                                                               |
| v0.46.0 | Database + Storage Recipes                         | Planned             | Prove SQLite/libSQL, Postgres, D1, KV/R2-style recipes without selecting a default database                                                             |
| v0.47.0 | Deployment Hardening                               | Planned             | Harden Node, Workers, npm, jsDelivr, Deno `npm:`, cache headers, ISR/SWR, and runtime smoke gates                                                       |
| v0.48.0 | Product DX + Docs Freeze                           | Planned             | Freeze docs shape, starter templates, examples, and smoke-backed learning path                                                                          |
| v0.49.0 | v1.0 Freeze Candidate                              | Planned             | Freeze public package graph, exports, server/data/forms/session/cache protocols, and release gates                                                      |
| v1.0.0  | Stable Web Components Full-stack Framework         | Vision              | Stable npm-first Elements, UI, Framework, Protocols, server/data/forms/session/cache, and recipes                                                       |

## Current Product Center

> openElement = Elements + UI + Framework + Protocols.

ADR-0099 defines the current product matrix:

| Product   | Current/future primary surface            | Status                                         |
| --------- | ----------------------------------------- | ---------------------------------------------- |
| Elements  | `@openelement/element`, `OpenElement`     | v0.40 product package facade over core         |
| UI        | `@openelement/ui`                         | First-party `open-*` component library         |
| Framework | `@openelement/app`, `@openelement/create` | Active v0.39 RC proof                          |
| Protocols | `@openelement/protocol`                   | Replacement boundary and conformance contracts |

Historical positioning note: earlier ADRs used the phrase DSD-first to protect
shadow/DSD output as the default. ADR-0096 refines that into Web Components
application framework identity, with shadow/DSD as the default render mode and
light DOM as first-class opt-in. ADR-0099 further refines the product matrix:
DSD/shadow is a default Elements render mode, not the product name.

## Current Rendering Mode

| Mode                 | State       | Notes                                                                                        |
| -------------------- | ----------- | -------------------------------------------------------------------------------------------- |
| SSG                  | shipped     | default production rendering; engine lives in `@openelement/ssg`                             |
| DSD                  | shipped     | `renderDsd()` outputs declarative shadow roots                                               |
| Streaming DSD        | evidence    | `renderDsdStream()` is tested through Web `Response` consumption; not default server runtime |
| Static zero-JS       | doctrine    | static routes emit no framework JS unless islands, hydration, or client-only are explicit    |
| JSX+Signal           | shipped     | `render(): VNode \| null`, effect() signal tracking                                          |
| Island upgrade       | shipped     | binary SSR/client-only boundary                                                              |
| Hydration strategies | shipped     | `client:load/idle/visible/only`                                                              |
| ISR contract         | shipped     | `IsrCache`, caches, manifest entries, and `@openelement/core/isr-runtime` response flow      |
| API route (Hono)     | shipped     | Hono is the current API route/request handler layer                                          |
| Runtime engine       | planned     | Nitro is the default production runtime/deployment target after v0.37.6 proof                |
| AppShell protocol    | shipped     | default, bare, custom, and route-selected shells                                             |
| Application API      | v0.31.0     | `definePage`, `defineIsland`, `/vite` config split                                           |
| App lifecycle        | v0.32.0     | load context, route meta, redirect, not-found, error                                         |
| AI-Readable API      | v0.33.0     | Object-form pages, island config, head trust boundary                                        |
| AutoFlow2            | v0.34-v0.36 | report/check/evolve sidecar with evidence ledger and release truth gates                     |

## Package Version State

The active v0.41 workspace contains 11 current `@openelement/*` packages aligned
to local version **0.41.0**. Published package availability is completed by the
`main` branch npm publish workflow and its post-publish npm consumer smoke.

Package governance for v0.41:

- do not add a new top-level package without an ADR;
- ADR-0102 approves `@openelement/element`; the v0.40 roadmap now prioritizes
  Preact island proof over the earlier Vue adapter plan, and any later package
  topology change must update package count, release order, import maps, graph
  checks, docs, and migration notes;
- keep protocol contracts small and runtime-free;
- keep UI independent from framework routing;
- keep database, ORM, auth, backend, runtime, cache, storage, and deployment
  choices at protocol, adapter, or recipe boundaries.

v0.40 package governance approves a breaking cleanup from 21 historical packages
to the 11-package current surface. Future package deletion, package merge, new
package creation, package graph topology changes, default runtime changes, and
default signal-engine changes still require ADR-backed human approval under
ADR-0101.

The active package classification now lives in
`docs/current/PACKAGE_SURFACE.md`. The v0.40 reset removes Hub package, Hub
routes, Hub registry data, and Hub-specific workflows/tasks from the active
product path.

ADR-0102 approves `@openelement/element` as the first-class Elements package.
The workspace package count is now 11.

## Architecture Positioning

1. **Elements** - native Web Components authoring with JSX, signals, styles,
   shadow/DSD defaults, explicit light DOM opt-in, and the future
   `OpenElement` base class.
2. **UI** - first-party `open-*` components built on the Elements model and
   independent from framework routing.
3. **Framework** - `definePage()`, `defineIsland()`, file routes, layouts,
   `load()`, error/redirect/not-found behavior, SSG/SSR/ISR, API routes, and
   starter/create workflows.
4. **Protocols** - runtime-free contracts for renderer, component adapter,
   route manifest, island metadata, runtime adapter, cache/storage, data, and
   signal interoperability.
5. **Default engine bridge** - Vite owns module graph, plugin orchestration,
   client bundling, and HMR; Nitro owns production runtime, deployment output,
   platform presets, cache/storage, and route-rule plumbing.
6. **Supporting implementation surfaces** - core, adapter-vite, ssg, router,
   content, and signal support the four products without becoming
   separate product lines.

## Future Product Direction

- ADR-0099 supersedes the v0.38 package-name deferral for future work and
  approves the four-product matrix.
- Elements becomes a first-class product direction, with `OpenElement` replacing
  `DsdElement` terminology in future public APIs.
- Web Components remain the default component model, but renderer and component
  adapter protocols must not assume only one frontend framework.
- Shadow/DSD remains the default Elements render mode; explicit light DOM opt-in
  is a first-class supported mode.
- Vite + Nitro are the default base engine. Vite handles build/module graph and
  Nitro handles production runtime/deployment, but neither should leak as the
  primary user-facing application API.
- Protocols should grow through concrete conformance tests, not broad
  abstraction rewrites.
- UI remains first-party and Elements-based. Web Awesome is not part of the
  current target.
- Heavy-framework island expansion is frozen except for the planned v0.40
  Preact island proof.
- v0.40 owns the physical repository slimming work: root generated outputs, Hub data, active docs categories, 11-package surface checks, and duplicate gate orchestration must stay aligned with the four-product matrix.
- Database work belongs in data/database adapter contracts and recipes. It must
  not become a built-in ORM, auth platform, or migration system.
- A Vite + Nitro runtime proof should compose openElement routes, rendering,
  islands, assets, API routes, and ISR/cache intent before product-surface reset.
- Governance convergence before v1.0: gate tiers (fast dev gate for PRs,
  full release gate for publishing), AutoFlow feature scope freeze, Hub scope
  deferred to post-v1.0. See `docs/roadmap/ROADMAP.md` v0.38.x for details.
- npm publish is the v0.41 release distribution gate under ADR-0108.
  v0.41 replaces the JSR-only path with npm-only release truth.

## Key Decisions

- **Four-product matrix.** openElement is Elements + UI + Framework +
  Protocols; supporting packages do not become first-class products by
  existing in the workspace.
- **Elements product reset.** Future public element authoring centers on
  `@openelement/element` and `OpenElement`, not `DsdElement` terminology.
- **Application API first.** App authors write `definePage()` and
  `defineIsland()` before touching lower-level Elements APIs.
- **Vite config split.** `openElement()` is imported from
  `@openelement/app/vite`.
- **Vite + Nitro default engine.** Vite is the default build/module graph
  engine and Nitro is the planned default production runtime/deployment engine.
- **Protocol-first replacement boundary.** Renderer, component adapter, runtime,
  route manifest, island, cache/storage, signal, and data contracts belong in
  `@openelement/protocol` with conformance tests.
- **TemplateResult and string render removed.** JSX+Signal is the only component
  model. `render()` returns `VNode | null`.
- **Web Components product identity.** openElement is a Web Components
  application framework; DSD/shadow is the default render mode, not the entire
  product identity.
- **Static default 0JS.** Static routes should emit zero framework JavaScript
  unless islands, hydration, or client-only components are explicit.
- **SSR/ISR in framework core.** SSR and ISR belong to the framework product
  line and are not split into a fifth product.
- **Light DOM is opt-in.** Shadow/DSD remains the default Elements render mode.
  Light DOM support requires explicit API, tests, docs, and ADR coverage.
- **Current heavy island target.** Preact is the only planned heavy-framework
  island adapter proof for the pre-1.0 path; Vue, React, Svelte, and generic
  heavy-island expansion are frozen, and Web Awesome is out of scope.
- **Signal engine.** `@preact/signals-core` is the only supported engine
  (since v0.40.4).
- **No DOM diff.** Signal writes trigger scoped rerender behavior; complex
  subtrees stay in Islands.
- **Package graph gate.** `graph:check` verifies zero cycles, unified versions,
  and declared imports.
- **npm publish exit gate for v0.41.** `pack:dry-run` and `publish:npm:dry-run`
  are local release gates, and the `main` branch publish workflow provides v0.41
  distribution closure. v0.41 moves release truth to npm under ADR-0108.
- **SSG ownership.** `@openelement/ssg` owns SSG render, postprocess, route
  scanning, entry generation, generated data resolution, and SSG-specific Vite
  plugin logic.
- **AutoFlow2 boundary.** AutoFlow2 may report state, evidence, blockers, and
  allowed actions. It must not merge, tag, bump, publish, or replace human review
  for ADRs, public API resets, package removal, release tags, or publishing.
- **AutoFlow3 boundary.** AutoFlow3 is the single workflow, gate, and evidence
  control plane. It may automate patch-level mechanical changes only when
  policy checks prove no public API, package topology, release-policy,
  runtime-default, security, auth, database, or minor/major roadmap impact.
  Minor, major, and v1 decisions require human ADR plus approved version-plan
  evidence.
- **Protocol first-class.** Core rendering, adapter, island/hydration, signal,
  data, route-manifest, runtime, cache, storage, and component-adapter contracts
  live in `@openelement/protocol` with conformance tests.

## Release Gate Order

```bash
deno task workflow:check
deno task docs:check-public
deno task arch:check
deno task graph:check
deno task signals:check-protocol-boundary
deno task docs:check-current
deno task docs:check-strategy
deno task fmt:check
deno task lint
deno task typecheck
deno task autoflow:test
deno task autoflow:dev
deno task autoflow:push
deno task autoflow:ci
deno task test
deno task build
deno task nitro:proof:node
deno task nitro:proof:workers
deno task deno-api:check
deno task pack:dry-run
deno task publish:npm:dry-run
```

Live npm publish and post-publish npm consumer smoke run from the `main` branch
after repository-controlled gates, dev CI, merge, and release work. This is the
v0.41 npm-only distribution closure path. JSR publish remains available only as
a historical observation task (`publish:jsr:*`) and is no longer a release exit
gate.
