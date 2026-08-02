# Changelog

> **Historical archive.** The maintained, per-release record lives in
> [`docs/release/`](./docs/release/) and is the authoritative source. This file
> is an aggregated history only: it is **not re-synchronized release by
> release** and there is no mechanism keeping it in lockstep with
> `docs/release/`. When the two disagree, `docs/release/` wins.

Current truth lives in:

- [`docs/current/VERSION_PLAN.md`](./docs/current/VERSION_PLAN.md)
- [`docs/current/PACKAGE_SURFACE.md`](./docs/current/PACKAGE_SURFACE.md)
- [`docs/status/STATUS.md`](./docs/status/STATUS.md)
- [`docs/roadmap/ROADMAP.md`](./docs/roadmap/ROADMAP.md)

Historical changelog details remain available through git history and release
evidence.

## 0.42.0-alpha.10

- Cleanup and hardening train (milestone #17, 97/97 issues closed): the
  evidence-chain batch (#646–#653), the P1 correctness batch, the P2 batch and
  the P3/P4 hygiene sweep land together. No new product surface; the ADR-0119
  freeze surface and the ADR-0120 Application Loop scope are untouched.
- Release tooling: two-stage publish now requires a durable, gated prepare
  record — publish-existing refuses to run without one (#684, closes the
  alpha.8 version-hole class); the docs stale guard is parameterized off
  `PREVIOUS_PACKAGE_VERSION` so the next bump cannot self-collide (#727);
  `bump-version.ts` documents its half-bump role (#687); the dead JSR publish
  channel is removed (#746).
- Runtime correctness: element `update()` routes re-render errors to
  `onRenderError` (#662); SPA loader failures take the `__openElementError`
  channel (#676) and SPA loader/action honor `redirect()`/`notFound()` with
  real navigation (#731); ui double-escaping removed (#726), open-tabs
  accessibility rewrite (#666) and instance-unique ARIA ids (#745), open-dialog
  SSR `open` sync (#667); generated-data writes fail closed in build mode
  (#671); `getStaticPaths` errors honor `dynamicRouteFailure: 'fail'` (#672);
  the start CLI static server is shared with the CI fixture and its
  request-time response unwrap is fixed (#732); `adapter-vite` declares its
  `typescript` dependency so published consumers resolve (#725).
- Hygiene: element's three internal barrels collapse to one (#739); the dead
  `internal/content/mdx/` directory, protocol seam shells, codegen dead
  re-exports and the JSR machinery are deleted (#694/#697/#741/#746);
  zero-consumer exports dropped across app/element/ui (#740/#743/#747);
  www guide pages share one shell and dead islands/icons/blog content are
  removed (#749/#748); audit reports archive under `docs/audit/` with the
  citation guard rescanning them (#751).
- Breaking (unfrozen alpha surface, per PACKAGE_SURFACE.md): `@openelement/app`
  drops `i18nStaticPaths`/`switchLocale`/`AppIslandOptions` and the
  `OpenElementRouteNode` re-export from `./model` (#743);
  `@openelement/ui/open-props-tokens` no longer exports `OPEN_PROPS_TOKEN_CSS`
  (#747); the generated ui manifest corrects open-tabs slots to
  `['tab','panel']` (#744). `@openelement/element` gains `@experimental`
  exports: ISR cache types (#729) and the third-party client runtime
  `hydrateOpenElement`/`disposeOpenElement` (#740).
- Docs truth: the npm registry line and the source line are now stated as two
  lines everywhere (README/ROADMAP/WORKFLOW/www), and the version-anchor and
  www-truth gates enforce the dual-line form (#730); `docs/integrations/` is
  covered by a package-surface truth gate (#737); the Fresh guide is rewritten
  against the real example (#728); the ISR KV adapter contract samples compile
  (#729).

## 0.42.0-alpha.9

- Cleanup train (TP-5.7, milestone #16): 13 findings from the 2026-07-30 team
  cross-review (issues #632–#644) landed as a quality/hygiene drop. No new
  product surface; ADR-0119 freeze surface and 0.42 Application Loop scope
  (ADR-0120) are untouched.
- Correctness: `<open-button>` now binds `_handleClick` as an arrow-field so the
  framework's raw `addEventListener` wires `this` to the component instance —
  shadow-DOM submit events now reach the outer form (#637). Request-scoped
  context is passed explicitly through render/hydrate entry points (#632/#644);
  logger `_warned` moved to render scope (#643); `app` reuses
  `@openelement/element`'s `createLogger` (#636).
- Hygiene: removed the redundant `app` re-export layer (#634); dropped a dead
  router data-context module; trimmed unused exports across `packages/*`
  (#633/#635/#642/#643/#644).
- Release evidence: closure recorded at the tagged merge commit; all five packages
  (`@openelement/element`, `app`, `adapter-vite`, `ui`, `create`) are published to npm
  with `dist-tag alpha=0.42.0-alpha.9`.

## 0.42.0-alpha.8

- **Incomplete release (npm-unpublished).** `v0.42.0-alpha.8` was cut as a
  mechanical version bump with a git tag and GitHub release, but the npm publish
  step failed and the packages were never published. It is a **version hole**:
  `git tag v0.42.0-alpha.8` and the GitHub release exist, but
  `@openelement/*@0.42.0-alpha.8` is absent from the registry and no AutoFlow3
  closure was written.
- Immediately superseded by `0.42.0-alpha.9`, the first fully npm-published
  `0.42.0` prerelease. Retained as-is per `docs/release/v0.42.0-alpha.8.md`
  (no closure by design). See that note for the post-mortem.

## 0.42.0-alpha.7

- Patch release (publish-existing): `0.42.0-alpha.6` → `0.42.0-alpha.7`,
  status `completed`. All five packages published to npm with `dist-tag alpha`;
  a full AutoFlow3 evidence chain was recorded (verify source version → main CI
  → artifact gate → publish npm → verify npm versions/dist-tags → consumer
  smoke → third-party Web Component smoke → stage/commit evidence → tag → push
  → GitHub release).
- Tag commit `e0e46281`; publish run `30431305870`. `/@fs/` Windows verification
  status tracked in `docs/current/HYDRATION_CONTRACT.md` (Known limitations).

## 0.42.0-alpha.6

- Audit round 2 remediation (TP-5.6): the second, independent review of
  the application loop
  ([`docs/audit/2026-07-28-alpha5-round2-review.md`](./docs/audit/2026-07-28-alpha5-round2-review.md),
  issues #576–#593) is closed — five high-severity defects in the morph
  client plus the protocol and evidence tail.
- Morph client correctness: an explicit `<form action>` now wins over
  the page URL on enhanced submits (#576); the popstate guard survives
  reloads and bfcache restores (#578); morphed-in islands show the
  server render (manual DSD instantiation before insertion, #579);
  morph matching is an ordered walk with exact deletion and relocation —
  reordered id-keyed lists keep order AND island state (#580); nested
  DSD compares normalized on both sides (#582); forms inside
  late-hydrating islands get the enhancement listener (#584); a
  cancelable `open:action-error` hook precedes the network-failure
  reload (#585); morph fallbacks log a reason in dev (#589).
- Detection: `hasEnhancedForms` follows relative imports, so an enhanced
  form inside a shared component no longer loses the enhancement layer
  silently (#577).
- Protocol tail: malformed form bodies answer 400 on both channels
  (#581); the redirect duck type honors the 3xx whitelist (#583);
  405 responses carry no-store/Vary (#586).
- Evidence: parity contract extended to JSON 404 / contract-violation
  500 / malformed-body 400 / 405 / the 303→GET chain (#587); local
  playwright retries are zero (#590); the alpha.2 note gets the
  enhancement-inert erratum (#591).

## 0.42.0-alpha.5

- Audit round 1 remediation (TP-5.5, ADR-0121): the first implementation
  audit of the 0.42 line (#539–#573) is closed — protocol hardening, a
  morph client rewrite, security hygiene and an evidence-honesty sweep.
- Headline root cause: the alpha.3 morph enhancement never fired — the
  `submit` event is not composed and page content lives inside
  page-element DSD shadow roots, so the document-level listener never saw
  enhanced forms. The client is rewritten around shadow-root submit
  interception and shadow-content morphing; the island-survival claims
  are now mechanically true (errata appended to the alpha.3/alpha.4
  notes).
- Protocol (ADR-0121): the prerender hard rule covers named `actions`;
  named-action dispatch is own-key gated; one `x-openelement-action`
  header (`true` = ActionResult JSON, `enhance` = HTML morph) with
  `Vary`; an action returning a `Response` is a contract violation; the
  default PRG strips the `?/name` marker; every 3xx coerces to 303 on
  POST and `redirect()` validates its status; fetch callers always
  receive ActionResult JSON (404/500 included, production-scrubbed);
  request-time responses carry `Cache-Control: no-store`; POST takes the
  same error boundary as GET; action POSTs get a 10 MB body limit;
  non-GET/POST methods answer 405.
- Morph continuity: form-scoped `data-open-region` targeting with
  navigation fallback, id-keyed + lookahead identity matching, popstate
  reload, `open:action-failure` restored (cancelable), submitter
  name/value preserved in the enhanced body, 500/cross-origin responses
  navigate instead of morphing, double-submit guard, fragment
  preservation, `<details>`/media state protection. The full survival
  matrix is documented in `docs/current/MORPH_CONTRACT.md`.
- Evidence: the request-time fixture suite (42 tests) runs on Chromium,
  Firefox and WebKit in the ci and release gate tiers; a static-output
  determinism gate ships (`check:static-output-freeze`); a dev(hono) vs
  build(Nitro) parity contract test boots both real servers; the perf
  baseline records its environment
  (`docs/release/v0.42.0-alpha.5-performance.json`).
- Also fixed along the way: dev SSR crashed on every route (missing
  `customElements` polyfill — now shipped to the dev entry);
  `[...path]` request-time routes; zero-island apps with enhanced forms
  (the enhancement layer is emitted only when enhanced forms exist, so
  island-only sites keep their lean bundle); the starter's `/contact`
  route (it was never shipped in `TEMPLATE_FILES`) now builds and is
  POST-smoked in consumer CI; SPA vs request-time loader/action types
  and docs are honest; a CSRF threat-model page ships in the guide.

## 0.42.0-alpha.4

- Hardening and recipes (TP-5, ADR-0120): the 0.42 line closes with
  integration proof instead of new semantics.
- Validation recipes verified in CI: zod (`/register`) and valibot
  (`/subscribe`) run inside fixture actions with 422/303 asserted in three
  engines — `docs/integrations/validation.md`. better-auth and Drizzle
  recipes are published as doc-level (honestly marked unverified):
  `docs/integrations/better-auth.md`, `docs/integrations/drizzle.md`.
- The `create` starter gains a request-time `/contact` route exercising
  the full loop (`rendering: 'dynamic'` + action + `data-open-enhance`),
  so starter consumers get the loop out of the box.
- `PACKAGE_SURFACE.md` records the 0.42 line additions as unfrozen with
  their freeze target.
- Performance baseline for 0.44: request-time render on the fixture is
  cold 28.6ms, warm p50 1.58ms / p95 2.97ms
  (`docs/release/v0.42.0-alpha.4-performance.json`).
- Fix (from alpha.3): the morph could replace an island whose light DOM
  carried whitespace-only text around the DSD template, resetting its
  state; the comparison now ignores whitespace-only text nodes, covered
  by the survival matrix in three engines (42/42).

## 0.42.0-alpha.3

- Revalidation continuity (ADR-0120): enhanced forms (`data-open-enhance`)
  now morph the returned document into place instead of reloading —
  submission returns the same HTML the no-JS path renders (303/422), the
  client morphs it, and `history.pushState` follows the PRG target.
- Island survival: a hydrated island whose light-DOM surface is unchanged
  in the incoming document keeps its shadow state (the DSD template child
  is excluded from the comparison). Islands whose surface changed are
  replaced; `data-open-preserve` exempts any subtree; the island client
  script is never re-executed by a morph.
- Named regions: a `data-open-region` container limits the morph to the
  matching region when present.
- The ActionResult JSON path remains for custom clients; the built-in
  enhancement uses HTML morphing for continuity.
- Fixture proof: counter island at 3 survives a 422 morph and a PRG
  morph; static/request-time mixed navigation — Chromium, Firefox and
  WebKit, 36/36.

## 0.42.0-alpha.2

- The form/action loop (ADR-0120): plain HTML forms work without
  JavaScript on `rendering: 'dynamic'` routes.
- Protocol: actions run before loaders (revalidation invariant);
  `fail(4xx, data)` returns take the 422 re-render channel with the echo;
  successful mutations answer 303 (PRG) — never a 200 render; redirects
  thrown from actions coerce to 303; POST without an action is a defined
  404.
- Named actions dispatch via `formaction='?/name'`
  (`export const actions = { name(ctx) {...} }`); unknown names are a
  defined 404.
- Fetch callers (`x-openelement-action` header) receive the `ActionResult`
  discriminated union (`failure`/`redirect`/`error`); the island client
  entry enhances `data-open-enhance` forms with the same protocol and no
  DOM surgery — unhydrated islands are untouched, failure falls back to
  the native 422 render unless the page handles `open:action-failure`.
- Contract: an action must be safe to re-run after a failed validation
  (validate first, mutate after).
- e2e: the full loop passes with `javaScriptEnabled: false` and on the JS
  enhancement path — Chromium, Firefox and WebKit, 33/33.

## 0.42.0-alpha.1

- First alpha of the 0.42 line (ADR-0120): request-time rendering gains
  semantics — `renderIntent.mode` was inert metadata before this release.
- `rendering: 'dynamic'` routes skip prerendering, dynamic expansion and
  i18n locale prerendering; they are served per request by the generated
  `dist/server/index.js` (nitro-mount over the same SSR bundle), with
  `dist/server/server-manifest.json` recording the partition.
- Hard rule (ADR-0120): pages with actions cannot be prerendered — a route
  module exporting an action without `mode: 'dynamic'` fails the build.
- BuildPlan evidence records `requestTimeRoutes`; pure-static projects emit
  no new artifacts (byte-identical public output proven against the 0.41.2
  build: zero HTML/JS/CSS differences).
- Request-time e2e fixture under
  `packages/adapter-vite/__fixtures__/request-time/` proves loader data
  varies per request and islands hydrate identically to static pages
  (Chromium, Firefox and WebKit, 12/12).
- Request-time HTML now receives the island client entry automatically —
  the generated server entry injects the same script the static pipeline
  injects post-build (found by the fixture; without it, islands on
  request-time pages never hydrated). A latent `__headExtras is not
  defined` codegen bug for projects without head extras is fixed too.
- Loader/action contract types (`Loader`/`LoaderContext`/`Action`/
  `ActionContext`) are unchanged — they already shipped; this alpha wires
  the rendering-mode semantics around them.

## 0.41.2

- Patch release: release-tooling self-repair (TP-0 of the 0.42.0 plan) — no
  public API, topology or runtime-default changes.
- A resumed patch release no longer skips a version: the target is
  re-derived from recorded evidence when a previous attempt already bumped
  the package line (the 0.41.1 → 0.41.2 incident, reverted in `10038c4d`).
- New release line-prose gate: the version-anchor bump records the www
  roadmap current-line entry's superseded theme in
  `tools/project-constants.ts`, and the www truth gate fails a release
  until the new release theme is written (the 0.41.1 bump had shipped
  alpha.19's theme under the `v0.41.1` timeline entry).

## 0.41.1

- Patch release: tooling hardening and hygiene from the third-party audit's
  fixable set — no public API, topology or runtime-default changes.
- adapter-vite `dist`/`.openElement` magic strings converge on shared
  `internal/paths.ts` constants; `tools/lib/fs.ts` gains shared
  `readText`/`readJson` used across ten tooling files.
- The repo-hygiene gate now scans credential files and credential-shaped
  content and rejects tracked binaries over 1 MiB outside intentional
  design/e2e/fixture locations.
- vite 8.0.10 → 8.0.16 across root, examples and adapter-vite (the latter's
  pin was the hidden cause of a tsc crash on dual-config typechecks).
- Version guards learn the stable line: www-truth retires the same-base
  alpha line instead of disabling itself on stable versions, publish dry-run
  skips already-published versions, and stale-claim fixtures no longer
  assume an alpha current line.
- `CONTRIBUTING.md` records the `no-sloppy-imports` rationale; stale merged
  branches were pruned.

## 0.41.0

- Stable five-package release (ADR-0119): the interface freeze covers
  `defineElement`, `definePage`, `buildApp`, the package graph, the supported
  subpaths and the static/SPA semantics of `defineApp`; request-time data,
  forms, sessions and cache stay explicitly unfrozen until 0.42/0.44.
- Adapter-vite internal subpaths pruned at the freeze (`app-vite`,
  `build-context`, `head-injection`, `i18n-plugin`, `plugin`,
  `generated-data-resolver`, `plugin-mdx`, `route-manifest`,
  `cli/build-client`, `cli/build-ssg`) — use the root, `nitro-mount`,
  `cli/build` and `sitemap` instead (breaking; see the migration guide).
- The #390 external adopter pilot is retired by maintainer decision after
  zero recruitment (recorded exception, not replaced with internal evidence);
  the seven-day P0 watch on the 0.41.x patch line starts at this release.
- Aggregate migration guide from 0.40.x and every alpha line release:
  `docs/release/v0.41.0-migration.md` and the site's `/guide/migration` page.
- ui control geometry is squared (`--btn-radius`, `--badge-radius`,
  `--ui-control-radius`: `--radius-round` → `--radius-1`, 6px) — visual
  breaking change; update screenshots and custom control CSS.
- The release verifier now supports stable `x.y.z` versions
  (prerelease-only before), and the version guards stay honest on a stable
  current line.

## 0.41.0-alpha.19

- Third audit round cleanup sweep (ADR-0118, issues #481-#506); no new
  product surface.
- Fixes the reflect removal suppression (Boolean `default: true` desync),
  the popstate redirect-then-block URL fork, and For drift-token separator
  collisions; the reflect browser spec joins the Firefox/WebKit smoke gates.
- Closes the export-star seams: the element root switches to explicit type
  export lists, `SafeHtml`/`UnsafeHtml`/`StyleSheetRule` leave the root for
  real, and the internal `open-element-render`/`open-element-hydration`
  subpaths are pruned from element exports (breaking type-surface changes;
  see the GitHub prerelease notes for migration).
- Single-sources `HYDRATION_STRATEGIES` and the routeInfo contract, sinks
  the release executor into `release.ts` with orchestration tests, and
  preserves curated release-note sections so migration records stay in the
  durable record.
- Mechanizes the audit's edge findings: www truth catches bare version
  mentions, anchor gates catch body drift, the assertion-style gate covers
  every package test, graph direction rules are explicit, and the deno-api
  check catches `globalThis.Deno`/destructuring/`npm:` patterns.
- Deletes the third-round dead-code inventory (renderDsdStream,
  bindHydrateEvents, generateHonoEntryCode, tools/test-fixtures, orphan
  tasks, dead config entries) and rewrites the always-true test assertions.

## 0.41.0-alpha.18

- Fixes the `reflect: true` static-prop write loop and SSR attribute
  overwrite; resolves the root-level `<Show>`/`<For>` CSR edge; unifies
  prop attribute casing; makes `For` branch tokens content-sensitive;
  fixes client-runtime double hydration; runs router guards on history
  traversal; honors `prefers-color-scheme` in theme-init.
- Shares one CEM admission plan across dev/SSR/SSG; dynamic-route render
  failures now fail the build (opt-out `'warn'`); failed pages never ship
  nor enter the ISR manifest; static non-200 outcomes are summarized.
- Local releases land evidence and closure on main; anchor gates reject
  stale version claims; the bump maintains every currency line; the
  release executor resumes from failures.
- Adds WebKit smoke to CI, gates examples checks, single-sources the
  guide with real Chinese rendering, and covers the SPA action chain in a
  real browser.
- Removes dead exports, fields and scripts (breaking; see the GitHub
  prerelease notes for migration), removes `renderIntent.streaming`,
  converges fmt/lint exclusions, and retires stale files and config entries.

## 0.41.0-alpha.17

- Covers hydration and binding behavior in a real browser: signal text
  patching, event hydration, SSR/hydration mismatch fallback and form
  submission through shadow boundaries.
- Wires SSR error collection: a failing route render produces a defined 500
  result with `RenderError` diagnostics; the unread `hydrationHints`
  contract is removed.
- Converges island declaration construction, single-instantiates the entry
  descriptor, deduplicates the SPA/SSG phase-2 blocks and shares route
  rendering helpers; deletes the unwired external-resolver, the
  `clientOnlyTags` chain and dead build-context fields.
- Counts every source file in the coverage denominator and re-baselines
  thresholds on measured values; the critical-path gate runs its e2e suites
  for real and can no longer skip them on failure output.
- Adds a Firefox smoke project to CI for the core DSD/hydration/theme
  specs.
- Adds a mechanical version-anchor gate across governance documents, and
  the release bump now maintains `ACTIVE_EXECUTION_VERSION`.
- Fixes `publish-existing` evidence: records the true previous package
  line, rewrites GitHub release notes from completed evidence, and
  generates the release closure record automatically.
- Moves adapter build-time utilities from the `@openelement/element` root
  to `@openelement/element/build-utils`, stops exporting internal router
  types from the `@openelement/app` root, and aligns `PACKAGE_SURFACE.md`
  with a machine-checked exports inventory. Breaking surface removals:
  element root build utilities (migrate to `./build-utils`), app root
  `RouteConfig`/`RouterInstance`/`RouterMode` types, adapter-vite
  `ExternalManifest` type and `SsgPageOutput.hydrationHints`.
- Publishes the #390 external adopter pilot kit and launches recruitment.

## 0.41.0-alpha.16

- Aligns SSR and hydration event markers for custom-element hosts and
  `Show`/`For` branches; hydration validates marker counts and branch tokens
  and falls back to client re-render on mismatch.
- Merges static-props `observedAttributes` at class-definition time so
  attribute-to-signal synchronization works in real browsers.
- Matches island chunks via the client build manifest, fixes base64url hash
  handling, names `.tsx`/`.jsx` island chunks, and normalizes Windows
  drive-letter island paths (#460).
- Enforces the npm `latest` dist-tag invariant for prereleases in the publish
  tooling and release verifier.
- Clears current-truth drift across governance documents and removes dead
  gate triggers (ADR-0116 packages A and E).

## 0.41.0-alpha.15

- Modernizes the CI runtime (GitHub Actions Node 24 with reviewed immutable
  SHAs) and makes external review advisory.
- Enforces current-truth wording mechanically across governance documents and
  the website.
- Ships the #390 external-adopter pilot kit, cross-platform published-consumer
  runs and a five-package public-interface snapshot for the freeze rehearsal.
- Records the stable-readiness dossier; #390 and #37 remain open by design.

## 0.41.0-alpha.14

- Recovers the release line with an exact-version starter, verified published
  consumers and honest two-stage release evidence.
- Publishes all five packages under the `alpha` dist-tag with post-publish
  Deno, Node ESM, Nitro and third-party Web Component smoke evidence.

## 0.41.0-alpha.13 (publication failed; changes shipped in alpha.14)

- Removes the alpha-only `defineLayout` alias; use `defineElement` with the same
  arguments for layout elements.
- Restores declared static-prop defaults when reflected attributes are removed.
- Hardens SSR prop injection, custom-element hydration, params parsing, nested
  SSR depth, and adopted stylesheet composition.
- Stabilizes SPA action errors, caches same-route GET requests, bounds render
  data contexts, and compiles client routes into a declaration-ordered trie.
- Removes Preact bridge top-level await and public data-context mutation hooks.
- Hardens Adapter Vite i18n, head sanitization, sitemap, island manifests,
  npm-specifier rewriting, asynchronous manifest reads, CORS defaults, and
  AST-based route metadata extraction.
- Moves UI tokens to a CSS source of truth with generated-output drift checks,
  and makes Create template generation asynchronous, deterministic, and bound
  to the five-package same-version release invariant.

## 0.41.0-alpha.11

- Restores frozen-install and changed-path/release workflow truth.
- Fixes query decoding, SPA page-host data, dialog inert restoration, and
  theme propagation.
- Consolidates the Element/Adapter protocol seam and removes verified dead
  DSD, CEM, route-scanner, and UI escape code.
- Repairs clean Nitro Workers builds, semantic visual smoke, and package
  artifact allowlists.
- Enforces publishable runtime coverage at 69% lines, 81% branches, and 72%
  functions; published with tag, GitHub prerelease and post-publish consumer
  evidence (see `docs/release/v0.41.0-alpha.11.md`).
