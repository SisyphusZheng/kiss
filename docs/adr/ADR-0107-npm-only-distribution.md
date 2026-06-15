# ADR-0107: npm-Only Distribution

## Status

Accepted.

## Context

ADR-0100 restored JSR publish as a required release exit gate for current
releases, and ADR-0101 established AutoFlow3 as the governance control plane for
the v0.40 product-line reset. Since then, the project has proven npm artifacts
through Deno `npm:` consumer smoke and jsDelivr CDN smoke, and the v0.41 roadmap
line is explicitly npm-first.

JSR multi-package publishing has continued to show reliability gaps for this
workspace, and maintaining two registry publication paths adds release risk
without adding user value. npm is the de-facto registry for the target audiences
(browser tooling, Node/Edge runtimes, design-system consumers), and Deno
supports npm packages natively through `npm:` specifiers.

## Decision

Starting with the v0.41.0 line, openElement distribution is **npm-only**. JSR
publish is no longer a required release exit gate and is treated as historical
distribution telemetry only.

The v0.41+ release closure requires:

1. Local package graph and `publish:dry-run` pass against npm artifacts.
2. npm trusted publishing from GitHub Actions succeeds for the 11-package line.
3. Deno `npm:` consumer smoke passes for at least one representative package.
4. jsDelivr or equivalent CDN smoke passes for browser-safe exports.
5. Status, roadmap, release checklist, and README files describe npm as the
   current distribution truth and do not describe JSR as a required exit gate.

## Consequences

- `ADR-0100` is superseded for v0.41+ release exit criteria. v0.40.x releases
  that already closed under ADR-0100 remain historically valid.
- Release tooling drops JSR publish steps from the mandatory release path.
- Package manifests continue to be ESM-first and Deno-compatible; only the
  registry target changes.
- AutoFlow health and gate listings should surface npm publish, `npm:` consumer
  smoke, and CDN smoke as release gates for v0.41+.

## Non-Goals

- This ADR does not require renaming packages or changing package ownership.
- This ADR does not remove existing JSR published versions.
- This ADR does not change the v0.40.x release evidence already recorded.
