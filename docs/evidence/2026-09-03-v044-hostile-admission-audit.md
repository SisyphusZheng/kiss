# v0.44 hostile admission audit (issue #1222, packet B1.1)

Independent hostile admission audit of the v0.44 core, executed by a fresh
auditor session with no implementation context, per issue #1222 (Beta.1 slice,
stage #1150, umbrella #1155). Adjudication authority: `docs/governance/GOVERNANCE_CONSTITUTION.md`
§3 (one surface, one owner), §4.3 (duplicate-implementation justification
rule), §3.3 (unregistered surface is a defect). Posture per the configured
release-verifier agent profile under `.agents/` (path recorded in
`tools/config/v044-roles.json`; the role-neutral documentation gate forbids
spelling the executor identifier in docs): derive the plan from source, attack
missing coverage, prefer observable evidence, fail closed.

- Audit SHA: `c4b484602b793a1ccc22317fa9e6f2603446b8b4` (branch `dev`,
  verified with `git rev-parse HEAD`; `git status --porcelain` empty at
  checkout). The audit branch adds only this report.
- Question: is the v0.44 core trustworthy enough to freeze as the product
  baseline?
- Method: rebuild the semantic-owner matrix from `packages/` and `tools/`
  source without consulting the registry first; then diff the rebuilt matrix
  against `docs/current/SEMANTIC_OWNERSHIP.md`; then grep/AST-level searches
  for second copies of every surface named in #1222 (and overlaps found along
  the way); then run the parity evidence each surviving duplicate cites and
  record exact commands and exit codes.

## 1. Rebuilt semantic-owner matrix (derived from source)

Each row was derived from source structure and import edges, not from the
registry. "Evidence rerun" = a command this audit executed at the audit SHA;
exit codes are in §5.

| #  | Semantic surface                                                                                                           | Source-derived canonical owner                                                                                                                                                                             | Executors / consumers observed                                                                                                                                                                                                                    | Evidence rerun                                                                                                       |
| -- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| 1  | OpenElement language grammar (decorators, property, computed, TSX, Part/Region admission, fail-closed OEC9xxx diagnostics) | `packages/adapter-vite/src/internal/compiler/semantic-core/compile.ts`                                                                                                                                     | Vite plugin hook (`internal/compiler/plugin.ts`) is integration only                                                                                                                                                                              | `compiler-fail-closed-matrix.test.ts`, `compiled-element-v1.test.ts` — exit 0                                        |
| 2  | Intrinsic recognition (canonical import binding of `element`, `property`, `computed`, `trustedHtml`, `OpenElement`)        | `semantic-core/module-analysis.ts:44` (`INTRINSIC_MODULES`)                                                                                                                                                | `route-scanner.ts` and `static-component-scanner.ts` consume `analyzeModuleSemantics`; no second recognizer found                                                                                                                                 | `module-analysis.test.ts`, `compiler-intrinsic-provenance.test.ts` — exit 0                                          |
| 3  | Part Program v1 wire schema                                                                                                | `semantic-core/program.ts` (`PART_PROGRAM_VERSION`, serialize/validate)                                                                                                                                    | Independent mirror validator in Element (see D1)                                                                                                                                                                                                  | adversarial corpus — exit 0                                                                                          |
| 4  | RuntimeProgramIR (normalized, frozen)                                                                                      | `packages/element/src/internal/compiled/runtime-program.ts` (`normalizePartProgram`)                                                                                                                       | runtime, claim, server serializers consume post-validation                                                                                                                                                                                        | conformance suite — exit 0                                                                                           |
| 5  | Part/Region/anchor/dependency/location identity                                                                            | Part Program v1 ownership tables (both validators reject duplicate/missing/misplaced records)                                                                                                              | Element indexes, never rediscovers                                                                                                                                                                                                                | adversarial corpus ownership-table tests — exit 0                                                                    |
| 6  | Signals and reactive invalidation                                                                                          | `packages/element/src/internal/signal/` (preact engine default, `selection.ts` static seam)                                                                                                                | test engine is a test double, not a product alternative                                                                                                                                                                                           | `compiled-runtime/signal-engine.test.ts` — exit 0                                                                    |
| 7  | Context discovery and transport                                                                                            | Community `context-request` composed/bubbling event; sole project bridge `packages/element/src/internal/core/signal-context.ts:10`                                                                         | compiled lifecycle service is an executor (D10); Lit interop tested                                                                                                                                                                               | `signal-context.test.ts`, `compiled-runtime/context.test.ts` — exit 0                                                |
| 8  | SSR initial DOM / fresh DOM / claim / activation                                                                           | `packages/element/src/internal/compiled/runtime.ts` (`createFreshDom` :1095, `claimExistingDom` :2126) + `server/index.ts` (`serializeCompiledProgram` :609); mode decision in `runtime/kernel.ts:121-124` | facade (`open-element-implementation.ts`) consumes kernel activation result; generated entries call the serializer                                                                                                                                | conformance + claim + server suites — exit 0                                                                         |
| 9  | Nested composition, slots, DSD                                                                                             | compiled server serializer (structured nested records)                                                                                                                                                     | Vite supplies registry modules and admission list only                                                                                                                                                                                            | `compiled-composition.test.ts`, `nested-static-ssr.test.ts` — exit 0                                                 |
| 10 | Trusted HTML capability                                                                                                    | `packages/element/src/internal/core/security.ts:82-96` (`trustedHtml`/`trustedHtmlValue`)                                                                                                                  | both serializers import `trustedHtmlValue`; compiler admits the sink grammar                                                                                                                                                                      | trusted sink admission matrix in `compiled-element-v1.test.ts` — exit 0                                              |
| 11 | Document/head/body serialization                                                                                           | `packages/element/src/internal/core/html-escape.ts` (`wrapInDocument`, `escapeHtml`, `escapeAttr`)                                                                                                         | generated Hono/SSG entries call it                                                                                                                                                                                                                | `html-escape.test.ts` — exit 0                                                                                       |
| 12 | HTML sanitization policy (ADR-0126 allow-list)                                                                             | `packages/element/src/sanitize.ts` (sole implementation)                                                                                                                                                   | adapter content layer (`internal/content/sanitize.ts`) imports `sanitizeHtml` and pins one shared options object                                                                                                                                  | `sanitize.test.ts` — exit 0                                                                                          |
| 13 | CSS and visual theme                                                                                                       | platform cascade + compiled light-CSS scoping (`compiled/style.ts`)                                                                                                                                        | Context carries identity only                                                                                                                                                                                                                     | style suites — exit 0                                                                                                |
| 14 | Route pathname grammar                                                                                                     | WHATWG `URLPattern` (native, or `urlpattern-polyfill` fallback selected once in `route-table.ts:48-50`); framework-dialect converter `packages/element/src/internal/core/html-route-utils.ts:2`            | adapter `ssg-helpers.ts:111` aliases the same converter (`routePatternToURLPatternPath = normalizeRoutePatternForURLPattern`); no second converter                                                                                                | `client-router.test.ts` corpus — exit 0                                                                              |
| 15 | Route matching, order, params, query, base, trailing-slash                                                                 | `packages/app/src/internal/router/route-table.ts` (`RouteTable`; declaration index, static fast-path `isStaticPath` classification, safe params Proxy)                                                     | SPA router (`internal/router/client-router.ts:17`) delegates; generated admission predicate is a documented boolean OR (`ssg-helpers.ts:114-115`) with no precedence derivation                                                                   | `client-router.test.ts` (29 tests incl. native/polyfill corpus) — exit 0                                             |
| 16 | Route file-convention declaration grammar and declaration ordering                                                         | `packages/adapter-vite/src/internal/ssg/route-scanner.ts` (`parseRouteFilePath` :108; static-before-dynamic sort :333-345) — **no registry row (F1)**                                                      | SPA manifest, SSG and request-time codegen all consume `scanRoutes` output order                                                                                                                                                                  | `route-scanner-*.test.ts`, `route-manifest.test.ts`, dev-vs-build parity — exit 0                                    |
| 17 | Request/Response semantics                                                                                                 | Web platform `Request`/`Response`/`Headers`/`FormData`/`URL`                                                                                                                                               | Hono executes; `internal/node-bridge.ts` converts; Nitro adapts                                                                                                                                                                                   | `node-bridge-*.test.ts` — exit 0                                                                                     |
| 18 | Loader/action/outcome classification                                                                                       | `packages/app/src/authoring.ts` (`classifyActionResult` :183, `redirect` :101, `notFound` :105, `fail` :159)                                                                                               | SPA imports the classifier (`spa.ts:253`); generated Hono runtime imports it as `__classifyActionResult` (`entry-orchestrator.ts:116`, used at `entry-action-runtime.ts:66`)                                                                      | `packages/app/__tests__` (99 tests) — exit 0                                                                         |
| 19 | Problem Details shape and media type                                                                                       | `packages/element/src/internal/protocol/data.ts:124-136`                                                                                                                                                   | generated entries consume `PROBLEM_JSON_MEDIA_TYPE`                                                                                                                                                                                               | request-time e2e fixture asserts `application/problem+json` (fixture suite; not rerun — see §5 note)                 |
| 20 | Action/CSRF wire protocol                                                                                                  | generated action runtime `entry-action-runtime.ts` (emitted once per entry) over App-owned classification                                                                                                  | SPA/enhancement executors                                                                                                                                                                                                                         | `entry-renderer.test.ts` — exit 0                                                                                    |
| 21 | Hono execution                                                                                                             | Hono request/middleware model                                                                                                                                                                              | generated entry binds App semantics to Hono                                                                                                                                                                                                       | `request-time-parity.test.ts` — exit 0 (full permission set)                                                         |
| 22 | Nitro deployment                                                                                                           | Nitro adapters and generated artifacts                                                                                                                                                                     | Node/Cloudflare environment alternatives                                                                                                                                                                                                          | `nitro:proof:*` not rerun in this audit (heavy deployment gates); Alpha.10 closure recorded them green at `4c3fd116` |
| 23 | Compiler-known interaction facts                                                                                           | compiler semantic analysis (`module-analysis.ts`, emitted event records)                                                                                                                                   | `client-admission.ts` reads facts directly; scanners do not re-derive TS semantics (AST-level check: `island-scanner.ts` parses only its own `defineIslandConfig` config block; `static-component-scanner.ts:6` imports `analyzeModuleSemantics`) | module-analysis/admission suites — exit 0                                                                            |
| 24 | Explicit island policy                                                                                                     | author declaration validated by the adapter (`island-scanner.ts` static config parser)                                                                                                                     | admission aggregation projects it                                                                                                                                                                                                                 | `island-scanner.test.ts` — exit 0                                                                                    |
| 25 | Third-party delivery capability                                                                                            | package manifest + CEM classification (`cem-compat.ts`)                                                                                                                                                    | adapter aggregates                                                                                                                                                                                                                                | `cem-compat.test.ts` — exit 0                                                                                        |
| 26 | Client reachability / zero-JS                                                                                              | `client-admission.ts` (deterministic union)                                                                                                                                                                | Vite chunking/entry generation implements the plan                                                                                                                                                                                                | `ssg-admission-parity.test.ts`, `request-time-admission-parity.test.ts` — exit 0 (full permission set)               |
| 27 | Vite build/HMR/resolution/map composition                                                                                  | Vite integration layer                                                                                                                                                                                     | compiler core returns code/diagnostics/source records, imports no Vite (boundary test)                                                                                                                                                            | `compiler-semantic-core-boundary.test.ts` — exit 0                                                                   |
| 28 | Source spans / source-map v3                                                                                               | `semantic-core/source-map.ts:60` (`SourceMapSegmentBuilder`) + program `sourceMap` records                                                                                                                 | Vite composes standard maps                                                                                                                                                                                                                       | `compiler-source-map-v3.test.ts` — exit 0                                                                            |
| 29 | Renderer scope matching (`_renderer.ts` scope predicate)                                                                   | `packages/adapter-vite/src/internal/ssg/entry-route-helpers.ts:24` (`rendererScopeMatches`) with a generated runtime re-expression `__matchingRenderers` (:38) — **mirror without parity proof (F2)**      | codegen filters per-route (`entry-codegen.ts:336`); SSG renderRoute filters at runtime (`entry-render-ssg.ts:115`)                                                                                                                                | no binding test found; behavioral coverage partial (see D6)                                                          |
| 30 | HTML text-node escaping                                                                                                    | duplicated private `escapeText` in `compiled/runtime.ts:1137` and `compiled/server/index.ts:108` — **no named owner, no byte-level text corpus (F3)**                                                      | attribute escaping is single-owned (`html-escape.ts:53`) and shared by both serializers                                                                                                                                                           | attr byte corpus — exit 0; text corpus absent                                                                        |
| 31 | Error contracts / classification                                                                                           | `packages/element/src/internal/protocol/errors.ts` (contract) + `core/errors.ts` (`OpenElementError` impl); App `internal/action-error.ts` is a normalizer, not a classifier                               | compiled claim/validation errors are separate closed families                                                                                                                                                                                     | `errors.test.ts`, claim suites — exit 0                                                                              |
| 32 | Public metadata / package interface                                                                                        | package root exports + manifests + checked interface snapshot                                                                                                                                              | docs/packed consumers                                                                                                                                                                                                                             | `interface:snapshot`, `package-surface:check` — exit 0 (§5)                                                          |
| 33 | Public version truth                                                                                                       | package manifests + `tools/project-constants.ts:5` + embedded `packages/create/src/version.ts:2` (mechanically bumped, gate-pinned) + `www/app/data/version.ts` (docs gates)                               | release tooling consumes project-constants                                                                                                                                                                                                        | `packages/create/__tests__/cli.test.ts:79-89` version parity tests — exit 0; `docs:check-version-anchors` — exit 0   |

## 2. Registry diff (rebuilt matrix vs `docs/current/SEMANTIC_OWNERSHIP.md`)

The registry self-declares as the Alpha.9 baseline pending Alpha.10 re-baseline
(header lines 14-17). Against that backdrop:

- **Confirmed rows.** Registry rows 1-29 map onto rebuilt rows 1-15, 17-28 and
  32-33 with matching owners and executors. No registry row names an owner
  that source contradicts.
- **Divergence 1 (Alpha.10 surface, unregistered): intrinsic recognition.**
  Rebuilt row 2 (the #1209/A10.1 intrinsic-binding model in
  `module-analysis.ts:36-54`) has no registry row. "OpenElement language
  semantics" and "Compiler-known interaction facts" rows do not name the
  intrinsic-binding surface. Consistent with the declared re-baseline plan,
  but at the audit SHA the surface is live and unregistered.
- **Divergence 2 (unregistered surface): route file-convention grammar and
  declaration ordering.** Rebuilt row 16 has no registry row. See F1.
- **Divergence 3 (unregistered surface): HTML sanitization policy.** Rebuilt
  row 12 has no registry row. Single implementation, single options object
  shared with the adapter content layer; low dispute potential. Informational.
- **Divergence 4 (unregistered surface): renderer scope matching.** Rebuilt
  row 29 has no registry row. See F2.
- **Divergence 5 (unregistered surface): HTML text-node escaping.** Rebuilt
  row 30 has no registry row. See F3.
- **Divergence 6 (parity-evidence staleness):** Alpha.10 added convergence
  guards (`when-operator-convergence`, `void-tags-convergence`,
  `compiled-escape-parity`, `compiler-intrinsic-provenance`) that the cited
  rows do not reference yet. The cited Alpha.9-era evidence still exists and
  still passes; this is citation lag, consistent with the re-baseline plan.
- **Divergence 7 (version truth granularity):** the "Public metadata and
  package interface" row does not enumerate the version literals
  (project-constants, five manifests, embedded create version, www version
  data) or their binding gates. All are gate-pinned (rebuilt row 33);
  informational.

## 3. Duplicate register

Verdicts per constitution §4.3: a duplicate survives only with canonical
owner + reason + parity proof. "JUSTIFIED" = all three elements present and
the parity proof was rerun green at the audit SHA. "GAP" = at least one
element missing → audit finding.

### D1 — Part Program v1 validator mirror — JUSTIFIED

- Locations: `packages/adapter-vite/src/internal/compiler/semantic-core/program.ts`
  (1376 lines) and `packages/element/src/internal/compiled/program.ts` (1384
  lines). `diff` of the two files: header comment, one comment block, and the
  Element-only `STATIC_STYLES_MARKER` export (`compiled/program.ts:351`, a
  runtime claim marker, not wire grammar; consumed by
  `compiled/server/index.ts:639` and `compiled/runtime.ts:1869`).
- Canonical owner: compiler `semantic-core/program.ts` (registry row "Part
  Program v1").
- Reason: ADR-0148 / registry boundary rule — the compiler and Element
  packages may not import each other's private TypeScript; Element must
  validate the wire artifact independently so no executor trusts compiler
  output blindly.
- Parity proof: `deno test … part-program-validation-adversarial.test.ts`
  applies a named fault corpus (version, tag, ownership tables, sinks, event
  actions, item slots) to BOTH validators and requires identical
  accept/reject outcomes (`part-program-validation-adversarial.test.ts:3-5,258-585`);
  `compiled-element-v1.test.ts:502` validates the deterministic golden
  fixture with both. Rerun at audit SHA: exit 0 (18 passed).

### D2 — VOID_TAGS list mirror — JUSTIFIED

- Locations: canonical `packages/element/src/internal/core/html-escape.ts:75`;
  duplicated tag lists inside both `program.ts` copies (documented in the
  diff comment at `compiled/program.ts:387-389`: no import edge by design,
  "must stay byte-identical … the convergence guard test enforces that").
- Canonical owner: `core/html-escape.ts`.
- Reason: import-free exchange artifact (ADR-0148).
- Parity proof: `void-tags-convergence.test.ts` (byte-identity guard, issue
  #1220 M4). Rerun: exit 0.

### D3 — `when` operator triple evaluation — JUSTIFIED

- Locations: `compiled/runtime.ts:401`, `compiled/server/index.ts:335`
  (runtime/claim and server serializer evaluation sites), plus the operator
  closure in both validators.
- Canonical owner: Part Program v1 `ConditionOperator` declaration (closed to
  `'greater-than'` in both program copies).
- Reason: server serialization and runtime/claim are alternative executors
  over one program (registry row "SSR initial DOM, fresh DOM, claim and
  activation").
- Parity proof: `when-operator-convergence.test.ts` (#1220 M3) pins both
  validators' operator closure and both evaluation sites' exact comparison
  expression. Rerun: exit 0.

### D4 — HTML text-node escaping (`escapeText`) — GAP (finding F3)

- Locations: `compiled/runtime.ts:1137-1139` and
  `compiled/server/index.ts:108-110` — private, currently byte-identical
  (`&`→`&amp;`, `<`→`&lt;`, `>`→`&gt;`). Distinct contracts exist elsewhere
  and are NOT this duplicate: `escapeHtml` (`html-escape.ts`, additionally
  escapes quotes) and the sanitizer's entity-preserving `escapeText`
  (`element/src/sanitize.ts:187`, documented twin at `html-escape.ts:44`).
- Canonical owner: none named. Attribute escaping has one
  (`html-escape.ts:53`, shared import at `server/index.ts:36` and
  `compiled/runtime.ts:17`); text-node escaping has no registry row and no named owner.
- Reason (implicit): same as D3 — two serializers, no shared private module
  for the reduced contract.
- Parity proof: partial. `compiled-escape-parity.test.ts` (#1220 L1) pins
  BYTE-identical output for the attribute corpus only; text-node parity is
  covered only at DOM level (`part-program-v1-conformance.test.ts` drives
  `runtime.ts`'s serializer; the claim suites drive `server/index.ts`'s).
  A drift confined to `>` escaping in text nodes would not be caught by any
  rerun test found.
- Verdict: §4.3 elements 1 and 3 incomplete → audit FAILURE per §4.3.
  Severity assessment for the thinker: behavioral risk currently low (copies
  byte-identical, DOM-level parity exists); remediation is registration plus
  a byte-level text corpus (or convergence onto one helper).

### D5 — Route file-convention grammar and static-first declaration ordering — REGISTRY GAP (finding F1)

- Locations: `route-scanner.ts:108-134` (`parseRouteFilePath`: `[id]`→`:id`,
  `[...path]`→`:path{.+}` per #556, index stripping, `api/` classification,
  `_`-special files) and `route-scanner.ts:333-345` (sort: special files last,
  then static-before-dynamic, then lexicographic).
- Why it is not a second semantic owner of RouteTable's surface: matching,
  params, query, base and trailing policy are all in `RouteTable`
  (`route-table.ts:143-224`); the scanner never matches. What the scanner
  DOES own is a different surface — the file-convention declaration grammar
  and the declaration order that RouteTable's index-based precedence honors
  (`route-table.ts:176-184,199`). That surface has exactly one producer and
  every transport (SSG, request-time codegen, SPA manifest via
  `route-manifest.ts:63-66`) consumes its output order, so no divergence
  exists in practice.
- Parity evidence observed: `route-scanner-*.test.ts`,
  `route-manifest.test.ts` (incl. catch-all → `:slug{.+}` at
  `route-manifest.test.ts:144`), and dev-vs-build semantic parity
  (`request-time-parity.test.ts`, exit 0, full permission set).
- Verdict: §3.3 — a live semantic surface with no registry row is "a defect,
  not a gray zone". Not a §4.3 duplicate failure (there is no second
  implementation); a registration failure.

### D6 — Renderer scope predicate mirror — GAP (finding F2)

- Locations: `entry-route-helpers.ts:24-27` (`rendererScopeMatches`,
  codegen-time filter used at `entry-codegen.ts:336` and
  `entry-not-found-codegen.ts:63`) and the generated runtime re-expression
  `__matchingRenderers` emitted by `renderMatchingRenderersFn`
  (`entry-route-helpers.ts:33-44`, consumed at `entry-render-ssg.ts:115`).
  The source comment says the runtime function "must mirror these semantics
  exactly".
- Canonical owner: `rendererScopeMatches` (the TS predicate).
- Reason: generated entries are self-contained and cannot import adapter
  internals, so the predicate is re-expressed as generated JavaScript — a
  derived projection, an executor role the constitution recognizes.
- Parity proof: NONE FOUND. No test imports `rendererScopeMatches` or
  evaluates `__matchingRenderers`; `grep` across `packages/adapter-vite/__tests__`
  for both names returns nothing. Behavioral coverage is asymmetric:
  `entry-renderer.test.ts:160-168` exercises a scoped renderer on the codegen
  side only; no test renders a scoped route through the SSG `renderRoute`
  runtime path; the request-time fixture carries no scoped `_renderer.ts`.
  A predicate drift (e.g. trailing-slash or case handling) would be silent.
- Verdict: §4.3 element 3 missing → audit FAILURE per §4.3. Severity
  assessment: the predicate is three lines and mechanically emitted from the
  same declaration list, so current divergence risk is low; remediation is a
  binding test over a scope corpus applied to both sites.

### D7 — Route dialect converter alias chain — NOT A DUPLICATE

`html-route-utils.ts:2` is the single definition;
`public-build-runtime.ts`/`build-utils.ts` re-export it;
`ssg-helpers.ts:111` aliases it by assignment. No second copy.

### D8 — Public version literals — JUSTIFIED

- Locations: `tools/project-constants.ts:5` (`PACKAGE_VERSION`), five
  `packages/*/deno.json` manifests, embedded `packages/create/src/version.ts:2`,
  `www/app/data/version.ts`.
- Canonical owner: package manifests + project-constants (registry row
  "Public metadata and package interface").
- Reason: the embedded create version exists "so packed npm installs are
  self-contained" (`packages/create/src/version.ts:1`); it is rewritten mechanically by
  `tools/bump-version.ts:203-212`.
- Parity proof: `packages/create/__tests__/cli.test.ts:79-89` ("embedded CLI
  version matches its package manifest"; "Create and all five packages share
  one release version") — rerun exit 0; `deno task docs:check-version-anchors`
  exit 0 (§5).

### D9 — Action/outcome classification projections — NOT DUPLICATES

`classifyActionResult` has one definition (`authoring.ts:183`). The SPA
imports it (`spa.ts:253`); the generated Hono action runtime imports it from
`@openelement/app` (`entry-orchestrator.ts:116`, call at
`entry-action-runtime.ts:66`). The 3xx→303 PRG coercion in the generated
runtime is the App-documented projection (`authoring.ts:69`). The App
normalizer (`internal/action-error.ts`) returns stable shapes and does not
classify.

### D10 — Compiled context lifecycle service — EXECUTOR, NOT A DUPLICATE

`compiled/runtime/context.ts` owns subscription lifecycle only; provider
discovery is delegated to `consumeContext`/`provideContext`
(`signal-context.ts`), which is the sole project bridge to the
`context-request` protocol. Lit interop, reconnect and disposal rerun green
(`signal-context.test.ts`, exit 0).

### D11 — SSR registry stub marker — JUSTIFIED

Single contract module `protocol/ssr-registry-markers.ts`; the writer is
generated code and readers live in Element/App with no import edge by design
(header comment lines 1-19). Renames cannot drift because the name has
exactly one definition.

### D12 — Dual `serializeToHtml` (seed vs server serializer) — JUSTIFIED (with F3 caveat)

- Locations: `compiled/runtime.ts:1248` (alpha.0 seed serializer) and
  `compiled/server/index.ts:651-660` (seed-compatible wrapper over
  `serializeProgramContent`/`serializeCompiledProgram`).
- Canonical owner: registry row "SSR initial DOM, fresh DOM, claim and
  activation" names Element's compiled server/runtime/claim semantics over
  one program and explicitly accepts alternative executors; the server
  module's header states `serializeProgramContent` "matches the alpha.0 seed
  serializer's inner-output contract" (`server/index.ts:1-8`).
- Parity proof: `part-program-v1-conformance.test.ts` binds the seed
  serializer's output to fresh-DOM structure and claim behavior (exit 0);
  `compiled-escape-parity.test.ts` pins byte-identical attribute output
  across both (exit 0); claim suites drive the server serializer (exit 0).
  Text-node byte parity rides on finding F3.

### D13 — Legacy hydration markers — OBSERVATION

`protocol/hydration-markers.ts:12-24` (`data-signal`, `data-eid`, …) has no
production consumer at the audit SHA; compiled claim uses program anchors
(`oe:pN`, `compiled/program.ts:336-337`). Only `DATA_SSR_PROPS` remains
publicly re-exported (`element/src/index.ts:87`) while `app/preact.ts:14`
documents the channel as gone. Dead marker constants retained in a protocol
module plus a public re-export of a removed channel — flag for the re-baseline
to record as removed-or-deprecated; not a live second owner.

### D14 — Sanitizer escape twin — NOT A DUPLICATE (different contract)

`sanitize.ts` carries its own entity-preserving `escapeAttr`/`escapeText`
with an explicit "intentionally NOT … do not consolidate" contract note
(`element/src/sanitize.ts:193-203`) cross-referenced from `html-escape.ts:44`. Different
observable contract, different surface.

## 4. Findings the thinker must act on

- **F1 (§3.3, registration):** register the route file-convention grammar and
  scanner declaration ordering (owner: `route-scanner.ts`) in
  `docs/current/SEMANTIC_OWNERSHIP.md`, or record why the existing route rows
  cover it. No second implementation exists; parity evidence is green.
- **F2 (§4.3, parity proof missing):** renderer scope predicate mirror
  (D6). Add a binding corpus test over `rendererScopeMatches` and the
  generated `__matchingRenderers`, or converge. Blocker-class per §4.3 until
  tracked.
- **F3 (§4.3, owner + parity proof missing):** text-node `escapeText`
  duplicate (D4). Name the owner (registry row), add a byte-level text corpus
  across both serializers, or converge onto one helper. Blocker-class per
  §4.3 until tracked.
- **Observation O1:** `route-manifest.ts:34` documents catch-all as
  `/products/*` while the tested behavior is `/products/:slug{.+}`
  (`route-manifest.test.ts:144`). Stale source comment.
- **Observation O2:** legacy hydration markers and the public `DATA_SSR_PROPS`
  re-export outlive their channel (D13). Re-baseline should record their
  status.
- **Observation O3:** the registry's Alpha.9 baseline predates Alpha.10
  surfaces (intrinsic recognition, §2 divergence 1) and Alpha.10 convergence
  guards (§2 divergence 6). Re-baseline is already the declared plan; this
  audit confirms it is required for #1222 acceptance.

Per packet rules the auditor does not file or close issues; F1-F3 are
reported here for the thinker to issue-track before Beta.1 closes
(constitution §6.2: a phase that closes with an unresolved §4.3 failure has
not closed).

## 5. Commands and exit codes

All at audit SHA `c4b484602b793a1ccc22317fa9e6f2603446b8b4`, macOS arm64,
Deno 2.x. Scoped test commands used
`deno test --allow-read --allow-write --allow-env --allow-net --allow-run [--allow-ffi --allow-sys] <paths>`.

| Command (scoped paths abbreviated)                                                                                                                                       | Exit                                           |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| `git rev-parse HEAD` → `c4b48460…`, `git status --porcelain` → empty                                                                                                     | 0                                              |
| element suite: `packages/element/__tests__/` (all)                                                                                                                       | 0 — 246 passed (11 steps), 0 failed            |
| app suite: `packages/app/__tests__/` (incl. `client-router.test.ts` native/polyfill corpus)                                                                              | 0 — 99 passed                                  |
| create suite: `packages/create/__tests__/cli.test.ts` (version parity)                                                                                                   | 0 — 52 passed                                  |
| `part-program-validation-adversarial` + `when-operator-convergence` + `void-tags-convergence` + `compiled-element-v1`                                                    | 0 — 18 passed (29 steps)                       |
| `compiled-escape-parity` + `part-program-v1-conformance` + `signal-context` + `html-escape`                                                                              | 0 — 17 passed (11 steps)                       |
| `compiled-runtime/` + `module-analysis` + `compiler-semantic-core-boundary` + `compiler-fail-closed-matrix` + `compiler-source-map-v3` + `compiler-intrinsic-provenance` | 0 — 116 passed                                 |
| `ssg-admission-parity` + `request-time-admission-parity` + `route-scanner-*` + `entry-renderer` + `entry-descriptor`                                                     | 0 — 106 passed (9 steps)                       |
| `route-manifest` + `static-paths` + `route-scanner-enhance` + `route-scanner-mdx`                                                                                        | 0 — 28 passed                                  |
| adapter suite (full): `packages/adapter-vite/__tests__/`, full permission set                                                                                            | 0 — 756 passed (94 steps), 0 failed, 1 ignored |
| `request-time-parity.test.ts` (dev Hono vs build Nitro), full permission set                                                                                             | 0 — 1 passed (23 steps)                        |
| `ssg-admission-parity.test.ts` alone, full permission set                                                                                                                | 0 — 4 passed                                   |
| `deno task fmt:check`                                                                                                                                                    | 0                                              |
| `deno task lint`                                                                                                                                                         | 0                                              |
| `deno task docs:truth`                                                                                                                                                   | 0                                              |
| `deno task docs:check-version-anchors`                                                                                                                                   | 0 (included in docs:truth)                     |
| `deno task text-integrity:check`                                                                                                                                         | 0                                              |
| `deno task docs:check-role-neutral`                                                                                                                                      | 0                                              |
| `deno task release:evidence:check`                                                                                                                                       | 0                                              |
| `deno task interface:snapshot`                                                                                                                                           | 0                                              |
| `deno task package-surface:check`                                                                                                                                        | 0                                              |

Environment note: an earlier batch run WITHOUT `--allow-ffi --allow-sys`
failed 6 tests with rolldown "Cannot find native binding" errors
(`ssg-admission-parity`, `build-ssg-bundle-url`, `index-plugin`,
`v044-delivery/island-delivery`, `request-time-parity`, one mdxPlugin case).
Root cause is Deno's native-binding load requiring the full task permission
set, not the code: every one of the six passed on rerun with the full
permission set, and the full adapter suite is green (above). No BLOCKED
evidence remains.

Not rerun in this audit (heavy deployment/browser gates; recorded green in
Alpha.10 closure evidence at `4c3fd116` and unchanged since per the closure
record): `nitro:proof:node/workers`, `fixture:request-time:e2e:browsers`,
Playwright browser suites. Their surfaces were covered here by the
corresponding deterministic suites.

## 6. Overall verdict

**FAIL** — in the strict constitution sense, not the behavioral sense.

- The rebuilt matrix confirms single ownership for every registry-registered
  surface; every parity proof cited for surviving duplicates (D1, D2, D3, D8,
  D12) reruns green at the audit SHA. No behavioral divergence between any
  duplicate pair was observed anywhere in this audit.
- Three findings fail the letter of §3.3/§4.3: F1 (unregistered route
  file-convention/ordering surface), F2 (renderer scope mirror without
  parity proof), F3 (text-escape duplicate without named owner or byte-level
  text corpus). §4.3: "A duplicate-looking implementation missing any element
  fails the audit: it is either removed or tracked as a blocking issue before
  the phase that contains it may close." F1-F3 are reported precisely above
  for the thinker to issue-track; all three are justification/registration
  remediations, not semantic repairs.
- #1222 acceptance ("matrix rebuilt from source with observable evidence;
  every duplicate either justified per constitution 4.3 or issue-tracked as a
  blocker") is met by THIS REPORT once the thinker issue-tracks F1-F3; the
  audit question "is the v0.44 core trustworthy enough to freeze as the
  product baseline" answers: behaviorally yes at the audit SHA, formally no
  until F1-F3 carry §4.3-complete records.
