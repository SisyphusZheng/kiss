# v0.41.0-alpha.16 — audit-driven correctness reset plan

> Current source package line: `v0.41.0-alpha.15`\
> Current npm registry line: `v0.41.0-alpha.15`\
> Active release target: `v0.41.0-alpha.16`\
> Next stability candidate: `v0.41.0`\
> Current maturity stage: alpha

## Objective

Alpha.16 is an audit-driven correctness reset governed by
[`ADR-0116`](../adr/ADR-0116-audit-driven-alpha16-correctness-reset.md). The
2026-07-23 full-project audit found defects on the framework's core rendering
correctness promises, test-credibility gaps that let them pass, and
current-truth drift in governance documents. Alpha.16 fixes the P0
correctness defects, clears the documented drift, and schedules the remaining
audit findings as governed execution packages. It adds no new product area.

```text
OpenElement = Web Components-native fullstack application framework
current proven scope = static-first applications with fullstack output paths
component contract = standard Custom Elements
official build path = Vite + Nitro
```

The authoritative five-package contract remains
[`PACKAGE_SURFACE.md`](./PACKAGE_SURFACE.md). Alpha naming remains governed by
[`ADR-0114`](../adr/ADR-0114-continue-alpha-after-five-package-convergence.md)
until external evidence justifies a stability commitment.

## Entry truth

- `v0.41.0-alpha.15` is the current source and published npm package line.
- All five npm `alpha` dist-tags resolve to alpha.15; the npm `latest`
  dist-tag incorrectly resolves to alpha.6 and is corrected under package A.
- Alpha.15's immutable tag and two-stage evidence must not be rewritten.
- The external adopter pilot #390 and stable gate #37 remain open; the pilot
  starts only after package A lands so adopters test corrected behavior.
- Issue #460 (published starter rejects Windows island paths) is open and is
  closed by package A.

## Alpha.16 execution packages

### A. P0 correctness fixes (release-blocking)

- Align SSR and hydration event-marker (`data-eid`) accounting so registered
  custom-element hosts and `<Show>`/`<For>` runtime branches cannot
  deterministically misalign handler binding; on any marker/binding count
  mismatch, warn and fall back to client-side re-render instead of binding
  handlers to the wrong nodes. Reproduction tests land before the fix.
- Move static-props attribute observation to class-definition time:
  `observedAttributes` must be complete before `customElements.define()` reads
  it, inherited arrays must not be mutated in place, and a real-browser test
  proves attribute-to-signal synchronization.
- Fix island chunk matching in SSG post-processing so base64url hashes
  (`-`/`_`) match, prefer the client build manifest over filename guessing,
  and warn on unmatched island chunks instead of silently dropping them.
- Establish and enforce an npm `latest` dist-tag policy for the alpha line in
  the publish tooling, and correct the current `latest = alpha.6` drift.
- Fix #460: normalize Windows drive-letter island module paths in
  adapter-vite so the published starter builds on Windows, with path-logic
  unit tests for POSIX and Win32 forms.

### B. P1 test credibility

- Add a real-browser (Playwright) hydration suite for element's binding and
  hydration layer alongside the DOM-shim unit tests; test-env fallback
  branches in production code must either be covered or removed.
- Add SSR error-path tests: a failing route render must produce defined 500
  behavior, and the `errors`/`hydrationHints` diagnostics contract is either
  wired to real collection or removed from the protocol.
- Make the coverage denominator enumerate all source files, not only loaded
  ones; re-baseline thresholds after the denominator fix.
- Delete the skip-on-failure regex in `tools/check-critical-path-tests.ts` so
  e2e suite failures cannot be reclassified as missing infrastructure.
- Add a Firefox smoke project to CI so the DSD cross-browser claim has a
  standing guard.

### C. P2 convergence and hygiene

- Converge island declaration construction (`hydrate === 'only' ? false :
  meta?.ssr`) into one function; instantiate the entry descriptor once per
  build; merge the duplicated SPA/SSG phase-2 blocks; share logic between
  `renderRoute` and `renderRouteHandler`.
- Remove dead code: `external-resolver.ts` (ADR-0047 implementation never
  wired), the unwired `clientOnlyTags` parameter chain, dead build-context
  fields, and existence-only assertions in tests; fix the display-only twin
  of the island chunk regex in `build-manifest.ts`.
- Add a mechanical gate asserting current-document version anchors equal
  `tools/project-constants.ts`, extend drift scanning to `docs/`, README
  files and the ADR index, and align the exports surface with
  `PACKAGE_SURFACE.md`.
- Slim the export surfaces: move adapter build-time utilities out of
  element's root exports and stop exporting internal router types from app's
  root; update the interface snapshot accordingly.

### D. P3 strategic items

- Start the #390 external adopter pilot after package A lands; the pilot kit
  from alpha.15 is reused unchanged.
- Evaluate the governance toolchain (AutoFlow, evidence-driven release) as a
  separable asset; record the outcome as a note, no new package.
- Keep the v0.46 deadline for `@openelement/ui` requiring two non-site
  consumers; no scope expansion.

### E. Current-truth drift clearance

- Align STATUS, both READMEs, ROADMAP, PROJECT_WORKFLOW, CHANGELOG and the
  ADR index on alpha.15 as the published line and alpha.16 as the active
  target; remove the stale `docs/changelog/` document-role row.
- Remove dead gate triggers in `tools/autoflow/policy.ts` that point at
  retired packages, and rename the `consumer:core-smoke` gate to match what
  it actually smokes.

### F. Alpha.16 release closure

- Run release-prepare only after A and E pass, synchronizing all five
  manifests, Create CLI, starter mappings and current version anchors to
  `0.41.0-alpha.16`.
- Pass AutoFlow, CodeQL, dependency review, Pages, all-browser E2E, Nitro,
  packaged consumers, artifacts and npm publish dry-run on `dev` and `main`.
- Publish all five npm packages under the `alpha` dist-tag, then verify fresh
  Deno, Node ESM, starter, Nitro Node/Workers, third-party Web Component and
  CDN consumers, including the corrected `latest` policy.
- Create an immutable `v0.41.0-alpha.16` tag, GitHub prerelease and completed
  two-stage evidence record; finish with `origin/main` and `origin/dev` at
  the same SHA.

## Pull request order

1. ADR-0116, this plan, current-truth clearance and policy trigger cleanup.
2. Event-marker alignment and static-props observation fixes with
   reproduction tests.
3. Island chunk matching fix.
4. npm `latest` policy and #460 Windows path fix.
5. P1/P2 implementation PRs as scheduled.
6. `dev -> main` release PR and post-publish evidence finalization.

Every implementation PR targets `dev`, identifies its plan package, and
passes AutoFlow before merge. `dev` is merged to `main` only after the
complete alpha.16 line is green.

## Acceptance

- Event-handler binding after hydration matches SSR intent for custom-element
  hosts and signal-driven control flow, with reproduction tests and an
  explicit CSR fallback on mismatch.
- Static-props attribute synchronization works in a real browser, verified by
  a Playwright test, not only by the DOM shim.
- Island chunks with base64url hashes are matched and injected; unmatched
  chunks produce a build warning.
- npm `latest` and `alpha` dist-tags follow the documented policy, verified
  by the release tooling; #460 is closed with path-form unit tests.
- No current public or governance document identifies alpha.14 or earlier as
  the published or active line; no gate trigger references a retired package.
- The five-package interface snapshot is re-recorded after package A and
  passes against packed artifacts.
- Chromium, Firefox and WebKit pass the functional matrix.
- Nitro Node and Workers pass through the supported `nitro-mount` seam.
- npm, dist-tags, exact-version starter, tag, GitHub prerelease, docs and
  final evidence all agree on `0.41.0-alpha.16`.
- Alpha.15 evidence remains unchanged.

## Non-goals

- Do not add packages, publish JSR artifacts or claim broad fullstack parity.
- Do not introduce speculative auth, database, session or cache products.
- Do not restructure the `OpenElement` base class or introduce a diffing
  renderer; those are architecture-level changes outside this audit reset.
- Do not promise stable `0.41.0` merely because alpha.16 publishes.
- Do not fabricate, simulate or replace external adopter evidence with
  internal CI runs.

## Test matrix

- Package A reproduction tests fail before and pass after each fix; the
  static-props attribute test runs in a real browser via Playwright.
- `deno task test`, `arch:check`, `graph:check`, `package-surface:check`,
  `type-safety:check` and `deno-api:check` pass for every PR.
- `deno task test:e2e` (Chromium) passes for every PR; the all-browser matrix
  runs before release closure.
- Packaged consumer smoke, third-party Web Component smoke and Nitro proofs
  run before release closure.

## Release evidence requirements

- Two-stage evidence under `docs/release/` for `v0.41.0-alpha.16`, including
  npm version and dist-tag verification and post-publish consumer smoke.
- The `latest` dist-tag correction is recorded as a release operation with
  command output; historical tags are never rewritten.
- #460 closure references the fixing PR and its path-form test evidence.

## Stable decision after alpha.16

`0.41.0` may be prepared only when package A fixes are proven in the
published artifact, the re-recorded interface snapshot needs no further
breaking change, the adopter pilot finds no unresolved architecture-level
break, and #37's applicable `0.41.0` gates are evidenced. Otherwise the
evidence selects a narrowly scoped next alpha instead of weakening the
stable contract.
