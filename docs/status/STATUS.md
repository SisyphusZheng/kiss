# OpenElement Status

> Updated: 2026-07-16\
> Repository package line: `v0.41.0-alpha.14`\
> npm registry line: `v0.41.0-alpha.14`\
> Active release target: `v0.41.0-alpha.14` closure complete\
> Product graph: five packages\
> Current maturity stage: alpha

## Current position

OpenElement is a Web Components-native, static-first application framework.
Custom Elements are the application component contract; JSX and Basic Element
are authoring modes; Declarative Shadow DOM is the default server output;
interactive regions upgrade selectively. Vite and Nitro are the official build
and output path.

Alpha.14 is published and verified. All five npm packages and the `alpha`
dist-tag agree, the corrected exact-version starter typechecks from a clean
workspace, and the post-publish Deno, Node, Nitro, third-party Web Component and
CDN proofs passed.

## Product surface

| Package                     | Status   | Supported role                                      |
| --------------------------- | -------- | --------------------------------------------------- |
| `@openelement/element`      | Current  | Custom Elements, JSX, DSD, hydration and signals    |
| `@openelement/app`          | Current  | Pages, routes, islands and request/render semantics |
| `@openelement/adapter-vite` | Current  | Vite, content, static builds and Nitro output       |
| `@openelement/create`       | Current  | Installed starter and consumer entrypoint           |
| `@openelement/ui`           | Optional | Proven general-purpose primitives                   |

The former `core`, `signal`, `router`, `protocol`, `content` and `ssg` packages
are not supported consumer imports. Historical references remain only in their
original ADR, audit and failed-release records.

## Alpha.14 release state

| Condition                                             | State    |
| ----------------------------------------------------- | -------- |
| Five-package source and npm version alignment         | Complete |
| Exact-version published starter and JSX subpaths      | Complete |
| Chromium, Nitro Node/Workers and package artifacts    | Complete |
| Deno, Node ESM, third-party WC and jsDelivr consumers | Complete |
| Git tag, GitHub prerelease and completed evidence     | Complete |
| Alpha.13 audit tasks and L1-L43 debt ledger           | Complete |

## Current risks

1. External adoption remains the primary product risk.
2. WC SSR compatibility still needs a broader ecosystem corpus.
3. Request-time data, forms, sessions and cache are not stable interfaces.
4. UI remains optional until it earns a v1 compatibility commitment.

## Forward direction

| Version           | Focus                                                                        |
| ----------------- | ---------------------------------------------------------------------------- |
| `0.41.0-alpha.14` | Completed audit recovery and honest publication closure                      |
| `0.41.0-alpha.x`  | External adoption and interface maturation                                   |
| `0.41.0`          | Freeze deep Element, App and Build interfaces                                |
| `0.42.0`          | WC Application Loop: load, render, progressive form, action and revalidation |
| `0.43.0`          | Universal WC SSR compatibility and diagnostics                               |
| `1.0.0`           | Stable five-package product                                                  |

The complete forward plan is in [`docs/roadmap/ROADMAP.md`](../roadmap/ROADMAP.md).

## Evidence and history

- Current package and release plan: [`docs/current/VERSION_PLAN.md`](../current/VERSION_PLAN.md)
- Alpha.14 release plan: [`docs/release/v0.41.0-alpha.14-plan.md`](../release/v0.41.0-alpha.14-plan.md)
- Project workflow: [`docs/governance/PROJECT_WORKFLOW.md`](../governance/PROJECT_WORKFLOW.md)
- Five-package surface: [`docs/current/PACKAGE_SURFACE.md`](../current/PACKAGE_SURFACE.md)
- Release records: [`docs/release/`](../release/)
