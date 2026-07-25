# Changelog

The maintained release record lives in [`docs/release/`](./docs/release/).

Current truth lives in:

- [`docs/current/VERSION_PLAN.md`](./docs/current/VERSION_PLAN.md)
- [`docs/current/PACKAGE_SURFACE.md`](./docs/current/PACKAGE_SURFACE.md)
- [`docs/status/STATUS.md`](./docs/status/STATUS.md)
- [`docs/roadmap/ROADMAP.md`](./docs/roadmap/ROADMAP.md)

Historical changelog details remain available through git history and release
evidence.

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
- Removes dead exports, fields and scripts (breaking; see the release
  note for migration), removes `renderIntent.streaming`, converges
  fmt/lint exclusions, and retires stale files and config entries.

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

## 0.41.0-alpha.11 (release candidate)

- Restores frozen-install and changed-path/release workflow truth.
- Fixes query decoding, SPA page-host data, dialog inert restoration, and
  theme propagation.
- Consolidates the Element/Adapter protocol seam and removes verified dead
  DSD, CEM, route-scanner, and UI escape code.
- Repairs clean Nitro Workers builds, semantic visual smoke, and package
  artifact allowlists.
- Enforces publishable runtime coverage at 69% lines, 81% branches, and 72%
  functions; tag and GitHub prerelease remain blocked until post-publish
  consumers pass.
