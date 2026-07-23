# OpenElement Status

> Updated: 2026-07-24\
> Repository package line: `v0.41.0-alpha.16`\
> npm registry line: `v0.41.0-alpha.16`\
> Active release target: `v0.41.0-alpha.17`\
> Next stability candidate: `v0.41.0`\
> Product graph: five packages\
> Current maturity stage: alpha

## Current position

OpenElement is a Web Components-native, static-first application framework.
Alpha.16 is the current published and verified line; it closed the audit-driven
P0 correctness fixes, drift clearance and release closure (ADR-0116). Alpha.17
completes the remaining audit remediation — test credibility, convergence
hygiene and strategic items — before a separate decision about stable `0.41.0`.

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
| `@openelement/ui`           | Optional | Proven primitives; stable scope decided in alpha.15 |

## Alpha.17 active gates

| Condition                                        | State                  |
| ------------------------------------------------ | ---------------------- |
| Alpha.17 plan and current-truth anchors          | In progress            |
| P1 test-credibility package                      | Pending                |
| P2 convergence and release-tooling package       | Pending                |
| External adopter pilot #390                      | Pending human evidence |
| Alpha.17 npm, tag, prerelease and final evidence | Pending                |

## Current risks

1. External adoption remains the primary product risk.
2. Current-document version drift needs stronger mechanical rejection;
   alpha.17 package B schedules the missing doc-anchor gate.
3. WC SSR compatibility still needs broader adopter evidence.
4. Request-time data, forms, sessions and cache are not stable interfaces.
5. UI remains optional until alpha.17 records its stable scope.

## Release direction

| Version           | Focus                                                |
| ----------------- | ---------------------------------------------------- |
| `0.41.0-alpha.16` | Current verified published baseline                  |
| `0.41.0-alpha.17` | Audit remediation completion (ADR-0116 packages B–D) |
| `0.41.0`          | Separate stable decision after alpha.17 evidence     |
| `0.42.0`          | WC Application Loop                                  |
| `0.43.0`          | Universal WC SSR compatibility and diagnostics       |
| `1.0.0`           | Stable five-package product                          |

## Evidence and workflow

- Mandatory workflow: [`PROJECT_WORKFLOW.md`](../governance/PROJECT_WORKFLOW.md)
- Active version contract: [`VERSION_PLAN.md`](../current/VERSION_PLAN.md)
- Audit remediation scope decision: [`ADR-0116`](../adr/ADR-0116-audit-driven-alpha16-correctness-reset.md)
- Current package surface: [`PACKAGE_SURFACE.md`](../current/PACKAGE_SURFACE.md)
- Alpha.16 immutable release record: [`v0.41.0-alpha.16.md`](../release/v0.41.0-alpha.16.md)
- Complete forward roadmap: [`ROADMAP.md`](../roadmap/ROADMAP.md)
