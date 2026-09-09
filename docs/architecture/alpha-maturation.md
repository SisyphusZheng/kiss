# Beta preparation and public Alpha maturation

Maintainer-approved plan, 2026-09-09. This is an execution contract, not evidence
that WTR, Oxc, TS7 or a platform migration is installed or qualified. Source review
used planning checkout dcfa2ee and checked relevant Beta.2.1 paths at 95c30600.
Live status belongs to GitHub issues and [Project 3](https://github.com/orgs/open-element/projects/3).
Authority: [VERSION_PLAN](../current/VERSION_PLAN.md), [ADR-0152](../adr/ADR-0152-product-router-and-alpha-convergence.md).

## Product and priorities

OpenElement is a Web Platform-first framework combining compiled Web Components with
a shared Native/Lit routing and application protocol for real applications. Element
and Router are the two cores; UI is reference/dogfood. Public Alpha is independently
installable and upgradeable, with API changes driven by real use and migration guidance.

Prefer a credible sustained upstream contribution path over minimum local glue.
Bounded integration cost is acceptable; correctness, security, supported behavior,
attribution and maintainability are not negotiable. No invented defects, PR quota,
upstream-merge gate, automatic version count or promised final large rewrite.

## Execution and acceptance

| Stage        | Owner                         | Concrete work                                                                                                                    | Exit                                                                                                                           |
| ------------ | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Beta.2.1     | #1320/#1156                   | Keep fork/Router/SSG/navigation/standalone/version work; inventory adopted upstream, duplicate local code and necessary OE rules | Existing admission plus traceable inventory; no compiler rewrite gate                                                          |
| Beta.2.2     | #1333/#1339                   | WTR official compiled ESM; forms/focus/lifecycle and paired Native/Lit application contracts                                     | Three-browser results, meaningful negative tests and missing-browser failure behavior                                          |
| Beta.2.2     | #1156                         | Oxc comparison slice, TS7 CLI/type/declaration/pack experiment, CEM extraction evaluation                                        | Reproducible commands/versions/results and explicit proceed/block/defer decisions; experiment success is not alpha.1 admission |
| Beta.2.3     | #1322/#1330/#1331/#1332/#1333 | Remove qualified fake-platform, fixture, task and runner duplicates; verify independent consumers                                | Coverage preserved, failed execution remains failed, unresolved experiments handed off explicitly                              |
| Public Alpha | #1156/#1179/#1234/#1240       | Actively adopt Oxc/TS7 independently; use and upgrade a real application from the first baseline                                 | Exact-artifact qualification and migration guidance; adopted production owners replace old implementations                     |
| RC admission | #1243                         | Settle public contracts and adopted migration risks                                                                              | One production owner, complete affected evidence; deferred optional experiments do not automatically block RC                  |

Existing correctness/security failures retain existing severity and release gates.
The #1343 [insufficient-balance review comment](https://github.com/open-element/openelement/pull/1343#issuecomment-5579272257)
is retained as historical evidence. Supplemental AI review is non-blocking under the
2026-09-09 maintainer decision: provider errors must be visible and count as zero review
evidence. Wrapper SUCCESS is not completed review. Required CI, fresh verifier and
human review remain gates; no billing or provider/model change is implied.

## WTR and platform contracts

Use the official Element compile/build path, then let WTR consume emitted ESM.
Do not create a test-only TSX compiler, add Lit to standalone Element, or retain a
permanent second browser-conformance runner. Keep Playwright full-document E2E and
Deno pure/runtime tests. Retain only necessary counting doubles for algorithm costs.

First cases:

- Form input/button: required and disabled controls, reset/restore, submitter name/value,
  effective action/method/enctype/target, formnovalidate, nested ShadowRoot and no-JS
  fallback. Prove one action and correct validation ordering. Do not assume a FACE
  element is a native submit button accepted by requestSubmit(submitter).
- Dialog/dropdown: Escape/light dismiss, focus return across slots/shadow roots,
  nested overlays, repeated open/close and disconnect/reconnect cleanup.
- Native/Lit: equivalent list/detail/form/validation/success/error journeys, with
  integration-specific rendering/SSR/continuation and shared application outcomes.

Existing UI method tests import uncompiled sources and fake DOM; existing nested-form
E2E proves delivery, not every validation/submitter rule. Reuse useful tests and add
missing browser contracts before deleting mocks. Do not preserve incorrect behavior
merely because the old snapshot expects it.

## Oxc experiment and production boundary

Reuse existing intrinsic-provenance, fail-closed grammar, deterministic output and
standard source-map-consumer tests. Select a complete small component with properties,
computed dependencies, events, conditional regions and keyed each, plus adversarial
imports/shadowing/rejections and Unicode location cases.

Run identical source through TS and Oxc frontend paths into the existing PartProgram.
Keep the emitter/authoring contract stable for the first slice. Extract only needed
OE facts (bindings, component/property/template facts, expressions and spans); do not
clone a generic AST or publish a stable frontend API. ESTree-compatible syntax can
reduce vendor coupling, but does not replace OE semantic analysis or PartProgram.

Require equivalent accepted/rejected grammar, canonical provenance, OE diagnostic
codes/classes and stable Part identity. Canonical semantic program fields must agree;
source locations must follow an explicit coordinate contract. Test CRLF/BOM/non-BMP
characters, aliases/type-only/foreign same-name intrinsics, decorator order/private
fields/default side effects, computed restrictions and every part/region kind.
Parser messages may differ with documented equivalent location/category; normalization
must not hide an actual error. Same-toolchain builds are deterministic. JS/maps need
not be byte-identical after a justified printer change, but runtime behavior and
original-position mapping must match. Public declarations require independent consumer
proof. TS is a comparator, not an infallible oracle; minimize fuzz failures against OE rules.

Verify the chosen Node binding's traversal, comments/trivia, printing and location
facilities rather than inferring them from Rust crate features. Measure parse, analysis,
emit and total build costs including binding overhead, native installation/OS/CPU/Deno
requirements. No build-native dependency may leak into browser/edge runtime artifacts.
Temporary dual paths are qualification-only; successful production switch removes the
old frontend. Other old TS API consumers have a separate documented migration boundary.

## TS7, declarations and metadata

Inventory TS uses as syntax-only, TypeChecker, CLI typecheck, declaration generation
and pack/build integration. Qualify the CLI independently; do not depend on unpublished
native APIs. Existing docs/API snapshot tools need real type information, not Oxc
syntax guesses. Deno check remains a separate environment contract: installing TS7
does not replace Deno's checker or import-map resolution.

Test public exports, conditions, imports/aliases/extensions, project references,
decorators/TSX, diagnostics, declaration maps and clean/incremental behavior. Use exact
packed products in independent consumers. Current staging compiles OE sources before
deno pack and relaxes noImplicitAny/noImplicitOverride for generated code; inspect
final declaration quality and maps before claiming the authority moved. Do not remove
strict authored-source checks to make a migration pass.

Evaluate upstream CEM extraction for attributes/events/slots/CSS parts separately from
OE hydration/layer policy and compiler provenance. Demonstrate parity and supported
extension hooks first; retain thin OE policy rather than a second generic scanner.
Do not claim CEM automatically selects an SSR provider or validates hydration.

## Platform substitution inventory

Bind support to actual browser/runtime versions and behavior tests, not API existence.
The browser baseline document is an input to qualification, not fresh test evidence.

| Capability                                           | Initial disposition              | Necessary boundary                                                                                          |
| ---------------------------------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Global registry / scoped registries                  | baseline / watchlist             | Renderer/Element owns registration; preserve server evaluation/realm isolation; Router core has no registry |
| ElementInternals / CustomStateSet                    | baseline                         | Already used; audit redundant mirrors, preserve public/SSR state and form lifecycle                         |
| Popover/dialog/top layer                             | baseline                         | Already used; retain necessary focus/composite-widget semantics                                             |
| CSS anchors                                          | baseline after subfeature checks | Already used; test position-try/visibility and layout combinations before deleting JS                       |
| starting-style / discrete transitions                | progressive                      | Remove only visual bookkeeping; no-animation fallback preserves behavior                                    |
| @scope / adoptedStyleSheets                          | baseline                         | Already used; light DOM is not Shadow DOM, SSR/style ownership still exists                                 |
| Trusted Types                                        | qualify baseline sinks           | Hybrid with explicit application trust policy and OE sink admission; no identity default policy             |
| Sanitizer / setHTML                                  | watchlist pending full matrix    | Unsafe parsing is not sanitization; preserve SSR/DSD and security guarantees                                |
| View Transitions                                     | progressive                      | Optional rendering/application projection; animation failure does not invalidate committed navigation       |
| AbortSignal.any/timeout                              | baseline where runtime qualified | Replace pure relay helpers, not winner/commit/disposal semantics                                            |
| HTML form APIs                                       | baseline priority                | Native validation, successful controls/submitter and effective target attributes                            |
| Named/manual slots                                   | baseline, manual only on demand  | Ordinary slots need no new distribution framework                                                           |
| moveBefore/connectedMoveCallback                     | watchlist                        | Do not replace range/fragment reconciliation or require incomplete browser matrix                           |
| :has/container queries/content-visibility/highlights | candidate baseline where proven  | Only adopt against a real redundant JS owner and accessibility proof                                        |
| Scroll-driven animations                             | progressive                      | Preserve readable/static fallback; pointer physics/Canvas are not equivalent                                |

Scheduler/Speculation Rules and other unproven capabilities stay outside this fixed
round unless a specific need, support proof and scope decision is recorded. No universal
OEPlatformAdapter, capability registry or generic form/abort framework is introduced.

## Evidence, contributions and stops

Each replacement records before/after owner, source/callers/tests/tasks/docs removed,
retained contracts, new dependency/glue, support/fallback and consumer results. Keep
valid behavior tests. Track semantic owners and compatibility paths, not LOC quotas.
Measure fixed-consumer cold/warm build, parse/compile/typecheck, peak memory, JS sizes,
maps/diagnostics and meaningful listener/observer/mutation/lifecycle counts. Use the
actual supported Node/Deno/Bun/Cloudflare/Nitro contracts, not a needless full cross product.

Name recipient, pinned source, native harness, portable reproduction and patch boundary.
Use Oxc's harness for generic compiler defects, WTR/Lit conventions for relevant browser
integration, Node tests for URLPatternList; browser/spec defects need their appropriate
upstream reproduction. No defect means local cleanup can be sufficient. Maintain forks
with attribution/divergence records when necessary; upstream timing never blocks delivery.

Stop or defer if required diagnostics/maps/runtime/security regress, native support
requires large compatibility machinery, a generic wrapper duplicates its upstream,
or production needs indefinite dual frontends. Give each pilot an explicit budget and
adopt/defer/reject decision. Bounded extra glue may be justified by useful contribution,
but no technical novelty overrides correctness. Real product validation starts with
alpha.1 and requalifies every affected artifact round. No fixed alpha.2/alpha.3 sequence;
RC closes adopted changes and leaves new optional capabilities for later releases.

## Documentation and sitemap projection

The architecture index links this plan; VERSION_PLAN and the issue map own scope and
responsibility links. The bilingual /roadmap route presents planned product stages.
#1327 owns generated public docs/search/sitemap from eligible route metadata: do not
hand-edit generated sitemap/search data or expose internal planning files as public
routes accidentally. Update existing public roadmap copy without inventing new routes.
