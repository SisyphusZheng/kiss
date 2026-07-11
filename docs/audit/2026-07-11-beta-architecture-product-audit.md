# openElement beta architecture and product audit

Date: 2026-07-11\
Scope: repository and published `0.41.0-alpha.8` capability\
Change policy: this document records findings and a proposed beta plan only; no
runtime implementation is changed by this audit.

## Executive decision

openElement has a credible rendering kernel and unusually broad release
verification for a project at this maturity, but it is not ready for a stable
`v0.41.0` freeze. The largest risk is no longer missing framework features. It
is that callers must understand too much implementation structure while several
claimed architecture interfaces are not on the production path.

The beta window should therefore be a breaking **interface and package-depth
convergence**, not a validation-only rerun. The market position should narrow
from a general-purpose fullstack competitor to:

> A Web Components-native, static-first application framework for teams that
> want Custom Elements to remain the durable UI contract, with JSX authoring,
> Declarative Shadow DOM, selective islands, and Vite/Nitro output.

Basic Element is an adoption mode within that framework, not a second product
that needs an independent roadmap. Deno Desktop, Reader, Mastodon, UI,
AutoFlow, and protocols remain proof or implementation surfaces.

Because npm already contains immutable, partial `0.41.0-beta.1`, `.beta.2`,
and `.beta.3` package sets, the first coherent beta produced by this plan must
be **`0.41.0-beta.4`**. “Beta.1” remains the architecture-stage name in project
planning only.

## Evidence snapshot

### What is healthy

- `deno lint` passes across 440 files.
- Package typechecking passes across all 11 packages and website config.
- The package graph is acyclic and all internal imports are declared.
- Active package source contains no explicit `any`; reviewed unsafe casts are
  gated by an allowlist.
- Runtime-free packages pass the host-API check and do not depend on `Deno.*`
  or `node:*` in their public source.
- The repository has unit, global coverage, critical-path, browser E2E,
  package-artifact, third-party WC, Nitro Node/Workers, Deno consumer, Node ESM
  consumer, and jsDelivr proof surfaces.
- Native DSD is the supported browser baseline and the legacy inline fallback
  is opt-in.
- `0.41.0-alpha.8` is published as a coherent 11-package npm set with
  provenance and the `alpha` dist-tag.

These are real assets. Beta should preserve them while testing through a much
smaller public interface.

### Scale and interface cost

| Area           | Source LOC | Test LOC | Export subpaths | Observation                                                               |
| -------------- | ---------: | -------: | --------------: | ------------------------------------------------------------------------- |
| `adapter-vite` |      4,035 |    7,394 |              14 | high test investment, but many internal helpers remain public             |
| `app`          |      1,120 |    2,641 |               6 | authoring is small; model abstractions are mostly test-only               |
| `content`      |      1,237 |      745 |               8 | exposes Vite glue despite separate Vite adapter                           |
| `core`         |      5,588 |    5,883 |              22 | implementation kernel leaks through many author imports                   |
| `create`       |        209 |      568 |               1 | small implementation, but packaged CLI is not actually runnable           |
| `element`      |      1,165 |    1,971 |               3 | intended facade still re-exports knowledge from core/protocol/signal      |
| `protocol`     |      1,566 |      142 |              17 | wide contract surface with little direct behavioral proof                 |
| `router`       |        485 |      776 |               5 | most behavior belongs to app; root is data-context state                  |
| `signal`       |        166 |      435 |               2 | one fixed implementation behind a replaceability-shaped seam              |
| `ssg`          |      4,942 |    2,292 |               2 | substantial engine, but its driver interfaces have one production adapter |
| `ui`           |      6,072 |    1,481 |              23 | largest package; mixes reusable primitives and website-specific artifacts |

The workspace exposes **103 package subpaths** across 11 packages. Package
source is approximately 26.6k lines and package tests approximately 24.3k
lines. Test volume is strong, but interface depth is weak: the canonical
starter declares imports for every package and both desktop dogfoods map roughly
ten workspace packages directly.

## Findings

### P0 — the published starter does not run

Executing the actual package:

```sh
deno run --minimum-dependency-age=0 -A \
  npm:@openelement/create@0.41.0-alpha.8 audit-app
```

fails while reading `templates/.gitignore`. The npm tarball contains the other
templates but omits that dotfile. Existing local and package-consumer gates did
not execute the published CLI entry through project creation and build.

Additional starter drift:

- the remote CLI resolves dependency versions from npm `latest`, which remains
  `0.41.0-alpha.6`, rather than from the CLI's own coherent release line;
- the template declares all 11 OpenElement packages even though authors should
  use a small facade;
- several `${v.*}` placeholders exist for packages not covered by the template
  replacement map;
- JSX uses `@openelement/core` as its import source, exposing an implementation
  package on the first screen of a generated app;
- separate `build`, `build:client`, `build:ssg`, and Vite tasks expose build
  phases the framework should own.

Decision: beta entry is blocked until the published CLI can create, typecheck,
develop, build, preview, and package a project in a clean directory using one
coherent version manifest.

### P0 — beta version truth is already collided

npm contains `0.41.0-beta.1`, `.beta.2`, and `.beta.3` for eight packages
(`protocol`, `router`, `signal`, `core`, `element`, `app`, `ssg`, `content`).
`create`, `adapter-vite`, and `ui` are missing at all three versions. There is
no coherent beta dist-tag.

Decision: never describe those versions as release candidates. Record them as
withdrawn partial publishes and use `0.41.0-beta.4` for the first complete beta.

### P0 — release evidence can disagree with the real release

`docs/release/autoflow3/v0.41.0-alpha.8.json` still records `status: running`,
no `completedAt`, and pending final Git/tag/release steps even though the tag,
GitHub prerelease, npm packages, and successful workflow exist. A release gate
that can finish without finalizing its evidence is not a source of truth.

Decision: release completion must be transactional and resumable. The workflow
must finalize evidence after the GitHub release, and a post-release verifier
must fail on disagreement among Git, GitHub, npm, docs, and evidence.

### P1 — product positioning overclaims breadth

Astro and Fresh already have mature selective-island stories. Enhance directly
positions itself as an HTML-first fullstack framework with server-rendered
custom elements and database-backed APIs. Lit is the mature Custom Elements
authoring reference and its SSR packages remain explicitly in the Labs family.

OpenElement should not compete on “islands”, “standards”, or “fullstack” alone:

- Astro's official docs position islands and multi-framework rendering as core
  capabilities: <https://docs.astro.build/en/concepts/islands/>.
- Fresh renders islands on server and client and documents Custom Elements as a
  client-registered integration: <https://fresh.deno.dev/docs/concepts/islands>.
- Enhance owns the HTML-first, progressive-enhancement, fullstack Custom
  Elements position: <https://enhance.dev/>.
- Lit documents its SSR DOM emulation as experimental Labs software:
  <https://lit.dev/docs/ssr/dom-emulation/>.

OpenElement's credible differentiation is narrower: Custom Elements are the app
component contract, DSD is the default SSR representation, JSX is the authoring
syntax, and interactive regions upgrade selectively without replacing the
native element model. Deno-first development and Deno Desktop are useful proof
points, not the primary market category.

Until request-time data, forms, sessions, and cache behavior are production
interfaces, public copy should say “static-first application framework with
fullstack output paths”, not imply parity with broad general-purpose fullstack
frameworks.

### P1 — package seams are shallower than their interfaces

The current architecture contains several hypothetical or ceremonial seams:

- `createAppModel()`, `createDefaultRenderPipeline()`, and
  `createRenderPipeline()` are exported but used only by their module and tests;
  the production build does not execute through the claimed app model.
- `createHonoRequestDriver()`, `createViteAssetDriver()`, and
  `createRouteGraphFromEntries()` are exported and tested, but have no second
  production adapter and little production use.
- `@openelement/signal` has one fixed Preact implementation while retaining a
  replacement-shaped package and protocol interface.
- `@openelement/router` exposes render-scoped data state and internal
  compatibility hooks even though `definePage().render(context)` already
  receives data and params.
- `@openelement/content/vite` is Vite-specific while
  `@openelement/adapter-vite` is meant to own Vite integration.
- `@openelement/adapter-vite` has 14 export subpaths and a root compatibility
  re-export for Nitro even though docs classify many subpaths as alpha-internal.
- `@openelement/element`, the intended facade, still makes callers know
  `core`, `protocol`, and `signal` concepts.

By the deletion test, removing several of these interfaces would not spread
complexity across callers; it would remove unused indirection. One adapter is a
hypothetical seam. Beta should merge implementation until real variation
exists, then add a seam only when a second adapter is proven.

### P1 — build behavior is coupled through plugin ordering

`adapter-vite/src/plugin.ts` contains ordering knowledge about content plugin
`buildStart()` execution. `OpenElementBuildContext` is shared mutable phase
state across plugins. This makes build correctness depend on hook timing and
cross-module mutation rather than one deep build module returning artifacts.

Decision: one `buildApp()` interface should accept the app descriptor and
target, execute scan/render/assets/deploy internally, and return a typed result.
Vite hooks become a thin adapter around that interface, not peer owners of
phases.

### P1 — UI mixes product primitives with website artifacts

`@openelement/ui` is the largest package. `open-layout.tsx` is 1,303 lines and
still contains a comment that its details-toggle hack and method can be
deleted. `daisy-classes.ts` is 773 lines despite current Open Props branding.
Several exported elements have no production JSX consumer outside registration
or tests, including callout, dialog, dropdown, modal, step-card, and tabs.
Website-specific `open-lab-*`, `open-standards-visual`, hero, and brand artifacts
share the package with general primitives.

Decision: retain only primitives with an external use case and browser behavior
proof. Move website-only artifacts into `www`, merge duplicate overlay
primitives, and remove compatibility aliases such as duplicate `.js` subpaths.

The current website build strengthens this finding. It admits the whole UI
package as package islands, registers 18 UI declarations, and emits 22 island
entries / approximately 196 KB of client JavaScript. The static output is 210
HTML files / approximately 20 MB, with typical guide pages around 88–91 KB and
roughly 21 KB of injected head content. The same build manifest first prints
“none - zero client JS” for Phase 3 and later reports the real client bundle in
Phase 2. Beta must make this evidence internally consistent and stop package
registration from turning unconsumed reference components into client output.

### P1 — dogfood bypasses the intended public interface

Reader and Mastodon map roughly ten workspace packages directly. Their smoke
tasks use `--no-check`; the tiny `deno-desktop-spa` example still points at
alpha.6. This proves internal integration, not installed adopter experience.

Decision: extract one desktop host harness, retire `deno-desktop-spa`, make
Reader and Mastodon consume packed/public imports, and require typechecking in
their smoke paths. Dogfood should fail when public interfaces regress.

### P2 — tests and gates sometimes preserve implementation shape

The codebase has strong test volume, but some tests read source text or reach
past module interfaces. Architecture gates enforce named declarations and
allowlisted casts; they can pass while those declarations are unused in the
production path. This rewards conformance to the documented shape rather than
observable leverage.

Decision: after deepening a module, replace tests on deleted shallow modules
with tests through the new interface. Keep source-policy gates only for
properties that cannot be proven behaviorally.

### P2 — compatibility and old-code removal is incomplete

Concrete candidates for beta removal or absorption:

- root Nitro compatibility exports from `adapter-vite`;
- `router` internal compatibility hooks;
- deprecated `core/write-json` and `content/write-json` re-export;
- legacy VNode route branch in `app/spa.ts`;
- opt-in legacy inline DSD fallback if the supported browser contract no longer
  justifies carrying it;
- test-only app-model and SSG-driver factories unless wired into production;
- `deno-desktop-spa` example;
- unused UI exports and duplicate dialog/modal abstractions;
- stale alpha plan checklists and release evidence that disagree with registry
  and GitHub state.

Removal must be evidence-driven. “Unused export” means no production caller,
not merely a low text-reference count; dynamic imports and generated entries
must be included in the proof.

## Proposed beta target architecture

### Product interface

```text
openElement = Web Components-native application framework
authoring modes = Basic Element standalone + full application
default path = DSD/static-first + selective islands + Vite/Nitro
```

The framework is one product with two entry depths:

1. `@openelement/element` for standalone native Custom Elements.
2. `@openelement/app` for pages, routes, islands, rendering, and application
   lifecycle on top of Element.

### Proposed published graph

| Package                     | Beta role                                                                                |
| --------------------------- | ---------------------------------------------------------------------------------------- |
| `@openelement/element`      | complete standalone authoring/runtime interface, including JSX runtime and fixed signals |
| `@openelement/app`          | deep application interface, including routing and request/render semantics               |
| `@openelement/adapter-vite` | Vite, content, SSG, Nitro build/deploy implementation behind one build interface         |
| `@openelement/create`       | zero-context consumer entry that pins one coherent release manifest                      |
| `@openelement/ui`           | optional, pruned reference primitives only                                               |

Proposed absorption/removal:

- merge `core`, `signal`, and element-level protocol implementation into
  `element` internals;
- merge `router` and app-level protocol implementation into `app` internals;
- merge `content`, `ssg`, and build-level protocol implementation into
  `adapter-vite` internals until a second real build adapter exists;
- remove `protocol` as a public package; place each interface at the seam owned
  by the module whose behavior it describes.

The five-package target is a planning hypothesis authorized for beta design,
not current implementation truth. It must be validated by a migration spike and
an ADR before code movement. If a package cannot be absorbed without creating a
cycle or losing independent consumer value, the ADR may retain it with a
smaller private-by-default interface.

## Beta success criteria

Stable `v0.41.0` is eligible only when:

- a clean machine can run the published create command and complete dev,
  typecheck, test, build, preview, Node and Workers proof;
- a generated app imports only product packages and never names internal
  implementation packages;
- every retained package and public subpath has a demonstrated external caller;
- every claimed architecture interface executes on the production path;
- compatibility exports and dead code identified above are removed or have an
  explicit owner, consumer, and removal date;
- Reader and Mastodon run against packed/public artifacts with typechecking;
- release evidence is finalized and agrees with Git, GitHub, npm and docs;
- beta.4 is published as one coherent package graph with provenance and a
  verified `beta` dist-tag;
- external pilot #390 completes the same documented path without maintainer
  knowledge and reports no unresolved P0/P1 issue;
- public positioning describes current capability rather than the later
  server/data/forms/session roadmap.

## Recommended order

1. Repair release/version truth and the real npm starter gate.
2. Approve the one-product positioning and target package graph ADR.
3. Build the new facade interfaces first and migrate starter/dogfood to them.
4. Absorb implementations and delete compatibility surfaces; do not layer new
   facades on top of old public seams indefinitely.
5. Replace tests at the deepened interfaces and add installed-artifact proofs.
6. Prune UI/examples/docs after consumers migrate.
7. Run external pilot #390 on the beta candidate.
8. Publish `0.41.0-beta.4`, validate post-publish truth, then decide whether
   stable `v0.41.0` is a version-only cut.
