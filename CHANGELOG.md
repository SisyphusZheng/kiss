# Changelog

The maintained release record lives in [`docs/release/`](./docs/release/).

Current truth lives in:

- [`docs/current/VERSION_PLAN.md`](./docs/current/VERSION_PLAN.md)
- [`docs/current/PACKAGE_SURFACE.md`](./docs/current/PACKAGE_SURFACE.md)
- [`docs/status/STATUS.md`](./docs/status/STATUS.md)
- [`docs/roadmap/ROADMAP.md`](./docs/roadmap/ROADMAP.md)

Historical changelog details remain available through git history and release
evidence.

## 0.41.0-alpha.13 (unreleased)

- Removes the alpha-only `defineLayout` alias; use `defineElement` with the same
  arguments for layout elements.
- Restores declared static-prop defaults when reflected attributes are removed.
- Hardens SSR prop injection, custom-element hydration, params parsing, nested
  SSR depth, and adopted stylesheet composition.
- Stabilizes SPA action errors, caches same-route GET requests, bounds render
  data contexts, and compiles client routes into a declaration-ordered trie.
- Removes Preact bridge top-level await and public data-context mutation hooks.

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
