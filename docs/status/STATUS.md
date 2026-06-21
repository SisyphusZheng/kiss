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

Resolved — all 🔴/🟠/🟡 items fixed in 3 phases (930 tests / 0 failed).

- Phase 1: Removed broken `validators` protocol subpath. Extracted Vite string from `core/html-escape.ts` (`devMode`→`devScripts`). Routed `HydrationStrategy`/`ComponentLayer`/`HydrationHint`/`RenderError` imports to `@openelement/protocol`.
- Phase 2: Moved `FrameworkOptions`/`RouteEntry`/`OpenElementPackageManifest`/`IsrManifestEntry`/`CompatibilityClassification` to `protocol/src/build-types.ts`. Added `protocol/logger` (createLogger) and `protocol/errors` (formatError/OpenElementError) subpaths — updated 40+ engine-layer imports.
- Phase 3: Annotated `app/i18n-plugin.ts` and `content/deno.json` with engine-layer comments. Marked unused protocol surface (`components`, `island-frameworks`, `conformance`).

### 🔴 CRITICAL — Resolved

- ~~Broken `protocol/validators` subpath~~ → entry removed from deno.json
- ~~Vite string leaked into `core`~~ → `wrapInDocument()` now accepts generic `devScripts`
- ~~Protocol types imported from core, not protocol~~ → all 8+ locations routed to `@openelement/protocol/renderer`

### 🟠 HIGH — Resolved

- ~~Core types missing from protocol~~ → `protocol/src/build-types.ts` now owns `FrameworkOptions`, `RouteEntry`, etc.
- ~~Deep subpath `createLogger` bypass~~ → 23 files now import from `@openelement/protocol/logger`
- ~~Deep subpath `formatError` bypass~~ → 18 files now import from `@openelement/protocol/errors`

### 🟡 MEDIUM — Documented

- `wrapInDocument` params cleaned via Phase 1 fix.
- `app/vite.ts` + `app/i18n-plugin.ts` annotated.
- `content/deno.json` annotated.
- Unused protocol surface annotated.

### ✅ Verified Clean

- `core`, `element`, `ui`, `signal`, `router` — zero `node:*`, zero `Deno.*`, zero framework/engine imports.
- `app/` runtime entries — all pure.
- `protocol/` — zero Vite/Nitro references.
- `ssg/` — zero Nitro leakage.