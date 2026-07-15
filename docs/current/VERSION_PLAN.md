# v0.41.0-alpha.14 Release Planning — current source truth

> Current package line: `v0.41.0-alpha.14`\
> Repository source baseline: `v0.41.0-alpha.10`\
> Registry baseline observed on 2026-07-14: `v0.41.0-alpha.6`\
> Current maturity stage: alpha

## Current release

`v0.41.0-alpha.14` (0.41.0-alpha.14) remains the current source and package line. Alpha.13 was
the prior recovery train; its blockers, acceptance criteria, and release evidence
are recorded in [`v0.41.0-alpha.13-plan.md`](../release/v0.41.0-alpha.13-plan.md).
Alpha.12 published five npm packages but did not close its release evidence:
the exact published starter failed to typecheck because the Element JSX runtime
subpath was not resolvable. The Alpha.11 material below is retained as the
historical remediation record for the prior release train.

## Product truth

```text
OpenElement = Web Components-native fullstack application framework
current proven scope = static-first applications with fullstack output paths
component contract = standard Custom Elements
authoring = JSX + Basic Element
rendering = DSD/shadow default + explicit light DOM
interactivity = selective element upgrade
official build path = Vite + Nitro
```

OpenElement has one product with two adoption depths: standalone elements and
complete applications. The current consumer graph contains `element`, `app`,
`adapter-vite`, `create` and optional `ui`. The alpha implementation packages
that supplied their internals have no current compatibility promise.
See [`PACKAGE_SURFACE.md`](./PACKAGE_SURFACE.md) for the supported package contract.

## Alpha.11 objective

Turn the 2026-07-14 deep audit into one executable release train. Alpha.11 must
restore reproducible installation and the Workers release proof, correct the two
confirmed application-runtime contracts, close the audited UI and packaging
defects, remove verified internal redundancy, and make source, documentation,
GitHub, npm, and post-publish evidence tell the same truth.

The audit source is [`REVIEW-REPORT.md`](../../REVIEW-REPORT.md). GitHub issues
#396 through #411 are the implementation records. An item is complete only when
its acceptance criteria and the evidence in this plan are satisfied.

## Scope

Alpha.11 includes:

- frozen-install and release-evidence reproducibility;
- Nitro Node and Workers deployment proof;
- router query and SPA page-data correctness;
- dialog and theme lifecycle correctness;
- one narrow protocol seam between Element and Adapter Vite;
- visual-smoke, package-content, version-truth, CI-observability, dead-code, and
  risk-weighted coverage cleanup.

## Non-goals

- No new public package, package-topology change, or compatibility shim.
- No new application feature, server/data/forms/session/cache primitive, or
  stable `0.41.0` declaration.
- No broad dependency-major upgrade unless it is required for a listed release
  proof and is isolated with migration evidence.
- No deletion of public APIs based only on repository-local zero usage.
- No rewriting of historical ADR, audit, or release evidence to look current.

## Alpha.10 baseline

The final breaking convergence is present in the repository source:

- the consumer graph has five packages;
- the generated starter exposes product interfaces and lifecycle tasks;
- packed consumer, Node/Nitro, third-party WC and artifact checks are present;
- current docs, examples and dogfood use product imports;
- legacy compatibility paths and shallow public surfaces were removed.

The historical completed implementation anchor remains `v0.41.0-alpha.7`;
alpha.8-alpha.10 are convergence and packaging evidence layered on that
implementation train. Alpha.11 is the active remediation train, not a rewrite
of the alpha.7 historical record. Alpha.11 is a historical remediation train,
not the current release plan.

npm beta.1 through beta.3 are immutable partial publishes. They are historical
withdrawn artifacts, not compatibility baselines. The planned beta name is
retired. The prior alpha.10 release record claims publication, while the
2026-07-14 registry query returned alpha.6 for all five packages; #396 owns the
authoritative reconciliation and alpha.11 must not inherit the unverified claim.

## Task train

| Slice  |                                                          Issue | Priority | Outcome                                                                 | Blocked by             |
| ------ | -------------------------------------------------------------: | -------: | ----------------------------------------------------------------------- | ---------------------- |
| A11.01 | [#396](https://github.com/open-element/openelement/issues/396) |       P1 | npm registry, docs, release, and post-publish evidence agree            | none                   |
| A11.02 | [#397](https://github.com/open-element/openelement/issues/397) |       P1 | a clean checkout installs with the frozen lock policy                   | none                   |
| A11.03 | [#398](https://github.com/open-element/openelement/issues/398) |       P1 | Nitro Workers passes in a clean release environment                     | none                   |
| A11.04 | [#399](https://github.com/open-element/openelement/issues/399) |       P1 | query keys and values decode exactly once without router crashes        | none                   |
| A11.05 | [#400](https://github.com/open-element/openelement/issues/400) |       P1 | SPA loader/action data uses the page-host contract                      | none                   |
| A11.06 | [#401](https://github.com/open-element/openelement/issues/401) |       P2 | removing an open dialog restores original inert state                   | none                   |
| A11.07 | [#402](https://github.com/open-element/openelement/issues/402) |       P2 | click and attribute theme changes share one propagation path            | none                   |
| A11.08 | [#403](https://github.com/open-element/openelement/issues/403) |       P2 | Element and Adapter Vite share one narrow type-only protocol seam       | none                   |
| A11.09 | [#404](https://github.com/open-element/openelement/issues/404) |       P2 | visual smoke checks stable brand semantics, not one implementation      | none                   |
| A11.10 | [#405](https://github.com/open-element/openelement/issues/405) |       P2 | published adapter artifacts exclude internal tests and fixtures         | none                   |
| A11.11 | [#406](https://github.com/open-element/openelement/issues/406) |       P2 | documentation gates derive versions from one project source             | none                   |
| A11.12 | [#407](https://github.com/open-element/openelement/issues/407) |       P3 | orphan DSD hydration helpers are deleted or connected and tested        | none                   |
| A11.13 | [#408](https://github.com/open-element/openelement/issues/408) |       P3 | unused CEM and route-scanner internals are removed after deletion proof | none                   |
| A11.14 | [#409](https://github.com/open-element/openelement/issues/409) |       P3 | write-only UI escape aliases are removed without behavior change        | none                   |
| A11.15 | [#410](https://github.com/open-element/openelement/issues/410) |       P3 | changed-path reporting is truthful in shallow and edge-case histories   | none                   |
| A11.16 | [#411](https://github.com/open-element/openelement/issues/411) |       P3 | audited runtime paths create meaningful coverage headroom               | #399, #400, #401, #402 |

Execution order:

```text
release truth #396 ───────────────┐
frozen install #397 ──────────────┼─> full release matrix -> alpha.11 publish evidence
Workers proof #398 ────────────────┘

query #399 ─┐
SPA #400 ───┼─> risk-weighted coverage #411
dialog #401 ┤
theme #402 ─┘

protocol #403, visual #404, package #405, version truth #406,
dead-code #407/#408/#409, and CI observability #410 can proceed in parallel.
```

## Acceptance

Implementation status on `dev` (2026-07-14): Batches 1-4 are merged and Batch
5 has reached the 69/81/72 coverage gate. The unchecked items below are release
facts and stay unchecked until the clean pre-release matrix, main CI, registry,
post-publish consumers, tag, and GitHub prerelease are verified.

- [ ] All A11.01-A11.16 issues are closed with code, test, docs, or deletion
      evidence matching their acceptance criteria.
- [ ] A clean archive installs with `--frozen` and leaves the worktree clean.
- [ ] Query decoding and SPA loader/action delivery have behavioral regression
      tests, not only type or source-shape assertions.
- [ ] Dialog removal and external theme changes pass DOM/browser lifecycle
      tests.
- [ ] The five-package graph remains acyclic and the public 39-subpath surface
      changes only through an explicit compatibility decision.
- [ ] Local, packaged, Node ESM, third-party WC, desktop, Nitro Node, and Nitro
      Workers consumers pass.
- [ ] Package artifacts contain no internal test/fixture source and retain
      valid licenses, exports, and consumer types.
- [ ] Chromium functional and visual checks pass; Firefox and WebKit functional
      checks pass before release.
- [ ] Registry versions and dist-tags, Git tag, GitHub release, current docs,
      website, and post-publish consumer evidence agree on alpha.11.

## Test matrix

| Layer        | Required evidence                                                                                                                          |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Static       | format, lint, full typecheck, package graph/surface, architecture, type-safety, Deno API, signal boundary, docs truth, config, action pins |
| Runtime      | full Deno tests plus targeted query, SPA data, dialog, theme, DSD, CEM, route-scanner, and AutoFlow regression tests                       |
| Coverage     | package line/branch/function gate with explicit non-trivial headroom from risk-weighted tests                                              |
| Build        | docs SSG build, artifact truth, visual smoke, generated starter                                                                            |
| Browser      | Chromium E2E and visual baselines; Firefox/WebKit functional matrix                                                                        |
| Consumers    | local, packaged, Deno/Node ESM, third-party WC, desktop reader/Mastodon                                                                    |
| Deployment   | Nitro Node and Cloudflare Module Workers proofs from a clean environment                                                                   |
| Distribution | five-package artifact checks, Deno/npm pack dry-runs, publint, type consumers, license/content inventory                                   |
| Release      | frozen clean checkout, AutoFlow release tier, registry/dist-tag verification, post-publish npm consumers                                   |

Current measured coverage for `packages/*/src`: lines 70.71%, branches 81.06%,
functions 74.74% (745 tests, 35 nested steps, zero failures). The coverage gate
is the full test execution in CI; AutoFlow no longer runs a redundant ordinary
full-test gate immediately before it.

## Release evidence requirements

Before version bump:

1. Close #397-#411 and record the exact local commands in their issues or PRs.
2. Run the complete static, test, coverage, build, browser, consumer, deployment,
   and distribution matrix from a clean checkout.
3. Confirm no gate updates a lock file or tracked generated evidence implicitly.

After version bump and publish:

1. Verify all five npm packages at exactly `0.41.0-alpha.11` and verify the
   `alpha` dist-tag for each package.
2. Run published-package Deno, Node ESM, packaged starter, Nitro Node, and Nitro
   Workers consumers.
3. Verify the Git tag, GitHub prerelease, source constants, package manifests,
   status, version plan, website, changelog, and release record agree.
4. Close #396 only after the evidence above is linked and no alpha.10 registry
   claim remains unqualified.

## Remaining stability conditions

1. Complete external adopter pilot #390. The report must cover install, author,
   build, deploy and maintainer intervention; internal smoke is not a proxy.
2. Keep the Chromium, Firefox and WebKit matrix green for every alpha release.
3. Publish every alpha as one coherent five-package graph under the `alpha`
   dist-tag.
4. Verify Git tag, npm versions and dist-tag, GitHub Release, docs and final
   release evidence agree.
5. Cut stable `0.41.0` only when alpha use requires no additional architecture,
   interface or adoption work.

## Supported authoring surface

Ordinary authors use the following deep modules:

```ts
import { defineElement } from '@openelement/element';
import { defineApp, definePage } from '@openelement/app';
import { buildApp } from '@openelement/adapter-vite';
```

`@openelement/ui` is optional. Renderer, signal, hydration, router, request
driver, content scan and build-phase details remain implementation knowledge.
The adapter root, `nitro-mount` and CLI build entry are the documented build
path; auxiliary adapter exports are not an ordinary authoring contract.

## Post-v0.41 direction

The stable release freezes the five-package graph and the Element, App and
Build interfaces. It does not claim general fullstack parity before request-time
data, forms, sessions and cache have production semantics.

The next roadmap work is driven by complete user loops:

- `0.42.0`: WC Application Loop.
- `0.43.0`: Universal WC SSR.
- `0.44.0`: Production Runtime.
- `0.45.0`: WC Ecosystem Platform.
- `0.46.0`: v1 Product Freeze.

See [`docs/roadmap/ROADMAP.md`](../roadmap/ROADMAP.md) for the exit evidence and
scope rules.

## Historical evidence

Alpha plans, release records, audits and ADRs preserve their original package
names and decisions. They are historical evidence rather than current consumer
documentation. The controlling maturity and naming decision is
[`ADR-0114`](../adr/ADR-0114-continue-alpha-after-five-package-convergence.md).
