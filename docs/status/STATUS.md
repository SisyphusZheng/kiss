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

The default signal engine is `@preact/signals-core`. `alien-signals` remains
available as an optional engine through `@openelement/signal/alien-engine`.

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

v0.41.0 repository cleanup (2026-06-21, 930 tests / 0 failed):
- Round 1: Deleted dead files (validators, file-isr-cache, engine, content barrels, ~530 lines). Removed dead exports (LogLevel, renderSequential/Parallel). Shrink/stdlib fixes (hoisted conditionKeys, unified renderSsrError, extname→path.extname, warnOnce helper).
- Round 2: Deleted createDefaultEngine, _textEncoder, data.ts barrel, use-loader-data.ts barrel, hasControlCharacter, joinUrlPath, section-matter dep, stale file-isr-cache export. Inlined renderEndTimeFallback/now/escapeRoutePath. Converted codeForRenderError to lookup table. Merged switch fallthrough. Annotated speculative errors.
- Round 3: Deleted router dead files (client-router, page-loader, ssr-data-stubs, define-routes, pattern-translate, locale-path, ~500 lines). Removed marked dep from router. Converted cem-compat/entry-descriptor/route-scanner switches to lookup tables. Extracted safeNow() for performance.now() fallback. Unified 404 rendering blocks. (useActionData/useLoaderData preserved — used by www.)

## Prior Version Line: v0.39.0 (Framework RC + Four-Product Matrix Reset)