# openElement Status

> Updated: 2026-07-13\
> Published package line: `v0.41.0-alpha.8`\
> Product graph: five packages\
> First coherent beta candidate: `0.41.0-beta.4`

## Current position

OpenElement is a Web Components-native, static-first application framework.
Custom Elements are the application component contract; JSX and Basic Element
are authoring modes; Declarative Shadow DOM is the default server output;
interactive regions upgrade selectively. Vite and Nitro are the official build
and output path.

The published alpha.8 package line is the last alpha artifact. The beta.4
five-package convergence is complete in the repository. It is not a released
beta yet.

## Product surface

| Package                     | Status   | Supported role                                      |
| --------------------------- | -------- | --------------------------------------------------- |
| `@openelement/element`      | Current  | Custom Elements, JSX, DSD, hydration and signals    |
| `@openelement/app`          | Current  | Pages, routes, islands and request/render semantics |
| `@openelement/adapter-vite` | Current  | Vite, content, static builds and Nitro output       |
| `@openelement/create`       | Current  | Installed starter and consumer entrypoint           |
| `@openelement/ui`           | Optional | Proven general-purpose primitives                   |

The former `core`, `signal`, `router`, `protocol`, `content` and `ssg` packages
are not supported consumer imports. Historical references remain in their
original ADR, release and audit records.

## beta.4 release conditions

| Condition                                                          | State                                         |
| ------------------------------------------------------------------ | --------------------------------------------- |
| Five-package implementation and current docs                       | Complete                                      |
| Public starter lifecycle, packed consumer and third-party WC smoke | Complete locally                              |
| Node/Nitro output and artifact verification                        | Complete locally                              |
| Chromium candidate gate                                            | Complete locally                              |
| Firefox and WebKit candidate gates                                 | Required for release candidate                |
| npm/tag/GitHub Release/provenance/docs/evidence truth              | Required at publish time                      |
| External adopter pilot #390                                        | Open; cannot be substituted by internal tests |

## Current risks

1. **Adoption is the primary risk.** Internal evidence cannot prove that the
   small public interface is understandable to an outside maintainer.
2. **WC SSR compatibility needs broader evidence.** The framework has interop
   proof, but the future compatibility corpus and diagnostics are roadmap work.
3. **The current proven scope is static-first.** Request-time data, forms,
   sessions and cache are not yet stable framework interfaces.
4. **UI remains optional.** It must earn a v1 compatibility commitment through
   non-site consumers.

## Forward direction

| Version         | Focus                                                                        |
| --------------- | ---------------------------------------------------------------------------- |
| `0.41.0-beta.4` | External adoption and release closure                                        |
| `0.41.0`        | Freeze deep Element, App and Build interfaces                                |
| `0.42.0`        | WC Application Loop: load, render, progressive form, action and revalidation |
| `0.43.0`        | Universal WC SSR compatibility and diagnostics                               |
| `0.44.0`        | Portable production runtime                                                  |
| `0.45.0`        | WC ecosystem adoption                                                        |
| `0.46.0`        | v1 product freeze                                                            |
| `1.0.0`         | Stable five-package product                                                  |

The complete forward plan is in [`docs/roadmap/ROADMAP.md`](../roadmap/ROADMAP.md).

## Evidence and history

- Current package and release plan: [`docs/current/VERSION_PLAN.md`](../current/VERSION_PLAN.md)
- Five-package surface: [`docs/current/PACKAGE_SURFACE.md`](../current/PACKAGE_SURFACE.md)
- Beta boundary decision: [`ADR-0113`](../adr/ADR-0113-beta-four-product-boundary.md)
- Release records: [`docs/release/`](../release/)
- Architectural history: [`docs/adr/`](../adr/)
- Audit history: [`docs/audit/`](../audit/)
