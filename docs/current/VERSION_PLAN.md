# v0.41.0-alpha.18 — second audit sweep plan

> Current source package line: `v0.41.0-alpha.17`\
> Current npm registry line: `v0.41.0-alpha.17`\
> Active release target: `v0.41.0-alpha.18`\
> Next stability candidate: `v0.41.0`\
> Current maturity stage: alpha

## Objective

Alpha.18 executes the second audit sweep governed by
[`ADR-0117`](../adr/ADR-0117-second-audit-round-alpha18-sweep.md). The
2026-07-24 re-audit verified the alpha.16/17 remediation and found
half-closed sibling paths, documentation claims without evidence, one broken
public feature (`reflect: true` props), and a redundancy inventory. Alpha.18
closes every listed item or explicitly defers it with evidence. It adds no
new product area. Every package carries a "sibling paths enumerated"
acceptance note.

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

- `v0.41.0-alpha.17` is the current source and published npm package line;
  its immutable tag and two-stage evidence must not be rewritten.
- The external adopter pilot #390 and stable gate #37 remain open.
- The root-level `<Show>`/`<For>` CSR edge and the `/@fs/` Windows
  verification are carried over from the alpha.17 plan, which shipped with
  them unmet; this plan either completes them or defers them with explicit
  recorded evidence.

## Alpha.18 execution packages

### A. P0 correctness

- Fix the `reflect: true` static-prop write loop: equality short-circuit in
  the reflect subscriber, no default-value attribute write before
  `syncStaticPropsFromAttributes` runs, and a real-browser test proving
  reflected SSR attributes survive connect. Sibling paths: attribute removal
  restore, re-connect, multi-engine behavior.
- Pass `cemClassifications` into the SSG descriptor so dev/server and static
  output share one admission plan; add a build-level test asserting a
  CEM-admitted package island renders identically in both paths. Sibling
  paths: `build-ssg.ts` plan overwrite, evidence decisions source.
- Wire the 500 contract to consumers: dynamic-route failures must not be
  written as normal pages (fail the build or record the failure loudly), the
  ISR manifest must not register failed pages, static-route non-200 outcomes
  must surface in the build summary; redirect/notFound fields join
  `SsgPageOutput`'s type contract. Sibling paths: `toSSG` filtering, handler
  parity.
- Fix `www/public/theme-init.js` honoring `prefers-color-scheme` (currently
  always dark) and tighten the e2e assertion so both values are no longer
  tolerated. Sibling paths: FOUC contract, theme-toggle propagation.
- Run router guards on popstate/hashchange navigation, with a browser test
  for guard-on-back. Sibling paths: redirect chains on popstate, hash mode.
- Resolve the carried-over root-level `<Show>`/`<For>` CSR edge: attach
  before commit or document the constraint, with a regression test, and
  simplify the e2e probe that worked around it. Sibling paths: root `For`,
  fallback re-render path.

### B. Release tooling closure

- Fix the local `patch-release` path so final evidence and the closure record
  land on `main` (or the flow is re-sequenced so they cannot strand on
  `dev`); a local release must leave main CI green. Sibling paths: CI
  dispatch path, publish-existing path (both verified working in alpha.17).
- Make version-anchor gates reject stale version claims, parameterized on
  `PREVIOUS_PACKAGE_VERSION` instead of hardcoded versions; extend anchor
  maintenance to the `VERSION_PLAN.md` header so it cannot expire again.
  Sibling paths: README/ROADMAP/STATUS body lines outside the header.
- Add failure recovery to the release executor: re-runs skip completed steps,
  and a finalize failure after a successful publish must not flip the
  evidence to `failed`. Sibling paths: tag-conflict resume, empty-commit
  re-run.
- Classify critical-path infra probe failures: in CI, a probe failure is a
  gate failure, not a skip. Sibling paths: nitro probe, spawn failure.

### C. Evidence honesty

- WebKit: either add a WebKit smoke project to CI or reword
  `BROWSER_BASELINE.md` and the acceptance text to "Chromium and Firefox in
  CI, WebKit manually verified per release" with the manual run recorded in
  release evidence. Sibling paths: `test:e2e:browsers` wiring.
- Examples: fix the type errors in `deno-desktop-mastodon` and
  `deno-desktop-reader`, add an examples check/test gate to CI, and correct
  `VERIFICATION.md` to match what the gate actually proves. Sibling paths:
  examples unit tests in automation.
- Guide content: pick one source of truth for guide pages (render the
  markdown or delete it), make the zh guide actually render Chinese, and add
  a consistency check so tsx and md cannot drift again. Sibling paths: visual
  baselines encoding the wrong state, bare version mentions.
- STATUS/VERIFICATION honesty: completion states must enumerate unmet
  sub-items; the `/@fs/` Windows branch is verified or its limitation is
  recorded in the alpha.18 release note. Sibling paths: all gates-table rows.
- SPA action chain: add a browser-level test for submit → action → loader →
  actionData through shadow boundaries. Sibling paths: action failure
  normalization.

### D. Convergence and redundancy cleanup

- Rendering consistency: align camelCase prop serialization with static-prop
  observation (one casing rule); make the `For` drift token content-sensitive
  or document the same-length limitation; fix the `client-runtime` double
  hydration; skip non-event function props in the CSR path. Sibling paths:
  SSR string path, hydration walk, CSR DOM path — add one cross-path
  consistency test.
- SSG/handler parity: give the SSG `renderRoute` the error-boundary layer or
  document the divergence; remove or implement the dead `streaming`
  contract; complete the routeInfo type declarations.
- Delete confirmed dead code: `honoEntryCode`/`clientEntryCode`/
  `ssgEntryCode` fields, `unwrap`, `registerStaticObservedAttributes` (if
  still unused), `OpenElementRenderer`, the app-model speculative type
  cluster, `normalizeBasePath`/`normalizeRoutePath`, the orphaned `csr.ts`
  barrel, the `openMdx` alias, unused ui tagName re-exports,
  `open-hero-ping.tsx`, `tools/check-dist-no-object-object.ts`,
  `tools/smoke-deploy.ts`, `tools/deploy-pages.ts` (+test), and resolve
  `tools/check-import-map.ts` (delete or re-gate).
- Export surface tightening: move the listed internal-only element exports
  behind internals (breaking, with migration note); deduplicate
  `open-dialog`'s hand-rolled inert against native `showModal` semantics.
- Config hygiene: converge `deno.json` fmt/lint excludes to the config
  blocks, drop entries for non-existent paths, deduplicate `.gitignore`, and
  retire `REVIEW-REPORT.md` per the archive policy (git history preserves
  it). Remove `www/app/routes` from fmt/lint exclusions or record an ADR for
  keeping them. Register or delete the orphan tasks `actions:check-pins` and
  `verify:configs`.
- Clean local build artifacts (`dist/`, `custom-dist/`, `playwright-report/`,
  `.openElement/`, `packages/*/*.tgz`) and keep the root-hygiene gate as the
  standing guard.

### E. Alpha.18 release closure

- Run release-prepare only after A–D pass, synchronizing all five manifests,
  Create CLI, starter mappings and current version anchors to
  `0.41.0-alpha.18`.
- Pass AutoFlow, CodeQL, dependency review, Pages, all-browser E2E, Nitro,
  packaged consumers, artifacts and npm publish dry-run on `dev` and `main`.
- Publish all five npm packages under the `alpha` and `latest` dist-tags,
  then verify fresh Deno, Node ESM, starter, Nitro Node/Workers, third-party
  Web Component and CDN consumers through the supported `nitro-mount` seam.
- Create an immutable `v0.41.0-alpha.18` tag, GitHub prerelease with curated
  notes (including migration notes for removed exports), and a completed
  two-stage evidence record; finish with `origin/main` and `origin/dev` at
  the same SHA.

## Pull request order

1. ADR-0117, this plan, and the current contradictions cleanup (README,
   ROADMAP, STATUS, VERSION_PLAN header).
2. P0 correctness fixes (package A).
3. Release tooling closure (package B).
4. Evidence honesty (package C).
5. Convergence and redundancy cleanup (package D).
6. `dev -> main` release PR and post-publish evidence finalization.

Every implementation PR targets `dev`, identifies its plan package, lists the
sibling paths it enumerated, and passes AutoFlow before merge.

## Acceptance

- Reflected static props survive connect without write loops in Chromium,
  Firefox and WebKit, proven by browser tests.
- Dev, SSR and SSG outputs share one admission plan; CEM-admitted islands
  render identically across paths.
- Failed renders cannot ship silently: dynamic 500s fail or flag the build,
  static non-200s surface in the summary, and the ISR manifest is accurate.
- Local and CI release paths both leave main CI green with completed
  evidence; anchor gates reject stale version claims in every governed
  document.
- Every documentation claim about browsers, verification and completion is
  backed by automation or reworded to the evidence.
- The redundancy inventory is deleted; `deno.json`/`.gitignore` exclusions
  have one source of truth; no orphan tasks remain.
- Chromium, Firefox and WebKit pass the functional matrix, or the documented
  WebKit policy plus a recorded manual run takes its place in release
  evidence.
- The external adopter pilot #390 continues; new P0/P1 pilot findings become
  issues.
- npm, dist-tags, exact-version starter, tag, GitHub prerelease, docs and
  final evidence all agree on `0.41.0-alpha.18`.
- Alpha.17 evidence remains unchanged.

## Non-goals

- Do not add packages, publish JSR artifacts or claim broad fullstack parity.
- Do not introduce speculative auth, database, session or cache products.
- Do not restructure the `OpenElement` base class or introduce a diffing
  renderer.
- Do not promise stable `0.41.0` merely because alpha.18 publishes.
- Do not fabricate, simulate or replace external adopter evidence with
  internal CI runs.

## Test matrix

- Every package A fix lands with reproduction-first tests; reflect props and
  popstate guards are proven in a real browser project.
- Package B changes land with executor tests (resume, finalize failure) and
  anchor-gate fixtures (stale rejection).
- Package C adds the SPA action browser test and the examples CI gate.
- `deno task test`, `arch:check`, `graph:check`, `package-surface:check`,
  `type-safety:check` and `deno-api:check` pass for every PR.
- `deno task test:e2e` (Chromium) and the Firefox smoke pass for every PR.

## Release evidence requirements

- Two-stage evidence under `docs/release/` for `v0.41.0-alpha.18`, including
  npm version and dist-tag verification and post-publish consumer smoke.
- The release note records the breaking export removals with migration
  steps, the `/@fs/` verification outcome or limitation, and the WebKit
  policy outcome.
- Any new #390 pilot intake published during alpha.18 is anonymized and
  linked from the release evidence.

## Stable decision after alpha.18

`0.41.0` may be prepared only when the audit findings are closed without
half-fixed sibling paths, documentation claims match automation, the
adopter pilot finds no unresolved architecture-level break, and #37's
applicable `0.41.0` gates are evidenced. Otherwise the evidence selects a
narrowly scoped next alpha instead of weakening the stable contract.
