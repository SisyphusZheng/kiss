# OpenElement Status

> Updated: 2026-08-02\
> Repository package line: `v0.42.0-alpha.12`\
> npm registry line: `v0.42.0-alpha.12` (published 2026-08-02, dist-tag `alpha`)\
> Active release target: `v0.42.0-alpha.12`\
> Next release line: `v0.42.0` (WC light fullstack)\
> Product graph: five packages\
> Current maturity stage: stable (0.41.x); 0.42 alpha in flight

## Current position

OpenElement is a Web Components-native, static-first application framework,
stable at `0.41.0` under ADR-0119: the interface freeze covers `defineElement`,
`definePage`, `buildApp`, the five-package graph, the supported subpaths and
the static/SPA semantics of `defineApp`; request-time semantics stay unfrozen
until 0.42/0.44. Alpha.19 completed the third audit cleanup sweep (ADR-0118)
and the #390 pilot requirement was retired by maintainer decision after zero
recruitment. The `0.41.1` patch carries the third-party audit's fixable
tooling and hygiene set with no frozen-surface change.

Custom Elements are the application component contract; JSX and Basic Element
are authoring modes; Declarative Shadow DOM is the default server output;
interactive regions upgrade selectively. Vite and Nitro are the official build
and output path.

## Product surface

| Package                     | Status   | Supported role                                                                 |
| --------------------------- | -------- | ------------------------------------------------------------------------------ |
| `@openelement/element`      | Current  | JSX, Custom Elements, DSD, hydration, signals and component runtime contracts  |
| `@openelement/app`          | Current  | Pages, routes, loaders, actions, islands and normalized request semantics      |
| `@openelement/adapter-vite` | Current  | Vite, content, SSG, generated data, Hono and Nitro build/deploy implementation |
| `@openelement/create`       | Current  | Version-coherent starter generation and consumer lifecycle                     |
| `@openelement/ui`           | Optional | Optional, reusable and dogfood-proven Web Component primitives                 |

Responsibility wording follows
[`STACK_CONTRACT.md`](../current/STACK_CONTRACT.md), the source of truth for
the five-package responsibility table.

## 0.41.0 stable gates

| Condition                                                          | State                |
| ------------------------------------------------------------------ | -------------------- |
| ADR-0119 freeze scope (defineApp boundary + adapter subpath prune) | Completed            |
| #37 gate text refresh (0.41.0 subset, seven-day P0 watch)          | Completed            |
| Aggregate alpha-line migration guide + ui geometry note            | Completed            |
| 0.41.0 npm, tag, GitHub release and two-stage evidence             | Completed            |
| 0.41.1 tooling-hardening patch (third-party audit fixable set)     | Completed            |
| Seven-day P0 watch on the 0.41.x patch line                        | Completed 2026-08-01 |
| External adopter pilot #390                                        | Retired by ADR-0119  |

## Current risks

1. External production adoption is now the primary proof the 0.41.x line needs.
2. Current-document version drift keeps reappearing at gate edges; alpha.18
   package B makes the anchor gates reject stale claims.
3. WC SSR compatibility still needs broader adopter evidence.
4. Request-time loop is implemented through alpha.9; two hygiene trains
   landed before the 0.42.0 stable freeze: TP-5.8 (#619–#623 — route-scanner
   correctness, ADR-0095 DataAdapter drift, collectPublicProps dedup, start
   CLI runtime, logger tags) and the alpha.9 cleanup train (#632–#644).
5. Framework session and cache remain unfrozen until 0.44; login apps use
   recipes (better-auth) and must not wait on framework session APIs.
6. UI remains optional until v0.46 records its stable scope.
7. Cross-runtime claim (Deno/Node/Bun) is partially unmet: the `start` CLI
   is cross-runtime since #622 (Node 18+/Deno/Bun via `node:http`), but the
   Node/Bun paths have no CI smoke yet; full strategy targets 0.43.

## 0.42 direction

The `0.42.0` line is **WC light fullstack**: Application Loop (ADR-0120) plus
first-mile ops and CSRF floor. Planned in
[`VERSION_PLAN.md`](../current/VERSION_PLAN.md) (TP-0…TP-6; **TP-5.7** closed
with alpha.9; the active line is alpha.10, post-TP-5.7 remediation toward
**TP-6**). Protocol evidence:
[`docs/audit/2026-07-27-application-loop-framework-research/`](../audit/2026-07-27-application-loop-framework-research/README.md).

Product promise at `0.42.0`: dynamic loader/action, no-JS + enhanced forms,
`build → start`, fail-closed static prerender, default same-origin CSRF,
login via recipe on `Request`. **Not** in 0.42: framework session/flash,
cache/ISR, auth packages (0.44 or recipes).

## Release direction

| Version           | Focus                                                                    |
| ----------------- | ------------------------------------------------------------------------ |
| `0.41.0-alpha.17` | First audit remediation baseline (ADR-0116)                              |
| `0.41.0-alpha.18` | Second audit sweep (ADR-0117)                                            |
| `0.41.0-alpha.19` | Third audit cleanup sweep (ADR-0118)                                     |
| `0.41.0`          | Separate stable decision after alpha.19 evidence                         |
| `0.42.0-alpha.8`  | Version hole: TP-5.7 cut failed npm publish; carried into alpha.9        |
| `0.42.0-alpha.9`  | TP-5.7: light-fullstack floor + audit round 3 + hygiene #619–#623        |
| `0.42.0-alpha.10` | Audit round 4 + remediation trains (#646–#752); milestone #17 issue-zero |
| `0.42.0`          | WC light fullstack (Application Loop freeze)                             |
| `0.43.0`          | Universal WC SSR + diagnostics + recipes (#624–#631)                     |
| `0.44.0`          | Production runtime (session/cache/OTel/streaming)                        |
| `1.0.0`           | Stable five-package product                                              |

> **Version hole — `0.42.0-alpha.8` is skipped / npm-unpublished.** Its git tag
> (`0ec10568`) and GitHub release exist, but the npm publish never completed, so
> `@openelement/*@0.42.0-alpha.8` is **absent from the registry**. It was
> immediately superseded by `0.42.0-alpha.9`, the first fully npm-published
> `0.42.0` prerelease. Treat alpha.8 as a skipped prerelease, not a real
> release. Post-mortem: `docs/release/v0.42.0-alpha.8.md`.

## Evidence and workflow

- Mandatory workflow: [`PROJECT_WORKFLOW.md`](../governance/PROJECT_WORKFLOW.md)
- Active version contract: [`VERSION_PLAN.md`](../current/VERSION_PLAN.md)
- Second-sweep scope decision: [`ADR-0117`](../adr/ADR-0117-second-audit-round-alpha18-sweep.md)
- Third-sweep cleanup decision: [`ADR-0118`](../adr/ADR-0118-third-audit-round-alpha19-cleanup-sweep.md)
- Current package surface: [`PACKAGE_SURFACE.md`](../current/PACKAGE_SURFACE.md)
- Alpha.17 immutable release record: [`v0.41.0-alpha.17.md`](../release/v0.41.0-alpha.17.md)
- Alpha.18 immutable release record: [`v0.41.0-alpha.18.md`](../release/v0.41.0-alpha.18.md)
- Complete forward roadmap: [`ROADMAP.md`](../roadmap/ROADMAP.md)
