# openElement Project Status

> AI assistant: read this file first on every session start.

Mandatory workflow: `docs/governance/PROJECT_WORKFLOW.md`. Active version plan:
`docs/current/VERSION_PLAN.md`.

## Current Version Line: v0.40.8 Active (Cleanup-Train Patch → next v0.41.0 npm Distribution Pivot)

v0.40.8 is the active package line. v0.41.0 (next) pivots openElement distribution from
JSR to npm using Deno `deno pack`, keeps Vite + Nitro as the default engines
behind the protocol boundary, and makes `@openelement/*` packages available as
pure ESM npm artifacts. Runtime-free packages (`core`, `element`, `ui`,
`protocol`, `signal`, `router`, `app`) retain zero `Deno.*` and zero `node:*`
usage; build/server glue (`ssg`, `content`, `adapter-vite`, `create`) owns the
necessary runtime-specific code. The release introduces no new product feature
and makes no default runtime, signal-engine, or package-topology change beyond
the distribution channel.

v0.41.0 is executed under ADR-0108 and the active version plan in
`docs/current/VERSION_PLAN.md`. AutoFlow3 is the workflow, gate, evidence, and
release-state control plane, but it cannot decide minor/major product scope,
public API, package topology, default runtime, default signal engine,
security/auth/database ownership, or release policy without human ADR or
approved version-plan evidence.

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

v0.41.0 repository cleanup (2026-06-21, 930 tests / 0 failed):

- Round 1: Deleted dead files (validators, file-isr-cache, engine, content barrels, ~530 lines). Removed dead exports (LogLevel, renderSequential/Parallel). Shrink/stdlib fixes (hoisted conditionKeys, unified renderSsrError, extname→path.extname, warnOnce helper).
- Round 2: Deleted createDefaultEngine, _textEncoder, data.ts barrel, use-loader-data.ts barrel, hasControlCharacter, joinUrlPath, section-matter dep, stale file-isr-cache export. Inlined renderEndTimeFallback/now/escapeRoutePath. Converted codeForRenderError to lookup table. Merged switch fallthrough. Annotated speculative errors.
- Round 3: Deleted router dead files (client-router, page-loader, ssr-data-stubs, define-routes, pattern-translate, locale-path, ~500 lines). Removed marked dep from router. Converted cem-compat/entry-descriptor/route-scanner switches to lookup tables. Extracted safeNow() for performance.now() fallback. Unified 404 rendering blocks. (useActionData/useLoaderData preserved — used by www.)

## v0.41.0-alpha.1 Architecture Audit

Three-layer audit covering protocol contract completeness, core purity, and engine-to-protocol adherence.

### 🔴 CRITICAL

- **Broken protocol subpath** — `protocol/deno.json` exports `"./validators"` → `"./src/validators.ts"` but the file was deleted in cleanup round 1. Direct `import from '@openelement/protocol/validators'` fails at runtime. (Barrel `import from '@openelement/protocol'` still works via `index.ts`.)
- **Vite string leaked into `core`** — `core/src/html-escape.ts:166-175` hardcodes `<script type="module" src="/@vite/client">` when `devMode=true`. `core` declares "Zero Vite dependency" but smuggles a Vite dev-server convention via a string literal. Any non-Vite engine passing `devMode=true` gets a broken `<script>` tag.
- **Protocol-defined types imported from `core`, not `protocol`** — `HydrationStrategy`, `ComponentLayer` are defined in `@openelement/protocol/renderer`, but 8+ locations in `adapter-vite` and `ssg` import them from `@openelement/core` (`build.ts`, `plugin.ts`, `build-context.ts`, `island-manifest.ts`, `entry-generators.ts`, etc.).

### 🟠 HIGH — Architecture Debt

- **Core types missing from protocol** — `FrameworkOptions`, `RouteEntry`, `OpenElementPackageManifest`, `IsrManifestEntry`, `CompatibilityClassification`, `ManifestDecision`, `DsdBuildReport` etc. are defined only in `core/src/schemas.ts` but imported by engine packages (`adapter-vite`, `ssg`), forcing engine-to-core direct dependency.
- **Deep subpath bypass: `createLogger`** — 15+ files across `adapter-vite`, `ssg`, `content`, `create` import `createLogger` from `@openelement/core/logger` (deep subpath), bypassing protocol.
- **Deep subpath bypass: `formatError` / `OpenElementError`** — 8+ files import from `@openelement/core/errors` instead of protocol.

### 🟡 MEDIUM — Boundary Leakage

- `core/src/html-escape.ts` — `wrapInDocument()` `devMode` + `routeModulePath` params are engine-layer concepts leaking into runtime-free core.
- `app/vite.ts` and `app/i18n-plugin.ts` — have `vite` / `node:*` imports. Currently on `/vite` subpath and marked `deno-api-free:ignore`; runtime entries (`index.ts`, `authoring.ts`, `i18n.ts`, `preact.ts`) are clean.
- `content/deno.json` — depends on `vite`, making `@openelement/content` a Vite-coupled plugin rather than a runtime-free engine package.
- Unused protocol surface — `components.ts`, `island-frameworks.ts`, `conformance.ts` have zero production consumers; dead weight on the protocol contract.

### ✅ Passed

- `core`, `element`, `ui`, `signal`, `router` — zero `node:*`, zero `Deno.*`, zero framework/engine imports.
- `app/` runtime entries (`index.ts`, `authoring.ts`, `i18n.ts`, `preact.ts`, `i18n-runtime.ts`) — all pure.
- `protocol/` — zero Vite/Nitro references.
- `ssg/` — zero Nitro leakage.