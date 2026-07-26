# OpenElement Status

> Updated: 2026-07-26\
> Repository package line: `v0.41.1`\
> npm registry line: `v0.41.1`\
> Active release target: `v0.41.0`\
> Next release line: `v0.42.0`\
> Product graph: five packages\
> Current maturity stage: stable (0.41.x)

## Current position

OpenElement is a Web Components-native, static-first application framework,
stable at `0.41.0` under ADR-0119: the interface freeze covers `defineElement`,
`definePage`, `buildApp`, the five-package graph, the supported subpaths and
the static/SPA semantics of `defineApp`; request-time semantics stay unfrozen
until 0.42/0.44. Alpha.19 completed the third audit cleanup sweep (ADR-0118)
and the #390 pilot requirement was retired by maintainer decision after zero
recruitment.

Custom Elements are the application component contract; JSX and Basic Element
are authoring modes; Declarative Shadow DOM is the default server output;
interactive regions upgrade selectively. Vite and Nitro are the official build
and output path.

## Product surface

| Package                     | Status   | Supported role                                      |
| --------------------------- | -------- | --------------------------------------------------- |
| `@openelement/element`      | Current  | Custom Elements, JSX, DSD, hydration and signals    |
| `@openelement/app`          | Current  | Pages, routes, islands and request/render semantics |
| `@openelement/adapter-vite` | Current  | Vite, content, static builds and Nitro output       |
| `@openelement/create`       | Current  | Installed starter and consumer entrypoint           |
| `@openelement/ui`           | Optional | Proven primitives; stable scope decided at v0.46    |

## 0.41.0 stable gates

| Condition                                                          | State               |
| ------------------------------------------------------------------ | ------------------- |
| ADR-0119 freeze scope (defineApp boundary + adapter subpath prune) | Completed           |
| #37 gate text refresh (0.41.0 subset, seven-day P0 watch)          | Completed           |
| Aggregate alpha-line migration guide + ui geometry note            | Completed           |
| 0.41.0 npm, tag, GitHub release and two-stage evidence             | Completed           |
| Seven-day P0 watch on the 0.41.x patch line                        | Started 2026-07-26  |
| External adopter pilot #390                                        | Retired by ADR-0119 |

## Current risks

1. External production adoption is now the primary proof the 0.41.x line needs.
2. Current-document version drift keeps reappearing at gate edges; alpha.18
   package B makes the anchor gates reject stale claims.
3. WC SSR compatibility still needs broader adopter evidence.
4. Request-time data, forms, sessions and cache are not stable interfaces.
5. UI remains optional until v0.46 records its stable scope.

## Release direction

| Version           | Focus                                            |
| ----------------- | ------------------------------------------------ |
| `0.41.0-alpha.17` | First audit remediation baseline (ADR-0116)      |
| `0.41.0-alpha.18` | Second audit sweep (ADR-0117)                    |
| `0.41.0-alpha.19` | Third audit cleanup sweep (ADR-0118)             |
| `0.41.0`          | Separate stable decision after alpha.19 evidence |
| `0.42.0`          | WC Application Loop                              |
| `0.43.0`          | Universal WC SSR compatibility and diagnostics   |
| `1.0.0`           | Stable five-package product                      |

## Evidence and workflow

- Mandatory workflow: [`PROJECT_WORKFLOW.md`](../governance/PROJECT_WORKFLOW.md)
- Active version contract: [`VERSION_PLAN.md`](../current/VERSION_PLAN.md)
- Second-sweep scope decision: [`ADR-0117`](../adr/ADR-0117-second-audit-round-alpha18-sweep.md)
- Third-sweep cleanup decision: [`ADR-0118`](../adr/ADR-0118-third-audit-round-alpha19-cleanup-sweep.md)
- Current package surface: [`PACKAGE_SURFACE.md`](../current/PACKAGE_SURFACE.md)
- Alpha.17 immutable release record: [`v0.41.0-alpha.17.md`](../release/v0.41.0-alpha.17.md)
- Alpha.18 immutable release record: [`v0.41.0-alpha.18.md`](../release/v0.41.0-alpha.18.md)
- Complete forward roadmap: [`ROADMAP.md`](../roadmap/ROADMAP.md)
