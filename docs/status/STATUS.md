# openElement Status

> Updated: 2026-07-14\
> Repository package line: `v0.41.0-alpha.12`\
> npm registry line observed 2026-07-14: `v0.41.0-alpha.6`\
> Active release target: `v0.41.0-alpha.11`\
> Product graph: five packages\
> Current maturity stage: alpha

## Current position

OpenElement is a Web Components-native, static-first application framework.
Custom Elements are the application component contract; JSX and Basic Element
are authoring modes; Declarative Shadow DOM is the default server output;
interactive regions upgrade selectively. Vite and Nitro are the official build
and output path.

The five-package convergence is present in the alpha.10 repository source. The
alpha.10 release record claims publication, but the 2026-07-14 authoritative
npm query returned alpha.6 for all five packages. Issue #396 owns that evidence
reconciliation; alpha.11 must publish one coherent graph before the claim is
closed. The project remains in alpha while external adoption and
application-level interfaces are still allowed to drive breaking changes. The
abandoned beta naming is retired.

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

## alpha.11 release state

| Condition                                                          | State                                      |
| ------------------------------------------------------------------ | ------------------------------------------ |
| Five-package implementation and current docs                       | Present in alpha.10 source                 |
| Public starter lifecycle, packed consumer and third-party WC smoke | Complete                                   |
| Node/Nitro output and artifact verification                        | Node and clean Workers proofs pass on dev  |
| Chromium, Firefox and WebKit gates                                 | Release matrix pending                     |
| npm/tag/GitHub Release/docs/evidence truth                         | Reconciliation tracked by #396             |
| External adopter pilot #390                                        | Open; required before stability commitment |

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

| Version           | Focus                                                                        |
| ----------------- | ---------------------------------------------------------------------------- |
| `0.41.0-alpha.10` | Five-package convergence plus npm runtime dependency repair                  |
| `0.41.0-alpha.11` | Audit remediation candidate; publish and post-publish proof pending          |
| `0.41.0-alpha.x`  | External adoption and interface maturation                                   |
| `0.41.0`          | Freeze deep Element, App and Build interfaces                                |
| `0.42.0`          | WC Application Loop: load, render, progressive form, action and revalidation |
| `0.43.0`          | Universal WC SSR compatibility and diagnostics                               |
| `0.44.0`          | Portable production runtime                                                  |
| `0.45.0`          | WC ecosystem adoption                                                        |
| `0.46.0`          | v1 product freeze                                                            |
| `1.0.0`           | Stable five-package product                                                  |

The complete forward plan is in [`docs/roadmap/ROADMAP.md`](../roadmap/ROADMAP.md).

## Evidence and history

- Current package and release plan: [`docs/current/VERSION_PLAN.md`](../current/VERSION_PLAN.md)
- Project workflow: [`docs/governance/PROJECT_WORKFLOW.md`](../governance/PROJECT_WORKFLOW.md)
- Five-package surface: [`docs/current/PACKAGE_SURFACE.md`](../current/PACKAGE_SURFACE.md)
- Alpha naming decision: [`ADR-0114`](../adr/ADR-0114-continue-alpha-after-five-package-convergence.md)
- Release records: [`docs/release/`](../release/)
- Architectural history: [`docs/adr/`](../adr/)
- Audit history: [`docs/audit/`](../audit/)
