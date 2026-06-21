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

### 🔴 CRITICAL — ✅ Resolved (Phase 1)
- ~~Broken `protocol/validators` subpath~~ → removed from `protocol/deno.json`
- ~~Vite string leaked into `core`~~ → `wrapInDocument()` now accepts generic `devScripts`; `/@vite/client` moved to engine layer
- ~~Protocol types imported from `core`, not `protocol`~~ → `HydrationStrategy`/`ComponentLayer`/`HydrationHint`/`RenderError` now routed via `@openelement/protocol/renderer` (8+ locations)

### 🟠 HIGH — ✅ Resolved (Phase 2)
- ~~Core types missing from protocol~~ → created `protocol/src/build-types.ts` with `FrameworkOptions`/`RouteEntry`/`OpenElementPackageManifest`/`IsrManifestEntry`/`CompatibilityClassification`; core re-exports from protocol
- ~~Deep subpath bypass: `createLogger`~~ → added `protocol/logger`, 23 files updated
- ~~Deep subpath bypass: `formatError`~~ → added `protocol/errors`, 18 files updated

### 🟡 MEDIUM — ✅ Annotated (Phase 3)
- `wrapInDocument` params cleaned via Phase 1
- `app/vite.ts` + `app/i18n-plugin.ts` annotated
- `content/deno.json` annotated
- Unused protocol surface annotated with `ponytail:` comments

### ✅ Verification
- `core`/`element`/`ui`/`signal` — 66 files, zero violations
- `router` + `app` runtime — 7 files clean, 2 build-time (acceptable)
- `protocol` — zero Vite/Nitro/signal-engine imports

---

## v0.41.0-alpha.1 — Remaining Tasks

### 🟠 Engine Protocol Import Migration (14 locations)

Types in `protocol/build-types` but still imported from `@openelement/core`:

| Package | Files | Types |
|---------|-------|-------|
| `adapter-vite` | `build.ts`, `plugin.ts`, `head-injection.ts`, `build-pipeline.ts`, `build-context.ts`, `cli/build-ssg.ts` | `FrameworkOptions`, `OpenElementPackageManifest`, `RouteEntry`, `CompatibilityClassification` |
| `ssg` | `entry-renderer.ts`, `ssg-helpers.ts`, `ssg-render.ts`, `route-type-generator.ts`, `entry-descriptor.ts`, `ssg-report.ts`, `route-scanner.ts`, `cem-compat.ts` | Same + `IsrManifestEntry` |

### 🟡 Protocol Coverage Gaps (6 types + 5 runtime fns)

| Type missing from protocol | Defined In | Needed By |
|------|-----------|-----------|
| `SsrAdmissionDecision` | `core/render-schemas.ts` | `ssg/entry-descriptor.ts`, `ssg/ssg-render.ts` |
| `CemCompatibilityReport` | `core/render-schemas.ts` | `ssg/ssg-report.ts` |
| `DsdBuildReport` | `core/render-schemas.ts` | `ssg/ssg-report.ts` |
| `DsdHydrationStrategySummary` | `core/render-schemas.ts` | `ssg/ssg-report.ts` |
| `ManifestDecision` | `core/render-schemas.ts` | `ssg/ssg-report.ts` |
| `SpecialFileType` | `core/schemas.ts` | `ssg/route-scanner.ts` |

Runtime functions needing protocol re-exports: `escapeAttr`, `isValidTagName`, `createIsrCacheKey`, `transformIslandSource`, `StyleSheet`.

### 🟢 Dead Dependencies & Tools

| Category | Detail |
|----------|--------|
| Dead npm deps | `hono` in `adapter-vite/deno.json`, `hono` in `ssg/deno.json`, `typescript` in `adapter-vite/deno.json` |
| Stale import-map (root) | `flexsearch`, `sanitize-html`, `@types/sanitize-html`, `@types/node` — zero .ts imports |
| Broken tool | `tools/verify-package-configs.ts` — stale `deno.land` URL + references deleted `i18n` package |
| API leak | `adapter-vite/build-pipeline.ts` re-exports `FrameworkOptions` from core — should re-export from protocol |