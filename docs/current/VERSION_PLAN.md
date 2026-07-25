# v0.41.0-alpha.19 — third audit round cleanup sweep plan

> Current source package line: `v0.41.0-alpha.18`\
> Current npm registry line: `v0.41.0-alpha.18`\
> Active release target: `v0.41.0-alpha.19`\
> Next stability candidate: `v0.41.0`\
> Current maturity stage: alpha

## Objective

Alpha.19 executes the third audit round cleanup sweep governed by
[`ADR-0118`](../adr/ADR-0118-third-audit-round-alpha19-cleanup-sweep.md). The
2026-07-25 full-repository audit (architecture, redundancy, cleanliness)
produced 26 accepted issues (#481–#506) under milestone
`v0.41.0-alpha.19`. Alpha.19 closes every listed issue or explicitly defers
it with evidence. It adds no new product surface and no new packages. Every
state-dependent fix carries an "input combinations enumerated" acceptance
note, extending the sibling-path doctrine of ADR-0117.

```text
OpenElement = Web Components-native fullstack application framework
current proven scope = static-first applications with fullstack output paths
component contract = standard Custom Elements
official build path = Vite + Nitro
```

The authoritative five-package contract remains
[`PACKAGE_SURFACE.md`](./PACKAGE_SURFACE.md). Alpha naming remains governed by
[`ADR-0114`](../adr/ADR-0114-continue-alpha-after-five-package-convergence.md).

## Entry truth

- At entry to this plan, `v0.41.0-alpha.18` is the current source and
  published npm package line; its immutable tag and two-stage evidence must
  not be rewritten.
- The external adopter pilot #390 and stable gate #37 remain open.

## Scope

- All 26 issues #481–#506, grouped below by theme; each issue records its own
  zero-consumer or reproduction evidence.
- Gate mechanization for every audit-discovered blind spot so the same drift
  class cannot return silently.
- The alpha.19 release closure: bump, gates, publish, tag, prerelease and
  two-stage evidence.

## Tasks by issue group

### A. High-severity truth and assertion gaps

- #481: fix www pages claiming stale package lines; extend the www-truth gate
  to bare version mentions.
- #482: align governance doc bodies (STATUS/ROADMAP/README/SECURITY) with
  their headers; extend the version-anchor/currency gates to body text.
- #483: replace the 25 always-true `assertExists(boolean)` assertions with
  behavior assertions; widen the assertion-style gate.

### B. Surface seams and declarations

- #486: correct package READMEs teaching internal or nonexistent subpaths;
  add a package-README surface gate.
- #487, #488: close the `export type *` star seams exposing internal protocol
  types (SafeHtml/UnsafeHtml/StyleSheetRule and ~50 others); make the
  interface snapshot seam-aware.
- #490: single-source `routeInfo` declarations including the emitted
  `filePath`/`module` fields.
- #505: decide the test-only-consumed public exports batch.

### C. Correctness residuals and input combinations

- #491, #492: reflect-prop fixes proven in Firefox/WebKit smoke, not only
  Chromium; enumerate removeAttribute × default-value combinations.
- #493: keep URL and router state consistent on popstate redirect-then-block;
  fix guard-reject fail-open asymmetry.
- #494: make the `For` drift token collision-proof against separator
  smuggling.
- #495: strengthen the theme-init `prefers-color-scheme` e2e to the claimed
  FOUC contract.
- #496: single-source the `HydrationStrategy` literal list.
- #500: converge island declaration construction and the build-plan hydrate
  evidence.
- #489: give `graph:check` real teeth with a dependency-direction gate.

### D. Release tooling and evidence durability

- #497: untangle the release executor core from `mod3.ts`; test resume
  orchestration and the rebase-conflict resume path.
- #484: declare the workflow inputs sent by `autoflow:release-dispatch`.
- #485: record alpha.18 migration notes durably; protect curated notes from
  tooling overwrite.
- #499: extend the clean task to all eight artifact classes.

### E. Hygiene and vocabulary

- #498: fix the CONTRIBUTING structure map and the comment-honesty batch.
- #501: execute the safe-deletion batch (11 zero-consumer items).
- #502: config hygiene batch (workspace-orphan example, ui publish.exclude,
  test-fixtures, orphan tasks, dead doc refs).
- #503: consolidate hydration/upgrade/activate/mount vocabulary and field
  names.
- #504: gate hardening batch (deno-api AST blind spots, guide guard residue,
  #37 text refresh, VERIFICATION wording).
- #506: deduplicate the JSON codegen boundary, formatJson bypasses and
  diverged preact test stubs.

### F. Alpha.19 release closure

- Run release-prepare only after A–E pass, synchronizing all five manifests,
  Create CLI, starter mappings and current version anchors to
  `0.41.0-alpha.19`.
- Publish all five npm packages under the `alpha` and `latest` dist-tags,
  create the immutable `v0.41.0-alpha.19` tag and GitHub prerelease, verify
  fresh Deno, Node ESM, starter and Nitro consumers through the supported
  `nitro-mount` seam, and complete the two-stage evidence record.

## Acceptance

- Every issue #481–#506 is closed with its recorded evidence, or explicitly
  deferred with a recorded reason.
- Each state-dependent fix (C group) enumerates the input combinations it was
  verified against.
- The new and hardened gates (A, B, D, E groups) fail on the stale inputs
  they were built for and pass on the corrected repo state.
- npm, dist-tags, exact-version starter, tag, GitHub prerelease, docs and
  final evidence all agree on `0.41.0-alpha.19`.
- Alpha.18 evidence remains unchanged.

## Non-goals

- Do not add packages, product surface or new public APIs beyond what an
  issue requires.
- Do not restructure the `OpenElement` base class or introduce a diffing
  renderer.
- Do not promise stable `0.41.0` merely because alpha.19 publishes.
- Do not fabricate, simulate or replace external adopter evidence with
  internal CI runs.

## Test matrix

- Every correctness fix lands reproduction-first; reflect and popstate fixes
  are proven in the browser engines their acceptance claims name.
- Gate changes land with fixtures proving both the stale rejection and the
  corrected-state pass.
- `deno task test`, `arch:check`, `graph:check`, `package-surface:check`,
  `type-safety:check` and `deno-api:check` pass for every PR.
- `deno task test:e2e` (Chromium) and the Firefox/WebKit smoke pass for every
  PR; the pre-release matrix covers Chromium, Firefox and WebKit.

## Release evidence requirements

- Two-stage evidence under `docs/release/` for `v0.41.0-alpha.19`, including
  npm version and dist-tag verification and post-publish consumer smoke.
- The release note records any breaking deletions with migration steps.
- Any new #390 pilot intake published during alpha.19 is anonymized and
  linked from the release evidence.
