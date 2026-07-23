# v0.41.0-alpha.17 — audit remediation completion plan

> Current source package line: `v0.41.0-alpha.16`\
> Current npm registry line: `v0.41.0-alpha.16`\
> Active release target: `v0.41.0-alpha.17`\
> Next stability candidate: `v0.41.0`\
> Current maturity stage: alpha

## Objective

Alpha.17 completes the audit-driven remediation started by
[`ADR-0116`](../adr/ADR-0116-audit-driven-alpha16-correctness-reset.md).
Alpha.16 closed with the P0 correctness fixes, current-truth drift clearance
and release closure; the remaining audit packages — P1 test credibility, P2
convergence hygiene and P3 strategic items — execute under alpha.17, along
with the release-tooling defects surfaced by the alpha.16 release run. It
adds no new product area.

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

- `v0.41.0-alpha.16` is the current source and published npm package line;
  its immutable tag and two-stage evidence must not be rewritten.
- Alpha.16 closed with its packages A (P0 correctness), E (drift clearance)
  and F (release closure), per that plan's rule that release-prepare runs
  only after A and E pass. Its packages B, C and D are deferred to alpha.17
  with unchanged scope; this plan supersedes the alpha.16 plan as the active
  version contract.
- The alpha.16 release run surfaced two `publish-existing` tooling defects,
  recorded in package B below.
- #460 is closed with released evidence; #390 and #37 remain open.

## Alpha.17 execution packages

### A. P1 test credibility (alpha.16 package B, deferred)

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

### B. P2 convergence and hygiene (alpha.16 package C, deferred, extended)

- Converge island declaration construction (`hydrate === 'only' ? false :
  meta?.ssr`) into one function; instantiate the entry descriptor once per
  build; merge the duplicated SPA/SSG phase-2 blocks; share logic between
  `renderRoute` and `renderRouteHandler`.
- Remove dead code: `external-resolver.ts` (ADR-0047 implementation never
  wired), the unwired `clientOnlyTags` parameter chain, dead build-context
  fields, and existence-only assertions in tests; fix the display-only twin
  of the island chunk regex in `build-manifest.ts`.
- Add a mechanical gate asserting current-document version anchors equal
  `tools/project-constants.ts` (including keeping `ACTIVE_EXECUTION_VERSION`
  maintained by the release bump), extend drift scanning to `docs/`, README
  files and the ADR index, and align the exports surface with
  `PACKAGE_SURFACE.md`.
- Slim the export surfaces: move adapter build-time utilities out of
  element's root exports and stop exporting internal router types from app's
  root; update the interface snapshot accordingly.
- Fix the `publish-existing` evidence defects found during the alpha.16
  release: the recorded previous package line must be the previously
  published line, not the target version; the GitHub release notes must be
  rewritten from the completed evidence after the run finishes instead of
  keeping the running snapshot; and the release flow must write the
  `-closure.json` record and durable-closure note section itself — their
  absence turned main CI red on the evidence-finalize commit.
- Verify the #460 `/@fs/` island path branch in a real Windows build, or
  record an explicit limitation in the release note.
- Resolve the root-level `<Show>`/`<For>` CSR edge: `renderToDom` commits
  bindings before the returned node is attached, so a root branch anchor has
  no parent and its content is silently dropped — either attach before
  commit or document the constraint, with a regression test.

### C. P3 strategic items (alpha.16 package D, deferred)

- Start the #390 external adopter pilot now that the P0 fixes are published;
  the pilot kit from alpha.15 is reused unchanged.
- Evaluate the governance toolchain (AutoFlow, evidence-driven release) as a
  separable asset; record the outcome as a note, no new package.
- Keep the v0.46 deadline for `@openelement/ui` requiring two non-site
  consumers; no scope expansion.

### D. Alpha.17 release closure

- Run release-prepare only after A and B pass, synchronizing all five
  manifests, Create CLI, starter mappings and current version anchors to
  `0.41.0-alpha.17`.
- Pass AutoFlow, CodeQL, dependency review, Pages, all-browser E2E, Nitro,
  packaged consumers, artifacts and npm publish dry-run on `dev` and `main`.
- Publish all five npm packages under the `alpha` and `latest` dist-tags,
  then verify fresh Deno, Node ESM, starter, Nitro Node/Workers, third-party
  Web Component and CDN consumers.
- Create an immutable `v0.41.0-alpha.17` tag, GitHub prerelease with curated
  notes, and a completed two-stage evidence record; finish with `origin/main`
  and `origin/dev` at the same SHA.

## Pull request order

1. This plan and the current-truth anchor updates (alpha.16 published,
   alpha.17 active).
2. P1 test-credibility implementation PRs.
3. P2 convergence and release-tooling PRs.
4. #390 pilot launch and strategic notes.
5. `dev -> main` release PR and post-publish evidence finalization.

Every implementation PR targets `dev`, identifies its plan package, and
passes AutoFlow before merge. `dev` is merged to `main` only after the
complete alpha.17 line is green.

## Acceptance

- Element hydration and binding behavior is covered in a real browser; no
  production test-env fallback branch remains uncovered.
- SSR render failures produce defined, tested 500 behavior; the diagnostics
  contract is wired or removed.
- The coverage gate counts every source file; the critical-path gate cannot
  skip a failing e2e suite; a Firefox smoke runs in CI.
- The duplicated island declaration, descriptor instantiation and phase-2
  blocks are converged; the listed dead code is deleted.
- A mechanical gate rejects current-document version-anchor drift, and the
  exports surfaces match `PACKAGE_SURFACE.md`.
- The `publish-existing` evidence records the true previous line and final
  GitHub release notes; the #460 `/@fs/` branch is verified or its
  limitation documented.
- The external adopter pilot #390 is running with published, anonymized
  intake; P0/P1 pilot findings become issues.
- Chromium, Firefox and WebKit pass the functional matrix.
- Nitro Node and Workers pass through the supported `nitro-mount` seam.
- npm, dist-tags, exact-version starter, tag, GitHub prerelease, docs and
  final evidence all agree on `0.41.0-alpha.17`.
- Alpha.16 evidence remains unchanged.

## Non-goals

- Do not add packages, publish JSR artifacts or claim broad fullstack parity.
- Do not introduce speculative auth, database, session or cache products.
- Do not restructure the `OpenElement` base class or introduce a diffing
  renderer; those are architecture-level changes outside this remediation.
- Do not promise stable `0.41.0` merely because alpha.17 publishes.
- Do not fabricate, simulate or replace external adopter evidence with
  internal CI runs.

## Test matrix

- Every package A/B change lands with behavior tests; real-browser hydration
  specs run in the chromium CI project and the new Firefox smoke.
- `deno task test`, `arch:check`, `graph:check`, `package-surface:check`,
  `type-safety:check` and `deno-api:check` pass for every PR.
- `deno task test:e2e` (Chromium) passes for every PR; the all-browser matrix
  runs before release closure.
- Packaged consumer smoke, third-party Web Component smoke and Nitro proofs
  run before release closure.

## Release evidence requirements

- Two-stage evidence under `docs/release/` for `v0.41.0-alpha.17`, including
  npm version and dist-tag verification and post-publish consumer smoke.
- The release note on GitHub is curated and matches the completed evidence,
  exercising the package B tooling fix.
- Any #390 pilot intake published during alpha.17 is anonymized and linked
  from the release evidence.

## Stable decision after alpha.17

`0.41.0` may be prepared only when the alpha.16 correctness fixes are proven
in the published artifact, the alpha.17 test-credibility and convergence
packages are complete, the re-recorded interface snapshot needs no further
breaking change, the adopter pilot finds no unresolved architecture-level
break, and #37's applicable `0.41.0` gates are evidenced. Otherwise the
evidence selects a narrowly scoped next alpha instead of weakening the
stable contract.
