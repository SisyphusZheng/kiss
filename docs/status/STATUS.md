# OpenElement Status

> Updated: 2026-07-16\
> Repository package line: `v0.41.0-alpha.15`\
> npm registry line: `v0.41.0-alpha.14`\
> Active release target: `v0.41.0-alpha.15`\
> Next stability candidate: `v0.41.0`\
> Product graph: five packages\
> Current maturity stage: alpha

## Current position

OpenElement is a Web Components-native, static-first application framework.
Alpha.14 is the current published and verified line. Alpha.15 is the active
adoption-qualification and interface-freeze rehearsal before a separate
decision about stable `0.41.0`.

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

## Alpha.15 active gates

| Condition                                        | State                  |
| ------------------------------------------------ | ---------------------- |
| Formal alpha.15 plan and current-truth baseline  | In progress            |
| GitHub Actions Node 24 runtime modernization     | Pending                |
| Cross-platform published consumers               | Pending                |
| External adopter pilot #390                      | Pending human evidence |
| Five-package interface freeze rehearsal          | Pending                |
| Stable-readiness dossier                         | Pending                |
| Alpha.15 npm, tag, prerelease and final evidence | Pending                |

## Current risks

1. External adoption remains the primary product risk.
2. Current-document version drift needs stronger mechanical rejection.
3. WC SSR compatibility still needs broader adopter evidence.
4. Request-time data, forms, sessions and cache are not stable interfaces.
5. UI remains optional until alpha.15 records its stable scope.

## Release direction

| Version           | Focus                                                                   |
| ----------------- | ----------------------------------------------------------------------- |
| `0.41.0-alpha.14` | Current verified published baseline                                     |
| `0.41.0-alpha.15` | CI modernization, adoption qualification and interface freeze rehearsal |
| `0.41.0`          | Separate stable decision after alpha.15 evidence                        |
| `0.42.0`          | WC Application Loop                                                     |
| `0.43.0`          | Universal WC SSR compatibility and diagnostics                          |
| `1.0.0`           | Stable five-package product                                             |

## Evidence and workflow

- Mandatory workflow: [`PROJECT_WORKFLOW.md`](../governance/PROJECT_WORKFLOW.md)
- Active version contract: [`VERSION_PLAN.md`](../current/VERSION_PLAN.md)
- Alpha.15 execution plan: [`v0.41.0-alpha.15-plan.md`](../release/v0.41.0-alpha.15-plan.md)
- Current package surface: [`PACKAGE_SURFACE.md`](../current/PACKAGE_SURFACE.md)
- Alpha.14 immutable release record: [`v0.41.0-alpha.14.md`](../release/v0.41.0-alpha.14.md)
- Complete forward roadmap: [`ROADMAP.md`](../roadmap/ROADMAP.md)
