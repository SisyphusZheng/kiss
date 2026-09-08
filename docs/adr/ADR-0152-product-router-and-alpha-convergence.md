# ADR-0152: Element / Router cores, reference UI and public 1.0 Alpha

- Status: ACCEPTED (2026-09-07, explicit maintainer direction)
- Supersedes: ADR-0151's future release topology; upstream-only URLPatternList
  policy in #1324; cleanup-only-at-Beta.2.3 sequencing; previous file-only Router
  proposal. Historical release evidence remains unchanged.
- Preserves: ADR-0148 compiler/Vite boundary, exact-SHA release evidence,
  protected promotion and release GO requirements, human RC/Stable authority.
- Tracking: [#1341](https://github.com/open-element/openelement/issues/1341).

## Context

Current package/tool boundaries obscure product responsibilities. Repeated route,
request, document and governance owners increase maintenance work. The maintainer
originally approved a three-working-day convergence target using existing implementations,
with continuous deletion and a real application slice before public Alpha admission.
The 2026-09-08 refinement below replaces that schedule with acceptance checkpoints.

## Decision

### Products and dependencies

The core products are Element and Router. UI is dogfood and a reference implementation. Element owns compiled Web Components
execution, serialization and DOM claim/update. UI is a selected component reference
built on Element, independent of Router. It validates authoring, interoperability
and real application use; it does not promise a comprehensive design system. Router has two modes:

- Route Mode consumes explicit records; its matching core is independent of
  Element, Hono, Vite and filesystem access.
- Framework Mode defaults to file routing and adds page data, forms, Document,
  Native or Lit rendering integration, navigation, SSR/SSG and official Vite integration. UI is optional; Lit support is an acceptance target, not shipped evidence.

Explicit and generated records converge on one RouteTable/RouteResolution.
File paths own generated route paths; no duplicate `route.path` declaration.
Composition declares mount boundaries, deterministic order and collision behavior.
Explicit order is preserved; file generation owns its documented ordering policy.
A selected URL record owns its method map: unsupported methods return 405 rather
than falling through to a different URL pattern. Query parameters and path captures
stay separate. Public browser projections exclude server handlers and host bindings.

Products are not package counts. Existing `app`, `adapter-vite` and `create` remain
implementation/distribution/tooling surfaces until a justified migration changes
exports. No mandatory package renaming or new broad UI design system is implied.

### Maintainer refinement: two core products and independent Element delivery

The 2026-09-07 follow-up refines the earlier three-product wording: Element and
Router are the core products; Framework Mode belongs to Router. UI is dogfood and
reference implementation, alongside the website/representative consumer application.
Its current package may remain available without an independent design-system
roadmap. Do not force two physical npm packages or replace all UI in this sprint.

The private compiler has an explicit distribution path through Element tooling;
published artifacts cannot depend on unpublished workspaces. Compiler and runtime
meet at versioned generated artifacts. Router tooling reuses Element's build path,
never defines component semantics or ships a duplicate compiler. Separate build,
browser, server and declaration entry graphs; preserve source maps and compiler
source diagnostics. Public tooling subpaths are permitted without publishing a
stable compiler API or hiding Vite behind a second configuration system.

Standalone qualification means author -> compile -> pack -> ordinary HTML consumer,
without Router or a workspace alias. A lightweight Element runtime dependency is
allowed; compiler/Node/Vite code must not leak into browser output or browser types.
Foreign CE property/attribute/event/upgrade boundaries need real browser evidence.
Internal foreign SSR/hydration remains component-specific, not a universal DSD
promise. Broader React/Vue/etc. integration matrices are Alpha follow-up work.

### URLPatternList is an independently maintained generic fork

Start from Justin Fagnani's `url-pattern-list` v0.5.0, source commit
`4911e649cc11860c7da90c9d0d9b05626c5cbb83`, with verified MIT attribution and a
compact provenance/divergence record. Own list indexing, ordered traversal,
differential tests and measured performance. Luca Casonato's proposals inform
structured matching and conservative fallback; they are not merged production
Deno implementations to transplant.

URLPattern remains the platform/polyfill single-pattern grammar and capture
owner. Candidate pruning must not discard a valid earlier match; final `exec`
cannot recover a candidate already discarded by an incorrect index. Unproven
optimizations use a conservative candidate path merged in the same sequence order.
The linear reference oracle belongs in tests. No global API injection, claimed
standard polyfill, public tree/parser contract, or full replacement URLPattern
engine. Initial route tables may be rebuilt and atomically replaced; complex
incremental mutation and speculative native/WASM optimization are deferred.

References: [Justin's source](https://github.com/justinfagnani/url-pattern-list),
[Luca's proposal](https://github.com/whatwg/urlpattern/pull/166),
[Deno experiment](https://github.com/denoland/deno/pull/14502).

### Framework responsibility

Hono owns HTTP Context/middleware/Response integration without a second page
winner. Useful page-data/form abstractions share one request lifecycle; preserve
validation errors, status, redirects and serialization boundaries. Document owns
resolved page meaning; each qualified rendering integration owns serialization. Native
reuses Element; Lit does not depend on the Native compiled-artifact protocol. Layouts compose presentation without
a second data scheduler. Vite owns the official build/development integration.

SSG may read external build-time data; personalized results must not become public
static output. Sitemap/search use eligible public route identity/catalog data,
not an enumeration of private request-specific Documents. Navigation coordinates
abort, stale results, history and required browser fallbacks.

### Continuous reduction

Every replacement retires its displaced implementation, callers, compatibility
layers, duplicated facts and obsolete checks/docs in the same verified change.
Cleanup begins in Beta.2.1, continues in Beta.2.2 and closes in Beta.2.3. Measure
owners, execution hops, custom scripts/tasks/checkers and retained obligations;
line deletion is not a quota. Preserve required behavior with regression evidence,
not permanent duplicate paths. Git is the default operational-history archive.

The obsolete `check-v044-orchestration` script/test/task is retired with this
planning change: it pins current documents to completed Alpha workspace IDs and
withdrawn Beta scheduling. Current workflow, version/release truth and exact-SHA
release gates remain; no replacement historical-topology checker is introduced.

### Release topology and timebox

```text
published v0.44.0-beta.2
  -> beta.2.1 Router/core + continuous cleanup
  -> beta.2.2 Native/Lit Framework Mode + Document + continuous cleanup
  -> beta.2.3 dual-mode hardening + cleanup closure + application admission
  -> public v1.0.0-alpha.1 and subsequent Alpha iterations
  -> evidence-gated v1.0.0-rc.1
  -> separately admitted Stable
```

The former Beta.3 lane becomes 1.0 Alpha; its unfinished work remains tracked.
Historic v0.44 alpha workspace IDs remain internal/unpublished. Public 1.0 Alpha
uses npm `alpha`; npm `latest` stays on the last admitted stable release.

The 2026-09-08 maintainer refinement replaces the three-day target with acceptance
checkpoints: Beta.2.1 foundation/fork/repairs, Beta.2.2 Native/Lit Framework Mode,
Beta.2.3 dual-mode hardening and cleanup/admission. No automatic Beta.2.4 or deadline
waiver. The active version plan owns the detailed scope and matrix.

### Maintainer refinement: fork governance and Lit (2026-09-08)

Maintain `open-element/url-pattern-list` as a public source-traceable fork with its
own qualified releases. OE pins a built package version and removes its embedded
production duplicate. Generic fixes/tests/benchmarks go upstream without blocking
OE delivery; returning to the official dependency is optional. RouteRecord, HTTP,
loader/action and rendering lifecycle never enter this generic library. Ordered
first-match is a legitimate generic capability, not an OE-only concern.

Native and Lit are first-class Router Framework Mode targets. Prove both complete
application flows before extracting a minimal shared execution protocol. Rendering,
SSR and client continuation remain integration-specific. Formal support requires
packed consumers, documentation and an explicit runtime matrix; DSD/CEM do not prove
hydration or provider compatibility. No third renderer or speculative public adapter
framework is required. Product independence is proven through dependency graphs.

Native navigation owns only admitted application navigation: unowned POST forms,
fragments in history mode and reload remain browser-owned. SSG discovers canonical
records, not Hono's incidental route list. Every mounted lifecycle gets a fresh
controller. Final review must actually execute; the #1343 insufficient-balance
comment is missing review evidence even if its workflow wrapper is green.

## Acceptance and consequences

[#1340](https://github.com/open-element/openelement/issues/1340) owns Alpha admission:
matching/HTTP correctness, a packed real-app flow, SSR/SSG/claim/navigation/forms,
server/client separation, required runtime/browser coverage, cleanup and exact
candidate release evidence. Cloudflare is the first integration target; Node and
Deno retain full qualification in their agreed contract, Bun/Nitro their smoke
scope, Chromium/Firefox/WebKit their required browser coverage. Missing evidence
is never a pass. Broader benchmarks, prolonged application qualification and UI
expansion do not block entry unless they expose a core correctness failure.

Release automation must implement the new successor/channel distinction (#1323,
#1334) before publication. This ADR and its documentation PR do not change package
versions, publish artifacts, grant Stable readiness, or claim runtime migration
has already happened. Planning may change now while code still implements the
published baseline; outstanding implementation is visible in the issue graph.

## Alpha/RC refinement (2026-09-08)

The maintainer approves evidence-driven Alpha architecture iteration followed by RC
contract freeze. #1179 real application qualification starts after Alpha admission,
not after RC; #1243 admits RC and #1178 freezes its artifacts. #1234 freezes each
qualification round's identity, not the entire Alpha design. Candidate changes require
explicit evidence invalidation/requalification; no mixed-artifact PASS claim.

Native/Lit share application semantics but have separate renderer/runtime qualification.
Element JFB is not Router/Lit evidence. Independent onboarding, promised migrations and
fork maintenance are Alpha qualification obligations. One substantial application plus
equivalent journeys in the other mode suffices; two full SaaS products are not required.

RC freezes the admitted public contracts, supported matrix and exact dependency set.
Keep fourteen-day soak, install/upgrade/security, triage and human GO. Architecture
changes return to Alpha; fixes/dependency updates create new qualified candidates.
Stable is 1.0.0 with the actual admitted packages. Old 0.44/five-package/0.41-waiver
wording does not govern this release; historical evidence remains unchanged.

## Upstream-contribution priority in Beta.2.x (2026-09-08)

The maintainer prioritizes the path most likely to yield sustained useful upstream
contributions over locally optimal speed or configuration size. Select WTR for browser
conformance because Lit/Modern Web share it; qualify with the existing compiled ESM
path and retain Playwright application E2E/Deno runtime tests. A lower-glue alternative
alone does not overturn this selection. Concrete correctness/distribution/integration
blockers require an explicit plan reassessment.

Keep recipient-native harnesses: Node tests for URLPatternList, WTR for Lit/browser
reproductions and Oxc's tests for compiler fixes. Preserve fork provenance and minimize
unnecessary divergence. Record generic reproduction/patch boundaries and OE-only
semantics, with no PR quota, invented bug or dependency on upstream response. Local
truth consolidation may have no upstream patch. Beta.2.2 Oxc/TS7 work is feasibility;
full backend migration remains a separately qualified Alpha change. Existing #1343
correctness/review blockers and release gates are unchanged.
