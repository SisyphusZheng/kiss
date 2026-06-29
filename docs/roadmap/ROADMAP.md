# openElement Roadmap

> Source of truth for forward version planning.\
> Current package line: v0.41.0-alpha.5 SPA Mode + Deno Desktop Reader Proof.\
> Active version plan: docs/current/VERSION_PLAN.md.\
> Updated: 2026-06-19.

Mandatory workflow: `docs/governance/PROJECT_WORKFLOW.md`.

## Product Position

openElement now centers on two primary products:

```text
openElement = Web Components Fullstack Framework + Basic Element
supporting packages = Protocols + UI + official stack adapters
```

The Web Components fullstack framework owns application concepts: route graph,
request context, render pipeline, layouts, islands, assets, deployment, and
desktop targets. Vite, Hono, Nitro, and Deno Desktop are official defaults, but
they enter through OpenElement-owned contracts.

Basic Element is the native Web Components authoring surface. Its public surface
is `@openelement/element` and `OpenElement`, competing with Lit and FAST while
keeping shadow/DSD as the default render mode and explicit light DOM opt-in.

UI and Protocols support those products. UI is the Open Props-backed reference
component library and dogfood surface, not a separate design-system empire.
Protocols are the runtime-free replacement boundary for renderers, routes,
islands, adapters, runtime, cache, data, sessions, forms, and signals.

Historical positioning note: earlier ADRs used the phrase DSD-first to protect
shadow/DSD output as the default. ADR-0096 refines that into Web Components
application framework identity, with shadow/DSD as the default render mode and
light DOM as first-class opt-in.

Vite + Hono + Nitro remain default Framework engines/drivers, not first-class
products. `@openelement/core`, `@openelement/adapter-vite`,
`@openelement/signal`, `@openelement/ssg`, and advanced feature packages support
the two products without replacing them.

Distribution policy is npm-first. npm is the only planned registry truth for
future releases; JSR is not part of the required release closure path. Deno
support is proven through `npm:` consumer smoke, and browser-safe exports are
verified through jsDelivr smoke from npm artifacts. GitHub remains the canonical
source, issue/PR surface, CI runner, and npm trusted publishing bridge for the
near term because it gives the lowest-cost path to discoverability and release
provenance. Codeberg/Forgejo are a future source-sovereignty target, not a
v0.41-v1.0 blocker.

## Version Ladder

| Version         | Name                                               | Goal                                                                                                                                                                 | Status                   |
| --------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| v0.30.x         | Contract cleanup                                   | Architecture and package contract cleanup                                                                                                                            | Done                     |
| v0.31.0         | JSX-first Application API                          | App authoring API, `/vite` config split, docs/template DX                                                                                                            | Done                     |
| v0.32.0         | App Lifecycle Contract                             | Route, load, context, layout, error, redirect lifecycle                                                                                                              | Done                     |
| v0.33.0         | AI-Readable API Foundation                         | Structured page, island, head, route, and render intent APIs                                                                                                         | Done                     |
| v0.34.0         | AutoFlow2 Sidecar Kernel                           | Workflow state, cells, evidence ledger, allowed-action report                                                                                                        | Done                     |
| v0.35.x         | AutoFlow2 Mechanical Autonomy                      | Harness Gate, Cell Execution, Evolution Loop, full-auto evidence                                                                                                     | Done                     |
| v0.36.0         | Rendering Runtime, Deployment & Deferred Refactors | Rendering runtime evidence, docs, ISR, SSG Phase 1, parallel SSG, AutoFlow cell base                                                                                 | Done with deferred items |
| v0.36.1         | AutoFlow Closure & v0.36 Release Truth             | Windows-safe AutoFlow tests, real merged cell metrics, release truth alignment                                                                                       | Done                     |
| v0.36.2         | SSG Bridge Migration + Rendering Evidence Closure  | Move Vite-free SSG render/postprocess code into `@openelement/ssg`; keep adapter-vite as Vite shell                                                                  | Done                     |
| v0.36.3         | Complete SSG File Ownership Migration              | Move route scanner, entry generator, Vite plugin, generated data resolver out of adapter-vite                                                                        | Done                     |
| v0.36.4         | Firefox/WebKit Cross-Browser Proof                 | Resolve Firefox/WebKit timeout and behavior differences; establish cross-browser E2E gate                                                                            | Done                     |
| v0.36.5         | Release Truth and AutoFlow Closure                 | Align workflow, release docs, AutoFlow evidence, and website truth                                                                                                   | Done                     |
| v0.37.0         | Product Doctrine + Rendering Contract Reset        | ADR-0091, default 0JS doctrine, DSD/shadow default, light opt-in terms, v0.37.x SOP split                                                                            | Done                     |
| v0.37.1         | DsdElement Shadow + Light Contract                 | Explicit DsdElement light DOM opt-in with SSR/CSR proof                                                                                                              | Done                     |
| v0.37.2         | SSR / ISR Server Runtime Contract                  | Request-time SSR/ISR runtime boundary, cache contract, server adapter evidence                                                                                       | Done                     |
| v0.37.3         | Data / Database Boundary                           | Data/database adapter contracts and recipes without built-in ORM ownership                                                                                           | Done                     |
| v0.37.4         | Hygiene + Pure CSS UI + Architecture Decoupling    | Close code-quality debt, pure CSS UI, ui/router decoupling, dsd-hydration dedup, test supplementation, autoflow:gate                                                 | Done / JSR caveat        |
| v0.37.5         | Protocol-First Runtime Architecture                | Make @openelement/protocol the replacement boundary and define Vite + Nitro as the default base engine                                                               | Done                     |
| v0.37.6         | Vite + Nitro Runtime Proof                         | Prove openElement routes, rendering, islands, assets, SSR/ISR intent, and deployment output through Nitro                                                            | Done                     |
| v0.38.0         | Product Surface Reset and Hardening                | Public package/API/product surface reset based on protocol and Nitro runtime evidence                                                                                | Done                     |
| v0.39.0         | Framework RC + Four-Product Matrix Reset           | ADR-0099, public docs integrity, Elements direction, starter/deploy/consumer gates, Preact island handoff                                                            | Done                     |
| v0.40.4         | Elements + Preact + Repository Slimming            | Productize `OpenElement`, prove Preact islands, collapse to 11 packages, singular public names, 0 explicit any, AutoFlow3-only governance, SSG engine extraction     | Released                 |
| v0.40.6         | Audit-Driven Quality Cleanup                       | Close audit gaps: test hardening for element/ui, internal file splits, error-handling unification, assertion cleanup, naming-debt removal, adapter-vite cleanup      | Released                 |
| v0.40.7         | Release Readiness & CI Hardening                   | Harden v0.40.6 release infrastructure: Deno E2E server, CI browser install, credential gating, local release escape hatches                                          | Released                 |
| v0.41.0-alpha.1 | npm Distribution + Audit Cleanup                   | Replace JSR release closure with npm via `deno pack`; audit-driven cleanup and protocol restoration; ship first npm/JSR dual-published alpha.                        | Released                 |
| v0.41.0-alpha.2 | Signal-DOM Deepening                               | Extract `HydrationScope` to `@openelement/core/hydrate`; renderer/activation split; `BindingDescriptor` registry; static subpath validation.                         | Released                 |
| v0.41.0-alpha.3 | Third-party WC in OpenElement                      | Consume Lit/Shoelace/Material Web Components inside openElement; document interop contract; pure-ESM/pure-ECMAScript npm quality gates.                              | Merged                   |
| v0.41.0-alpha.4 | OpenElement in Fresh                               | Prove openElement components inside Fresh through the lightweight client runtime and Preact island proof.                                                            | Released                 |
| v0.41.0-alpha.5 | SPA Mode + Deno Desktop Reader Proof               | First-class single-page-application mode with client-side router; WeRead-style Deno Desktop reader backed by local/open fixtures; no WeRead private API integration. | PR hardening             |
| v0.41.0-alpha.6 | App Protocol Architecture Hardening                | Make App own RouteGraph/RenderPipeline/RequestContext; keep Vite/Hono/Nitro as official adapters; promote Reader into regression dogfood.                            | Planned                  |
| v0.41.0-alpha.7 | Mac Mastodon Desktop Incubation                    | OpenElement + Deno Desktop macOS social/IM-shaped dogfood app; accountless Mastodon/GoToSocial reading first, no OAuth/DM/notifications yet.                         | Planned                  |
| v0.41.0-beta.1  | v0.41.0 Stabilization                              | Close alpha feedback, update docs/starters/examples, freeze public surface for v0.41.0.                                                                              | Planned                  |
| v0.41.0         | WC fullstack framework + Basic Element proof       | Stable npm-first distribution, hardened signal-DOM architecture, validated WC integration, SPA reader proof, architecture hardening, and desktop app incubation.     | Planned                  |
| v0.42.0         | Server Primitives                                  | Add server request/action primitives and prove Node + Workers runtime paths through Nitro                                                                            | Planned                  |
| v0.43.0         | Data + Cache Primitives                            | Add loader/action/data/cache contracts and recipes without built-in ORM ownership                                                                                    | Planned                  |
| v0.44.0         | Forms + Mutations                                  | Add progressive-enhancement forms, action result serialization, validation protocol, and island handoff                                                              | Planned                  |
| v0.45.0         | Session + Auth Recipes                             | Add signed session primitives and official auth recipes without becoming an auth platform                                                                            | Planned                  |
| v0.46.0         | Database + Storage Recipes                         | Prove SQLite/libSQL, Postgres, D1, KV/R2-style recipes without selecting a default database                                                                          | Planned                  |
| v0.47.0         | Deployment Hardening                               | Harden Node, Workers, npm, jsDelivr, Deno `npm:`, cache headers, ISR/SWR, and runtime smoke gates                                                                    | Planned                  |
| v0.48.0         | Product DX + Docs Freeze                           | Freeze docs shape, starter templates, examples, and smoke-backed learning path                                                                                       | Planned                  |
| v0.49.0         | v1.0 Freeze Candidate                              | Freeze public package graph, exports, server/data/forms/session/cache protocols, and release gates                                                                   | Planned                  |
| v1.0.0          | Stable Web Components Full-stack Framework         | Stable npm-first Elements, UI, Framework, Protocols, server/data/forms/session/cache primitives, and auth/database recipes                                           | Vision                   |

## v0.41.0 - WC Fullstack Framework + npm Distribution

Strategic realignment: Vite+ upstream (voidzero-dev/vite-plus#1888) declined to
add Deno as a first-class package manager. Instead of pushing upstream, v0.41.0
uses Deno 2.8+ `deno pack` to build npm-publishable tarballs directly from the
Deno-first workspace. openElement keeps Deno as the project development and
release environment, while npm becomes the single registry truth for consumers.

Beyond distribution, v0.41.0 also hardens the signal-DOM architecture and proves
that openElement can both consume and be consumed by the broader Web Components
ecosystem. It also proves the SPA/Desktop app path and then hardens the app
protocol architecture around official Vite/Hono/Nitro/Deno Desktop adapters.
This work is staged through alpha lines and one beta before the stable
v0.41.0 tag.

Core work:

- Toolchain:
  - Require Deno 2.8+ for `deno pack` support.
  - Convert all internal `@openelement/*` imports from `jsr:` to `npm:`
    specifiers in workspace `deno.json` files.
  - Add `deno task pack` / `deno task publish:npm` that topologically packs and
    publishes the 11-package graph in dependency order.
  - Add `deno task pack:dry-run` for CI validation.
  - Add pure-ESM / pure-ECMAScript quality gates (`publint`,
    `attw --profile esm-only`, and custom static scans) to the release pipeline.
- Runtime-agnostic boundaries:
  - Move `FileIsrCache` from `@openelement/core/isr` to
    `@openelement/ssg/file-isr-cache` because it requires filesystem access.
  - Make `router/src/page-loader.ts` accept raw markdown instead of reading
    files with `Deno.readTextFile`.
  - Add a CI gate that fails if runtime-free product packages
    (`core`, `element`, `ui`, `protocol`, `signal`, `router`, `app`) use
    `Deno.*` APIs in `src/`.
- Signal-DOM architecture:
  - Extract hydration lifecycle into a standalone `@openelement/core/hydrate`
    entry point.
  - Split renderer from activation layer (`jsx-render-dom.ts` emits descriptors;
    `binding-activation.ts` owns effect lifecycle).
  - Replace the central `BindingDescriptor` switch with an internal registry of
    small binding factories.
- Cross-framework Web Components:
  - Prove that Lit, Shoelace, and Material Web Components render, hydrate, and
    remain interactive inside an openElement app.
  - Document the interop contract between openElement components and standard
    Custom Elements.
- External framework consumption:
  - Provide a lightweight client runtime so openElement components can be used
    in third-party frameworks such as Deno Fresh.
- Adapter-vite and starter template:
  - Default `createOpenJsrPackageResolverPlugin` to npm mode: let Vite resolve
    `@openelement/*` from `node_modules` instead of fetching TS source from JSR.
  - Keep JSR source-resolution as an explicit opt-in (`registry: 'jsr'`).
  - Update `@openelement/create` to emit `npm:@openelement/*` imports and
    resolve remote package versions from the npm registry.
- Release flow:
  - Replace JSR publish with `deno pack` + `npm publish --provenance` in
    `tools/autoflow/release.ts`.
  - Add `actions/setup-node` to `.github/workflows/autoflow-release.yml` and
    pass `secrets.NPM_TOKEN` as `NODE_AUTH_TOKEN`.
  - Keep dual npm/JSR publishing; JSR acts as a strictness signal, npm as the
    primary distribution channel.
  - Keep `jsr-consumer-monitor.yml` and `wait-jsr-release-metadata.ts` as
    historical observation tools, not release gates.
- Consumer smoke:
  - Add npm-registry consumer smoke for Node ESM, Deno `npm:`, jsDelivr CDN, and
    Nitro Node/Workers output.
  - Add third-party WC smoke for Shoelace and Material Web Components.
  - Add Fresh example smoke for openElement component hydration.
  - Add Deno Desktop reader smoke for the alpha.5 desktop practice proof.
  - Defer Tauri 2 / Electron SPA smoke until after the Deno-first proof is
    stable.

Exit criteria:

- `deno pack --dry-run` succeeds for all 11 packages.
- Generated tarballs contain no `jsr:` or `@jsr/` specifiers.
- npm trusted publishing succeeds from GitHub Actions with provenance.
- A generated openElement app installs and builds from npm packages only.
- Pure-ESM / pure-ECMAScript gates pass for every npm artifact.
- Third-party WC libraries render and hydrate inside an openElement app.
- A Fresh example project SSRs and hydrates an openElement component.
- A Deno Desktop reader example mounts, navigates, persists reading preferences,
  and creates a local annotation without SSR.
- Release notes describe npm as the current distribution truth and document
  cross-framework WC interop.

Non-goals:

- No Node runtime migration for openElement development.
- No npm/pnpm/yarn lockfile as the workspace source of truth.
- No further upstream Vite+ Deno PM advocacy in v0.41.0.
- No removal of existing JSR published versions.
- No server/data/forms/session/cache primitives (deferred to v0.42.0+).

## v0.41.0-alpha.1 - Cleanup-Train Patch

Patch release that removes the legacy Linear UI compatibility surface and
extends the audit-driven cleanup to type assertions and non-null assertions.
Executed under the v0.40.x cleanup-train authority from ADR-0105.

Scope:

- Remove `open-button-linear`, `open-card-linear`, `open-input-linear`,
  `open-nav-linear`, `open-badge-linear`, and `linear-token-sheet` from
  `@openelement/ui` public exports, subpath exports, manifest declarations,
  tests, and documentation.
- Migrate `www/app/islands/scroll-reveal.tsx` from `linearTokenSheet` to
  `openPropsTokenSheet`.
- Update UI README and design docs to state there is no Linear compatibility
  layer.
- Adjust E2E server strategy: enable `reuseExistingServer` outside CI to avoid
  local failures from a residual Deno server on `127.0.0.1:4174`; allow the
  static server to fall back to an isolated port when the default port is
  occupied.
- Maintain 0 explicit `any` and reduce unnecessary `as unknown as` and non-null
  assertions in production code, tests, and tools. Replace ad-hoc test casts
  with typed helper/fake DOM interfaces where practical.
- Split or converge the largest redundancy hotspots in `open-layout.tsx`
  navigation/theme/search helpers and `components.test.ts` fake DOM/test
  helpers.
- Extract repeated error formatting and generated runtime `console.*` fragments
  to use existing `error` / `logger` boundaries while preserving intentional
  CLI/tool console output.
- Bump workspace versions to `0.41.0-alpha.1` and publish the v0.41.0-alpha.1 cleanup record.

Non-goals:

- No new product feature.
- No package additions or removals (count stays 11).
- No default runtime / signal-engine / renderer changes.
- No git history rewrite.

## v0.41.0-alpha.2 - Signal-DOM Deepening

Architecture-review follow-up deferred from alpha.1. Extract hydration lifecycle
into a standalone `@openelement/core/hydrate` entry point, split the renderer
from the activation layer, and replace the broad `BindingDescriptor` union with
a registry of small binding factories. Validate the `static`/`hydrate`/`csr`
subpath split with at least one real static-only consumer.

Scope:

- Candidate 3 — `HydrationScope`:
  - Create `packages/core/src/hydration-scope.ts`.
  - Export `HydrationScope` from `@openelement/core/hydrate`.
  - Refactor `OpenElement` to hold one scope instead of three private collections.
  - Move hydration logic that does not depend on `OpenElement` into core.
  - Add isolation tests for `@openelement/core/hydrate`.
- Candidate 1 — Renderer / Activation Split:
  - Make `jsx-render-dom.ts` a pure translator that emits `BindingDescriptor`s.
  - Move all signal effect lifecycle into `binding-activation.ts`.
  - Add `SHOW`/`FOR` lifecycle as `conditional`/`list` binding kinds.
- Candidate 2 — `BindingDescriptor` Registry:
  - Define factory constructors (`bindText`, `bindAttr`, `bindClass`, `bindEvent`,
    `bindRender`, `bindConditional`, `bindList`).
  - Replace the central switch in `applyBindingDescriptor()` with an internal
    registry.
- Static subpath validation:
  - Migrate one real static-only consumer to `@openelement/core/static`.
- Safari adoptedStyleSheets follow-up:
  - Audit token-sheet adoption and apply the chosen theme fix.

> ✅ Shipped 2026-06-24. All three architecture candidates landed, static subpath
> validated with `open-button`, Safari theme-color fixed via `openPropsRootSheet`.

Non-goals:

- No public JSX syntax changes.
- No new product features.
- No third-party WC integration (deferred to alpha.4).

## v0.41.0-alpha.3-alpha.4 - Web Components Interop Proofs

Alpha.3 and alpha.4 close the cross-framework Web Components proof loop:

- alpha.3 proves mature third-party Web Components inside an OpenElement app:
  Lit, Shoelace, Material Web Components, nested WC behavior, events, slots,
  theming, SSR-safe paths, and pure-ESM / pure-ECMAScript package quality gates.
- alpha.4 proves OpenElement components inside a third-party framework, starting
  with Fresh and the lightweight `@openelement/core/hydrate` runtime.
- The Preact island bridge remains optional island authoring, not the default
  OpenElement UI model.

Detailed execution lives in:

- `docs/release/v0.41.0-alpha.3-plan.md`
- `docs/release/v0.41.0-alpha.4-plan.md`

Non-goals:

- No React/Vue/Svelte adapter expansion in alpha.3-alpha.4.
- No server/data/forms/session/cache primitives.
- No Reader or Deno Desktop work before alpha.5.

## v0.41.0-beta.1 - Stabilization

Close alpha feedback loops, update docs and starters, and freeze the public
surface for the stable v0.41.0 tag.

Scope:

- Address regressions and API rough edges discovered during alpha.2-4.
- Update `README`, `STATUS`, starter templates, and examples to reflect v0.41.0
  capabilities.
- Freeze public package exports and subpath contracts.
- Run the full release gate matrix end-to-end.

Non-goals:

- No new product features.
- No package additions or removals.

## v0.40.7 - Release Readiness & CI Hardening

Patch release that hardens the v0.40.6 release infrastructure without changing
public API or package topology. Executed under the v0.40.x cleanup-train
authority from ADR-0105.

Scope:

- Replace the Python `http.server` E2E fixture with a Deno static server that
  supports directory indexes, `.html` pretty URLs, and SPA fallback.
- Add an `OPEN_ELEMENT_E2E_OFFLINE=1` escape hatch for local E2E runs.
- Relax local-only E2E timeouts for slower Windows dev boxes.
- Gate JSR publish, wait-metadata, post-publish smoke, and GitHub release steps
  on the presence of required credentials.
- Install Playwright browsers explicitly in GitHub Actions workflows.
- Grant `--allow-env` to AutoFlow3 task invocations.
- Repair workspace mappings in `consumer-local.ts` for `@openelement/router` and
  `@openelement/core/prop`.
- Skip `smoke-deploy` when Cloudflare credentials are absent.

Non-goals:

- No public API changes.
- No package additions or removals.
- No default runtime / signal-engine / renderer changes.
- No new product features.
- No git history rewrite.

## v0.40.6 - Audit-Driven Quality Cleanup

Patch release to close the internal quality gaps identified by the 2026-06-15
architecture audit (`docs/audit/2026-06-15-architecture-audit.md`). Executed
under the v0.40.x cleanup-train authority from ADR-0105 and recorded in
ADR-0106.

Scope:

- Test hardening for `element` and `ui` to close the most critical coverage gaps.
- Split over-large source files into smaller internal modules without changing
  public exports.
- Unify error formatting and error handling across packages.
- Reduce unsafe non-null assertions and type assertions at SSR/DSD boundaries.
- Remove historical `less` / `LessJS` naming debt from internal identifiers,
  comments, and virtual module prefixes.
- Simplify `adapter-vite` internals without changing the public Vite plugin API.
- Clean up ad-hoc `console.*` usage.

Non-goals:

- No public API changes.
- No package additions or removals.
- No default runtime / signal-engine / renderer changes.
- No new product features.

## v0.36.0 - Rendering Runtime, Deployment & Deferred Refactors

Delivered signals documentation, deployment recipes, version sync, error
boundary retry/degraded fallback coverage, FileIsrCache, `@openelement/ssg`
Phase 1 package work, parallel SSG evidence, and AutoFlow built-in cell
generation.

Deferred after v0.36.0:

- complete adapter-vite migration out of adapter-vite;
- expanded Firefox/WebKit execution proof;
- broader server/data/UI/starter/Hub product closure.

## v0.36.1 - AutoFlow Closure & v0.36 Release Truth

Patch release for v0.36 release truth and AutoFlow evidence:

- fixed generated AutoFlow tests on Windows by using path-safe APIs;
- treated `harness:passing` as an intermediate state, not release proof;
- counted only `merged` cells as successful for evolution metrics;
- recorded real v0.36.1 metrics from `cell-v0.36.1-001`;
- aligned `STATUS`, `ROADMAP`, SOP, NextVersion, changelog, release note, and
  package count/version evidence;
- kept v0.37 server/data/UI/starter/Hub product scope deferred.

## v0.36.2 - SSG Bridge Migration + Rendering Evidence Closure

Patch release for bridge migration and rendering evidence:

- move Vite-free `ssgRender()` and SSG render types into `@openelement/ssg`;
- move SSG postprocess helpers for client scripts, CSP, DSD polyfill, View
  Transitions, and Speculation Rules into `@openelement/ssg`;
- keep adapter-vite as the Vite orchestration shell for SSR bundle build,
  virtual entry generation, route scanning, alias/noExternal, generated data
  resolution, and plugin composition;
- keep adapter-vite compatibility re-exports for migrated SSG APIs;
- add direct SSG render/postprocess tests, adapter bridge tests, FileIsrCache
  persistence coverage, ISR manifest cache-key proof, and Streaming DSD
  Response coverage;
- record real v0.36.2 metrics from `cell-v0.36.2-001`: attempted 1, merged 1,
  firstPassRate 1.

## v0.36.3 - Complete SSG File Ownership Migration

Completed the SSG ownership migration:

- moved route scanner and route type generation into `@openelement/ssg`;
- moved virtual entry generator, SSG-specific Vite plugins, generated data
  resolver, and package resolver into `@openelement/ssg`;
- removed bridge-only adapter-vite exports once the new import paths were stable;
- kept adapter-vite as Vite build orchestration glue;
- bumped all 20 packages to 0.36.3.

## v0.36.4 - Firefox/WebKit Cross-Browser Proof

Closed cross-browser E2E proof:

- investigated Firefox search/theme token wait behavior;
- investigated WebKit console and stability failures;
- documented browser-specific limitations in the v0.36.4 NextVersion package;
- added cross-browser E2E proof to the release gate shape;
- bumped all 20 packages to 0.36.4.

## v0.36.5 - Release Truth and AutoFlow Closure

Implemented patch. It fixes repository evidence, not product code:

- point `workflow:check` at the active v0.36.5 execution package;
- complete missing v0.36.4 NextVersion files;
- align STATUS, ROADMAP, SOP index, changelog, release notes, and website copy;
- record v0.36.3/v0.36.4 AutoFlow evidence where repository proof exists;
- update stale v0.21.x SOP Gate workflow wording.

## v0.37.0 - Product Doctrine + Rendering Contract Reset

v0.37.0 is a docs, ADR, SOP, and contract-audit version. It replaces the old
single-version Server/Data/UI closure epic with a v0.37.x validation train.

The reset establishes:

- static routes emit zero framework JavaScript unless islands, hydration, or
  client-only components are explicit;
- SSR and ISR are framework core capabilities, not a fifth product;
- DSD/shadow DOM remains the default rendering mode;
- light DOM is an explicit opt-in contract, not an accidental side effect of
  `dsd: false`, `hydrate: "only"`, or pure-island behavior;
- database work enters through data/database boundaries and recipes, not a
  built-in ORM;
- AutoFlow remains execution and evidence tooling, not a decision-maker for
  APIs, packages, licenses, database defaults, security defaults, merges, tags,
  or releases.

## v0.37.1 - DsdElement Shadow + Light Contract

Define `DsdElement` as the elements product surface without prematurely
claiming all current behavior as light DOM support.

v0.37.1 accepts ADR-0092 and adds `static renderMode = 'light'` as the explicit
light DOM opt-in. The default remains shadow/DSD.

- audit lifecycle, property reflection, events, DSD output, hydration, and SSR
  assumptions;
- define shadow/DSD default behavior;
- design explicit light DOM opt-in semantics and migration notes;
- add contract tests before documenting light DOM as supported.

## v0.37.2 - SSR / ISR Server Runtime Contract

Treat SSR and ISR as framework core capability.

- define request-time SSR handler boundaries;
- validate ISR cache and manifest behavior in server contexts;
- map Hono-first behavior while leaving room for future server adapters;
- record zero-JS defaults for static routes and explicit client JS triggers.

v0.37.2 accepts ADR-0093 and adds a small `@openelement/core/isr-runtime`
contract for request-time ISR response flow. It does not choose a hosting
provider, cache backend, database, auth system, or server framework default.

## v0.37.3 - Data / Database Boundary

Define data/database integration without becoming an ORM or auth platform.

- specify data adapter and recipe boundaries;
- keep concrete database choices external, adapter-based, or recipe-based;
- add minimal test fixtures for memory/file and candidate platform recipes;
- require ADR review before any default database or migration story.
- close the 2026-06-10 `main` Publish to JSR hotfix so release-gate evidence
  can recover from partially published immutable JSR versions and reach
  consumer-smoke proof after code validation is green.

## v0.37.4 - Hygiene + Pure CSS UI + Architecture Decoupling

Implemented as a bounded hygiene and foundation release:

- fix 2026-06-10 audit code-quality issues, including authoring error
  interpolation and scoped logger usage;
- remove deprecated adapter-vite SSG shell exports after moving ownership into
  `@openelement/ssg`;
- deduplicate shared dsd-hydration helpers across adapters;
- decouple `@openelement/ui` from `@openelement/router`;
- validate a CSS-first UI product surface independent from element behavior;
- extract daisyUI-inspired class sets as DSD-compatible pure CSS with Open Props
  tokens and no Tailwind runtime;
- prove the signal -> host attribute -> `:host([attr])` interactive thin-shell
  pattern with `open-dropdown`, `open-modal`, and `open-tabs`;
- supplement tests across ssg, router, and protocols.

Release-truth note: v0.37.4 implementation, tag, and GitHub release exist.
ADR-0097-era policy treated live JSR visibility as an external distribution
concern rather than a version-exit gate. JSR state still had to be recorded
honestly; release notes could not claim JSR availability unless direct resolver
checks proved it.

Distribution note: failed 2026-06-11 recovery attempts proved a 5-minute
package timeout and then a 20-minute package timeout are both too short for
JSR's then-current publish behavior. Publishing continued through local or CI
attempts under ADR-0097-era caveats, while roadmap execution continued after
local gates, AutoFlow evidence, and non-JSR CI were correct.

## v0.37.5 - Protocol-First Runtime Architecture

Make `@openelement/protocol` the real replacement boundary and accept
ADR-0096: Protocol-First Vite + Nitro Runtime Architecture. ADR-0098 defines
the EntryDescriptor route manifest contract required before Nitro can consume
route semantics without importing SSG implementation modules.

v0.37.5 repositions openElement as a Web Components application framework
powered by Vite + Nitro. Vite may be the deep default build/module graph engine,
and Nitro may be the deep default production runtime/deployment engine, but the
protocol layer stays frontend-framework-agnostic and runtime-agnostic.

Core work:

- move or re-export runtime-free renderer, component adapter, route manifest,
  island, signal, data, runtime adapter, cache, and storage contracts into
  `@openelement/protocol`;
- add conformance test entry points such as `runRendererConformance(impl)`;
- write the EntryDescriptor / route manifest ADR before route protocol
  migration;
- document the openElement universal request handler shape required by Nitro;
- preserve daisyUI interactive/form component coverage as a later UI product
  slice after the runtime pivot.

### Superseded v0.37.5 Backlog Trace

Complete daisyUI interactive component coverage and migrate protocol types.

### daisyUI Interactive Completion (12 components)

- collapse (accordion): DsdElement thin shell, signal `#open` index, `:host([data-open])` CSS
- drawer: DsdElement thin shell, signal `#open`, slide-from-left with backdrop
- carousel: DsdElement thin shell, signal `#index`, snap-scroll + prev/next buttons
- swap: DsdElement thin shell, signal `#active`, two-face toggle with rotation
- toast: DsdElement thin shell, signal `#toasts[]`, position-fixed stack with auto-dismiss
- navbar: DsdElement thin shell, responsive collapse menu
- footer: pure CSS component (no interaction, just layout)
- indicator: pure CSS component (badge positioning on avatars/icons)
- skeleton: already in v0.37.4 daisy-classes.css; no additional work
- loading: already in v0.37.4 daisy-classes.css; no additional work
- chat bubble: pure CSS component
- toggle (theme switch wrapper): DsdElement thin shell

### Form Enhancement Components (4 components)

- checkbox: DsdElement thin shell, signal `#checked`, custom ::before/::after
- radio: DsdElement thin shell, signal `#checked`, radio group via slot
- range: DsdElement thin shell, signal `#value`, custom track/fill via CSS
- file-input: DsdElement thin shell, signal `#file`, drag-and-drop zone

### Protocol Type Migration

- migrate `RendererProtocol` (from core/src/render-schemas.ts)
- migrate `IslandConfig` / `HydrationStrategy` (from app/src/authoring.ts, core/src/schemas.ts)
- migrate `SignalEngine` / `SignalLike` (from signals/src/types.ts, core/src/signal-like.ts)
- migrate `DataAdapter` (from core/src/data.ts)
- write ADR for `EntryDescriptor` route manifest contract
- add exportable conformance test suites: `runRendererConformance(impl)`

## v0.37.6 - Vite + Nitro Runtime Proof

Prove the new default engine with a narrow real application. v0.37.6 is
released at tag `v0.37.6` and GitHub release
`https://github.com/open-element/openelement/releases/tag/v0.37.6`. Local,
`dev`, and `main` non-JSR gates passed; JSR publish ran under the ADR-0097-era
distribution policy.

- generate an openElement universal request handler and mount it in Nitro;
- prove Node output and Cloudflare Workers output;
- verify openElement file routes, `load()`, layouts, error/redirect/not-found,
  API routes, static assets, island chunks, and explicit client JS triggers;
- map ISR/cache intent to Nitro cache or route-rule primitives without replacing
  openElement semantics;
- verify static zero-JS output remains true for routes without explicit islands;
- keep Hono as a viable request/API route implementation detail where useful;
- record evidence before v0.38 package/product reset.

### Superseded v0.37.6 Backlog Trace

Prove the first composed framework path after the preceding contracts exist.

- create or update a preset smoke app using the stabilized surfaces;
- verify static zero-JS output, explicit islands, SSR/ISR evidence, data recipe
  boundaries, and CSS UI integration;
- verify adapter-lit passes protocol conformance suites using only
  `@openelement/protocol` imports (protocol layer proof);
- keep the smoke narrow enough to be repeatable in local and CI gates.

## v0.38.x - Product Surface Reset and Hardening

Package/product surface reset with evidence from the v0.37.x validation train.
Human review remains required for public API resets and package removals.

Governance convergence before v0.38 exit:

- gate tiers: fast dev gate (fmt, lint, typecheck, test) for PRs; full release
  gate (all 16 checks + E2E) for publishing;
- AutoFlow feature scope freeze: report/check/health only - no new evolve,
  generate, or autonomous capabilities;
- Hub scope deferral to post-v1.0; Hub remains internal tooling through v0.38.
- JSR release instability mitigation: keep direct registry visibility checks,
  ADR-0097-era publish attempts, release-note caveats, and fallback
  publishing/distribution options in the release design.

ADR-0099 supersedes the v0.38 candidate package-name deferral for future work.
It approves the four-product matrix and the future `@openelement/element`
product name, while leaving package implementation for v0.39 follow-up tasks.

## v0.39.0 - Framework RC + Four-Product Matrix Reset

Validate the release-candidate framework surface on top of the v0.38 product
map while resetting the public product matrix before v1.0 API freeze work
begins.

The line proves that a generated openElement app can use the documented
first-run surface end to end: app authoring, pages, layouts, islands, API
routes, static/SSR/ISR intent, Vite + Nitro build/runtime output, docs, deploy
guidance, consumer smoke, and release gates. It also records ADR-0099,
establishes Elements as the Lit/FAST-facing product direction, excludes Web
Awesome from the current target, and hands heavy-framework island planning to a
Preact-first v0.40 proof. The earlier Vue adapter plan is superseded for the
pre-1.0 path; Vue, React, Svelte, and other heavy island adapters stay frozen
unless a later ADR reopens them.

## v0.40.4 - Elements + Preact + Repository Slimming

Productize the four-product matrix while keeping scope narrow enough for a
credible v1.0 path. The local package line is now `0.40.4`.

ADR-0101 also makes v0.40 the product-line reset. The previous v0.39
architecture state is frozen on `arch/v0.39-line`; `dev` continues as the
focused product-line branch. Active planning moves from separate SOP and
NextVersion dossiers to `docs/current/VERSION_PLAN.md`.

v0.40.4 has two equal exit requirements:

- the product surface becomes real and narrow;
- the repository shape stops contradicting that product story.

The product-surface jobs are:

- create the real Elements product surface around `@openelement/element` and
  `OpenElement`, with migration notes instead of a long-term public
  `DsdElement` alias;
- add Preact as the only heavy-framework island priority, reflecting the
  Fresh/Deno lineage without making Preact the identity of openElement;
- use `@preact/signals-core` as the default `SignalEngine` behind
  `@openelement/signal`, with `alien-signals` retained as an optional engine.

The Repository Slimming jobs are:

- keep root free of generated output and Hub registry data;
- remove Hub from the active product line, including `packages/hub`, root Hub
  index data, Hub routes, and Hub-specific workflow/tasks;
- shrink active docs to current truth, ADR, release evidence, roadmap/status,
  and archive index, with `docs/current/VERSION_PLAN.md` as the only active
  v0.40 execution plan;
- reduce the workspace package graph from 21 packages to the 11-package current
  surface in `docs/current/PACKAGE_SURFACE.md`;
- reduce hook and CI orchestration to AutoFlow3 entry points. v0.40 still
  records the historical JSR publish shape, but v0.41 replaces release closure
  with npm artifacts, npm trusted publishing, Deno `npm:` smoke, and jsDelivr
  smoke.

Current implementation removes Hub/RPC/CEM/compat-check/interop adapter
packages and collapses standalone runtime/style-sheet/i18n packages while
retaining `@openelement/ssg` as the adapter-agnostic SSG engine. Workflows stay
at four active files, active docs stay at current truth plus ADR,
roadmap/status, release evidence, and archive index, and
`deno task package-surface:check` verifies the 11-package surface. Nitro Node
and Workers proofs remain part of the v0.40 gate matrix. ADR-0102 also adds
`@openelement/element` as the first-class Elements package.

The v0.40 non-goals are explicit: Hub remains frozen, Vue/React/Svelte island
expansion stays out of scope, Web Awesome remains out of the current UI
strategy, Fresh is not adopted as a router/server runtime, and no Preact
runtime may leak into `@openelement/core` or Elements as a required public
dependency. Further package deletion, package merges, new packages, default
runtime changes, and future default signal-engine changes still require
ADR-backed human approval.

## v0.42.0 - Server Primitives

> Migration note: `@openelement/app/preact` will move to a dedicated
> `@openelement/adapter-preact` package once cross-framework island work begins.

Move from application framework toward full-stack framework by adding the
server primitives that pages, API routes, actions, and adapters share.

Core work:

- add `@openelement/app/server` as the public server authoring surface;
- define request handler, middleware, route action, response helper, and request
  context boundaries;
- ensure page routes and API routes share the same context model;
- prove Node and Workers runtime paths through Nitro;
- avoid choosing a hosting provider or replacing Nitro as the default runtime
  engine.

## v0.43.0 - Data + Cache Primitives

Add data and cache contracts without becoming an ORM.

Core work:

- add `@openelement/app/data` for loader/action data flow;
- strengthen protocol data/cache contracts for typed results, redirects,
  errors, notFound, cache keys, revalidation, and invalidation;
- keep memory/file cache adapters as test baselines;
- provide D1, Postgres, and libSQL recipes as smoke-tested integrations, not
  default database choices.

## v0.44.0 - Forms + Mutations

Make the write path usable with and without client JavaScript.

Core work:

- add `@openelement/app/forms`;
- support progressive-enhancement form submissions;
- define action result serialization and validation error shapes;
- allow client islands to receive and enhance server action results;
- keep validation libraries external and recipe-based.

## v0.45.0 - Session + Auth Recipes

Add session primitives and official auth recipes without becoming an auth
platform.

Core work:

- add `@openelement/app/session`;
- provide signed cookie/session primitives;
- define how request context exposes session and authenticated user state;
- add official username/password and OAuth-style recipes;
- keep user tables, RBAC, provider ownership, and account policy outside the
  framework.

## v0.46.0 - Database + Storage Recipes

Prove real storage paths through recipes while keeping database ownership
outside the framework.

Core work:

- add smoke-backed recipes for SQLite/libSQL, Postgres, Cloudflare D1, and
  KV/R2-style object storage;
- document that migrations belong to the chosen database/tooling stack;
- prevent database dependencies from entering `core`, `element`, or `ui`.

## v0.47.0 - Deployment Hardening

Turn full-stack capability into repeatable deployment evidence.

Core work:

- harden Node and Cloudflare Workers presets;
- make Nitro output proof part of release evidence;
- verify CDN/cache headers, ISR/SWR, static asset manifests, and island chunk
  manifests;
- keep npm, jsDelivr, Deno `npm:`, Node, and Workers smoke in the release gate.

## v0.48.0 - Product DX + Docs Freeze

Freeze the learning path and starter story before API freeze.

Core work:

- restructure docs around Getting Started, Elements, UI, App/server, Data/cache,
  Forms/actions, Session/auth, Deploy, and Migration;
- add minimal app, blog app, and full-stack app starter templates;
- ensure docs examples are backed by smoke tests or snapshots;
- remove future-tense claims from current docs.

## v0.49.0 - v1.0 Freeze Candidate

Make the final pre-v1 breaking pass.

Core work:

- freeze public package graph and exports;
- freeze server, data, forms, session, and cache protocols;
- remove or explicitly mark experimental public APIs;
- audit external consumers, install size, dependency graph, and release gates.

## v1.0.0 - Stable Web Components Full-stack Framework

API freeze for npm-first Elements, UI, Framework, and Protocols with proven
server, data, forms, session, cache, auth recipe, and database recipe paths.
AutoFlow evidence remains part of default release gates, while ADR and human
review govern public API, package, license, security, database, tag, release,
and publish decisions.

## v0.41.0-alpha.5 - SPA Mode + Deno Desktop Reader Proof

Add a first-class single-page-application mode for desktop-style shells
(Deno Desktop first; Tauri 2, Electron, and Capacitor-style embedded WebViews
remain follow-up targets). openElement's default remains SSG/SSR-first, but
alpha.5 proves the same component model works when there is no server and no
pre-rendered HTML. The desktop proof is a WeRead-style reader app backed by
local/open fixtures, not a WeRead API integration.

Core work:

- Add `defineApp({ mode: 'spa' })` to `@openelement/app`.
- Client-side router:
  - History-based navigation (`pushState`/`popstate`).
  - `auto` mode that selects hash navigation for `file://` and history for
    HTTP(S).
  - Route params, query strings, and guards without a server route manifest.
- Runtime bootstrap:
  - Mount the app shell into a plain DOM node (no DSD template required).
  - Fully client-render on first load.
  - Dispose and remount on hot reload during development.
- Data layer for SPA:
  - In-memory loader/action data context.
  - Optional async route guards.
- Validation:
  - Deno Desktop example project under `examples/deno-desktop-spa/`.
  - Product-shaped reader proof under `examples/deno-desktop-reader/`.
  - Native browser import map in the served HTML so the example does not rely
    on bare npm specifier resolution.
  - E2E smoke for bookshelf render, open-book navigation, route params, reading
    preferences, and local note creation inside the desktop shell.
- Reader product slice:
  - `/` bookshelf route.
  - `/books/:id` reading route.
  - `/notes` annotation route.
  - `/search` local search route.
  - `/settings` reading preferences route.
  - Persist progress, theme, font size, and line height through browser-native
    storage.
  - Use only synthetic or public-domain text fixtures.

Non-goals:

- No attempt to make SSG/ISR features work inside SPA mode.
- No server primitives (deferred to v0.42.0+).
- No official mobile shell in alpha.5.
- No Tauri 2 or Electron proof in alpha.5.
- No WeRead private API, account cookies, scraping, or copyrighted book
  content.
- No Mastodon/GoToSocial API integration in alpha.5; the social practice train
  is deferred until after alpha.6 architecture hardening.

## v0.41.0-alpha.6 - App Protocol Architecture Hardening

After alpha.5 proves SPA mode and the Deno Desktop Reader, alpha.6 turns the
lessons into a cleaner framework architecture. The goal is to keep
Vite/Hono/Nitro/Deno Desktop as official defaults while making OpenElement own
the contracts they implement.

Core work:

- App ownership:
  - `@openelement/app` owns RouteGraph, RequestContext, RenderPipeline, layout,
    island, asset, error, and output concepts.
  - Hono is the official request/server driver over those concepts.
- SSG/build ownership:
  - SSG exposes OpenElement render-engine concepts before Hono/Vite details.
  - Vite is the official dev/build and asset-manifest adapter.
- Deployment ownership:
  - Nitro is extracted or surfaced as an explicit deploy adapter.
  - Node and Workers proofs execute generated output in real target runtimes.
- Package boundaries:
  - `@openelement/content` splits Vite-free content core from Vite plugin glue.
  - Hydration and manifest contracts distinguish Basic Element conveniences
    from generic third-party WC compatibility.
- Desktop target:
  - Deno Desktop becomes a first-party OpenElement app target contract.
  - Native shell verification is tracked separately from localhost browser E2E.
- Reader dogfood:
  - Reader becomes the regression-grade app for OpenElement UI, Open Props,
    Preact islands, third-party WC compatibility, local/GitHub sources, PDF/text
    reading, annotations, note jumps, export, search, and desktop behavior.

Detailed execution lives in `docs/release/v0.41.0-alpha.6-plan.md` and GitHub
issues #145 through #154.

## v0.41.0-alpha.7 - Mac Mastodon Desktop Incubation

After alpha.6 validates the App/protocol architecture and first-party Deno
Desktop target contract, alpha.7 starts the OpenElement + Deno Desktop macOS
Mastodon/IM incubation project.

This is the second dogfood app after Reader:

- Reader proves local-first reading, notes, sources, PDF/text rendering, and
  desktop ergonomics.
- Mac Mastodon Desktop proves a networked desktop social app loop: remote
  public APIs, timeline/profile/status reading, cache/error/rate-limit states,
  desktop navigation, and app-shell reuse.

Alpha.7 stays deliberately narrow:

- macOS/Deno Desktop shell.
- Instance selector for Mastodon/GoToSocial-compatible public instances.
- Public timeline.
- Profile page.
- Status detail / thread reading.
- Local saved accounts/statuses as a bookmark-like feature.
- Basic search where public instance APIs support it.
- Reuse Reader/app-shell learnings for sidebars, panels, settings, keyboard
  flow, local cache, and verification.

Deferred until later framework primitives:

- OAuth/session flow.
- Direct messages.
- Notifications.
- Streaming/background sync.
- Compose, reply, favorite, boost, or any authenticated mutation.
- Encrypted credential storage.

Detailed execution lives in `docs/release/v0.41.0-alpha.7-plan.md`.

## Explicit Non-Goals

| Item                              | Decision                                                  |
| --------------------------------- | --------------------------------------------------------- |
| Built-in ORM                      | External adapters and recipes only.                       |
| Generic auth platform             | External integrations only.                               |
| React-like default runtime        | Web Components remain the default; adapters may exist.    |
| String renderer                   | JSX/VNode/RenderNode only.                                |
| Silent compatibility shims        | No. 0.x may break.                                        |
| Autonomous architecture decisions | No. ADR, API reset, package removal require human review. |
| Abstract protocol theater         | No. Protocols require baseline implementations and tests. |

## Document Cross-Reference

| Document Type    | Rhythm          | Location                       |
| ---------------- | --------------- | ------------------------------ |
| Current plan     | active version  | `docs/current/VERSION_PLAN.md` |
| ADR              | decision-driven | `docs/adr/`                    |
| Changelog        | per release     | `docs/changelog/`              |
| Status           | always current  | `docs/status/STATUS.md`        |
| Release evidence | per version     | `docs/release/`                |
| Historical plans | archived        | `docs/sop/`, `docs/next/`      |
