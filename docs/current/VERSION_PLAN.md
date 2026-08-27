# v0.44.0-alpha — Compiled OpenElement

> Current source package line: `v0.43.3`\
> Current npm registry line: `v0.43.3` (published, dist-tag `latest`)\
> Latest landed train: `v0.43.3`\
> Active release target: `v0.44.0-alpha.0`\
> Next planned train: `v0.44.0-alpha.1`\
> Stable fallback: `0.43.x` remains supported while 0.44 is prerelease\
> Maturity: architecture execution; public compatibility is intentionally unfrozen

## Objective

Replace the runtime-discovered VNode/binding architecture with one compiled Custom
Element path:

```text
OpenElement = Web Components-native fullstack application framework

TSX + standard decorators
  -> compiler-owned Part Program
  -> server serialization / browser creation / SSR claim
  -> exact Signal-driven DOM updates
```

`OpenElement extends HTMLElement` is both the concrete base class and the semantic
center. App owns page/request orchestration, Island owns client code delivery policy,
and each Element owns its local lifecycle and reactive DOM. See ADR-0143.

The source and published package line remain `v0.43.3` until the first alpha candidate
passes its release gates; planning a prerelease does not falsely claim that it has
already been built or published. Package responsibilities remain governed by
[`PACKAGE_SURFACE.md`](./PACKAGE_SURFACE.md) and ADR-0114's coherent five-package
release rule. The official deployment integration remains the Adapter-owned
`nitro-mount` path; the compiler rewrite does not move deployment semantics into
Element.

## Release doctrine

- Every alpha is a usable vertical increment, not an arbitrary time box.
- Breaking changes between alphas are allowed and must carry migration notes.
- No old renderer fallback may be added to make an alpha appear complete.
- The final alpha proves the framework and build substrate. It does not claim that UI,
  the website or an external product have qualified that substrate.
- `beta.1` rebuilds `@openelement/ui` on the final-alpha contracts and admits validated
  Zag composition. `beta.2` then rebuilds the official website and Starter on the
  published beta.1 framework and UI artifacts.
- RC admission follows beta.2 only when the framework, UI and website form one coherent
  public surface. Additional beta releases fix product-integration defects; any required
  architecture change returns the train to alpha.
- The RC is consumed by the independent SaaS. Stable is forbidden until that SaaS
  qualifies exact public RC artifacts without workspace or source coupling.
- ADR-0146 governs autonomous execution: Sol selects and reviews bounded work, K3
  implements it, and a fresh K3 session performs test-driven closure for every intended
  alpha/beta publication. Deterministic gates and human promotion GO remain authoritative.
- `0.43.x` accepts only compatible maintenance while 0.44 is prerelease.
- `latest` remains on stable 0.43.x until `0.44.0` stable publishes.

## Alpha line

| Release   | Theme                           | Exit condition                                                                                                                                         |
| --------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `alpha.0` | Constitution and foundations    | ADR-0143/0144/0145, roadmap, issue graph, governance replacement matrix and executable compiler spike are accepted                                     |
| `alpha.1` | Authoring and compiler contract | `@element` + `@property` + `extends OpenElement` compile with diagnostics, source maps and HMR through the official Vite path                          |
| `alpha.2` | Part Program and fresh DOM      | Static structure, fixed Parts, Events/Refs and Regions create browser DOM without VNodes or runtime discovery                                          |
| `alpha.3` | Element kernel and reactivity   | Lifecycle, root ownership, styles, Context, forms and replaceable SignalEngine drive exact Parts/Regions with deterministic cleanup                    |
| `alpha.4` | Server serialization and claim  | The same Part Program emits DSD/light HTML and claims existing DOM with state/identity preservation and bounded mismatch recovery                      |
| `alpha.5` | Island delivery                 | Static output ships zero component runtime; generated activation modules deliver one-to-many Element capability by load/idle/visible/media/only policy |
| `alpha.6` | App and build convergence       | Routes, layouts, loaders/actions, SSG, request-time SSR, chunks, manifests, HMR and Node/Workers output consume the compiled Element path              |
| `alpha.7` | Migration and ecosystem         | Old rendering/binding paths are absent from distributed artifacts; codemods, migration guide, CEM and native/Lit/FAST/Stencil conformance are complete |
| `alpha.8` | Final-alpha framework candidate | Compiler, Element, App/build, docs graph, performance budgets, browser/runtime matrices and packed framework consumers pass without legacy paths       |

## Product qualification ladder

| Release  | Product boundary | Exit condition                                                                                                                                         |
| -------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `beta.1` | UI system        | `@openelement/ui` is rebuilt on final-alpha compiled Elements; admitted Zag-backed widgets pass SSR/create/claim, accessibility, lifecycle and bundles |
| `beta.2` | Official website | The website and Starter consume exact beta.1 framework/UI artifacts and pass content, browser, accessibility, delivery and deployment qualification    |
| `rc.1`   | Frozen candidate | The exact-SHA pre-RC matrix passes with the intended framework and UI surfaces frozen                                                                  |
| `0.44.0` | Stable           | The independent SaaS qualifies exact RC artifacts, the RC soak passes and the coherent release is explicitly approved and published                    |

Alpha numbers describe dependency order. A failed alpha may be followed by another
alpha with the same theme; the release is not promoted merely because its checklist
was scheduled. A failed beta produces another beta unless correcting it changes the
compiled architecture or framework public surface, in which case the train returns to
alpha. Beta numbering records qualification attempts, not a promise that only two beta
artifacts can exist.

## Work packages

### WP-0 — Governance and content foundations (`alpha.0`)

- Replace generic custom governance with the ADR-0144 toolchain: Renovate,
  markdownlint-cli2, lychee, actionlint, zizmor, CodeQL/OpenSSF Scorecard and existing
  publint/Are The Types Wrong gates.
- Produce an AutoFlow retirement matrix. Keep only OpenElement-specific conformance,
  coherent versioning, publish ordering and immutable evidence.
- Implement ADR-0145 adapter contracts so Markdown, `deno doc` JSON, compiler-emitted
  Custom Elements Manifest data, ADRs, release records and roadmap metadata share
  stable content IDs and references.
- Split the obsolete #1151 umbrella into generated API, docs graph, i18n/SEO/link,
  information architecture, accessibility and performance issues.
- Reopen the v0.44 milestone and make this plan, not chat history, its authority.
- Establish ADR-0146's repository-owned Goal, state, loop evidence and Sol/K3 role
  profiles. Missing K3-256k/high capability fails closed rather than selecting a
  substitute executor.

### WP-1 — Compiler and authoring (`alpha.0`–`alpha.1`)

- Add a production-shaped spike proving TSX transform, Deno/Vite integration, SSR
  serialization and browser activation on one component.
- Define the versioned Part Program schema, feature flags and deterministic encoding.
- Compile standard `@element` and `@property` decorators. Reject legacy/unknown
  decorator behavior and unsupported class inheritance with actionable diagnostics.
- Compile one TSX authoring grammar; reject constructs that would require a runtime
  VNode fallback.
- Preserve accurate source maps, type errors, HMR state and file/line diagnostics.

### WP-2 — OpenElement kernel, Parts and Regions (`alpha.2`–`alpha.3`)

- Make `OpenElement extends HTMLElement` own connected/disconnected/adopted lifecycle,
  root selection, Part installation, subscriptions and cleanup.
- Implement fixed text/attribute/property/boolean/class/style/event/ref Parts.
- Implement bounded Regions for dynamic children, `Show`, keyed/unkeyed `For` and
  nested element programs, with explicit node and disposer ownership.
- Keep Preact Signals Core as the default `SignalEngine`; publish a conformance suite
  and select one engine per build without per-update virtual dispatch.
- Integrate context, styles, form association, property reflection and element-local
  error boundaries without a mixin or parallel renderer system.

### WP-3 — Server serialization and claim (`alpha.4`)

- Serialize open/closed DSD and light DOM from the same compiled program.
- Define deterministic claim identity with minimal markers and no generic DOM scan.
- Attach Parts, Regions, events and signals to existing DOM.
- Preserve node identity, focus, selection, live form values, nested Custom Element
  instances and exactly-once pre-upgrade events on a successful claim.
- Emit structured mismatches and recover only the owning element range.
- Prove fresh browser creation, server output and claim against one conformance corpus.

### WP-4 — Islands, App and build (`alpha.5`–`alpha.6`)

- Generate activation modules and page manifests from actual admitted interactive tags.
- Define Island as a client-capability delivery boundary with `1 Island : N Elements`.
- Keep static routes runtime-free; ship only behavior reachable from an interactive
  island and only Region machinery when a component uses structural dynamics.
- Remove the separate client takeover model and component-aware island hydration.
- Integrate routes, layouts, loaders/actions, head, SSG and request-time output without
  teaching App about Parts or Signals.
- Prove official Vite dev/build, Nitro Node/Workers, HMR, code splitting and source maps.

### WP-5 — Migration, interop and documentation (`alpha.7`)

- Remove `defineElement`/legacy registration, runtime VNode, BindingDescriptor,
  activation registry and generic hydration code from published artifacts.
- Provide codemods and a 0.43-to-0.44 migration guide. Migration transforms source;
  it does not preserve the old renderer at runtime.
- Generate the complete public API reference with `deno doc --json --lint` and merge
  compiler CEM metadata for attributes, events, slots, CSS parts, roots and claim.
- Verify native elements and representative Lit, FAST and Stencil components as
  application children and SSR admission inputs.
- Compile/type-check documentation examples and expose stable source links/search IDs.

### WP-6 — Final-alpha framework qualification (`alpha.8`)

- Qualify compiler, Element, App/build and Starter consumers on packed final-alpha
  artifacts without relying on the UI package or website as compatibility glue.
- Record cold-start, SSR, claim, update, memory and transferred-byte comparisons against
  the 0.43.3 baseline with fixed fixtures and environments.
- Run Chromium, Firefox and WebKit plus Node and Workers output; Deno/Bun run the
  supported CLI/consumer subset stated by the package contract.
- Complete governance offload, generated content, migration and security evidence before
  declaring the framework ready for beta product qualification.

### WP-7 — UI qualification (`beta.1`)

- Rebuild `@openelement/ui` on the published final-alpha compiler and Element contract.
- Use native HTML or Element-owned behavior by default; admit Zag Vanilla machines for
  complex headless interaction only where the validated role boundary requires them.
- Prove SSR/create/claim, light/open/closed roots, forms, keyboard/focus/ARIA behavior,
  cleanup, tree-shaking and transferred-byte budgets across the browser matrix.
- Publish one coherent five-package beta.1 line; UI may not reach into private compiler
  or workspace source paths.

### WP-8 — Website qualification (`beta.2`)

- Rebuild the official website and Starter with exact beta.1 framework and UI artifacts.
- Exercise generated API/CEM, releases, roadmap, navigation, search, locales, SEO, links,
  nested UI, SSR/claim and delayed Islands through user-visible flows.
- Preserve zero-runtime static routes and reachability-based interactive chunks.
- Reject website-local compatibility glue that conceals a framework or UI contract flaw.

### WP-9 — RC SaaS proof and Stable (`rc.*` → `0.44.0`)

- Admit beta.2 to RC only after the exact-SHA pre-RC matrix passes.
- Build and run the independent SaaS from public npm or packed RC artifacts with no
  workspace aliases, private imports or unpublished coupling.
- Exercise production-shaped routing, data, forms, UI composition, SSR/claim, selective
  delivery and the chosen deployment target; record every framework defect against the
  exact RC.
- Promote Stable only after SaaS qualification, the RC soak and the coherent release
  evidence all pass.

## Explicit non-goals for 0.44.0

- No second authoring syntax, tagged-template public API or runtime Template object.
- No compatibility VNode renderer, runtime Part interpreter or silent compiler fallback.
- No framework-owned auth/session, database, cache/ISR, outbox, generic tracing or
  streaming SSR promise solely because those issues were once labeled 0.44.
- No new public compiler/signals package without a separate package-boundary ADR.
- No generic CMS/query layer in Content Collections.
- No Portal/Teleport primitive in the Element kernel; application overlays compose
  through native DOM ownership and an app-level host only when real evidence requires it.
- No component inheritance/mixin semantics beyond one analyzable OpenElement lineage in
  the 0.44 compiler. Composition is the supported reuse mechanism.

## Mandatory RC entry standard

RC admission is a single GO/NO-GO decision. Every item below is required:

### Architecture and surface

- [ ] ADR-0143 semantics are implemented without exceptions hidden behind defaults.
- [ ] One canonical authoring form and one Part Program version are documented.
- [ ] The intended framework API and compiler grammar have been unchanged from the
      accepted final alpha through beta.2; the intended UI surface is frozen at beta.2.
- [ ] No shipped default path contains the runtime VNode renderer, BindingDescriptor
      tree, activation registry, generic hydration walker or fallback interpreter.
- [ ] Package exports, CEM, generated API reference and migration guide agree.

### Correctness

- [ ] The conformance corpus produces equivalent observable structure for server
      serialization, fresh DOM creation and SSR claim.
- [ ] Fixed Parts, Regions, keyed identity, nested lifetimes, events, refs, context,
      forms, styles, roots and error boundaries pass adversarial tests.
- [ ] Claim preserves DOM/user state and emits deterministic diagnostics for every
      mismatch class.
- [ ] SignalEngine conformance passes for Preact and one deliberately small test engine,
      proving the seam is real rather than interface theater.

### Delivery and performance

- [ ] A fully static application ships zero OpenElement client runtime bytes.
- [ ] Island output contains only reachable element behavior; unused UI elements and
      Region logic are absent from representative chunks.
- [ ] No agreed critical metric regresses more than 10% against the frozen candidate
      baseline without a maintainer-approved evidence amendment; transferred JS must
      improve on the equivalent 0.43.3 interactive fixtures.
- [ ] Repeated connect/disconnect, list churn, route navigation and failed claim runs
      show no unbounded listeners, subscriptions, nodes or retained instances.

### Tooling and portability

- [ ] Vite dev/build, HMR, source maps and compiler diagnostics are reliable on a clean
      checkout and on packed artifacts.
- [ ] Chromium, Firefox and WebKit pass the full component/claim matrix.
- [ ] Nitro Node and Workers output pass; supported Deno/Bun consumer claims are tested.
- [ ] Native/Lit/FAST/Stencil interop and CEM admission pass with documented limits.

### Product proof and governance

- [ ] `@openelement/ui` passes the beta.1 component, accessibility, lifecycle, root-mode
      and bundle matrix against exact final-alpha artifacts.
- [ ] Website and Starter pass beta.2 qualification against exact public beta.1
      artifacts, not workspace aliases.
- [ ] Every alpha/beta candidate carries a fresh-session K3 test-driven closure PASS,
      followed by an independent deterministic harness PASS and exact human promotion
      GO. The verifier changed no production code.
- [ ] All other pre-RC milestone P0/P1 issues are closed; every lower-priority deferral
      has an owner, rationale and non-blocking proof. The RC-admission, RC SaaS and
      Stable-promotion issues remain open by design at the start of the decision.
- [ ] Generic governance replacements are live and duplicate custom machinery is
      deleted; remaining custom gates are mapped to OpenElement-specific invariants.
- [ ] Content Graph generation is deterministic; API/JSDoc/CEM, links, SEO, locales,
      nav and search pass drift checks.
- [ ] Threat model, dependency review, CodeQL, Scorecard, workflow lint/security and npm
      artifact checks are green.
- [ ] The maintainer records an explicit RC GO against the exact commit SHA.

## RC line and stable entry

`rc.1` freezes the public authoring grammar, Part Program version, package exports,
root semantics, claim behavior and migration contract. Later RCs contain release
blocker fixes only; any architecture or public-surface change returns the line to
alpha.

Stable `0.44.0` requires:

1. the independent SaaS installs, builds, tests and deploys using exact public RC
   artifacts with no workspace aliases, private source imports or unpublished coupling;
2. the SaaS critical journeys and the beta.2 website remain green with no unresolved
   P0/P1 framework regression;
3. at least fourteen days of RC soak complete;
4. no compatibility-changing commit lands after the final RC;
5. npm dry-run, packed consumers, provenance, tag, GitHub release and dist-tag checks;
6. complete generated documentation and a final 0.43-to-0.44 migration rehearsal;
7. an explicit maintainer Stable GO on the exact main-branch SHA.

## Required verification matrix

| Boundary  | Required evidence                                                                        |
| --------- | ---------------------------------------------------------------------------------------- |
| Compiler  | transform snapshots, invalid syntax diagnostics, source maps, HMR, deterministic output  |
| Element   | lifecycle, roots, props, decorators, styles, context, forms, cleanup, errors             |
| Parts     | every fixed sink, event replacement, refs, value equality and disposal                   |
| Regions   | conditional, keyed/unkeyed list, moves, nested ownership, empty ranges, failures         |
| Signals   | Preact default, alternate test engine, batching, computed/effect ordering, cleanup       |
| SSR/claim | light/open/closed roots, three-browser identity/state preservation, mismatch matrix      |
| Islands   | zero-JS static, load/idle/visible/media/only, one-to-many delivery, chunk reachability   |
| App/build | routes, layouts, loaders/actions, SSG, request-time, Node/Workers, packed output         |
| Content   | JSDoc lint, CEM, API pages, Markdown, i18n, nav, search, SEO, links, deterministic drift |
| Release   | exact SHA, package surface, publint/ATTW, npm provenance/dist-tags, UI, website and SaaS |

## Issue authority

The complete issue graph and disposition of the pre-existing backlog live in
[`../roadmap/v0.44.0-ISSUES.md`](../roadmap/v0.44.0-ISSUES.md). GitHub issues are the
execution queue; this document is the scope and promotion authority.
