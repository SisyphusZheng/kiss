# Infrastructure reduction: responsibility audit

Maintainer-approved contribution priority and migration plan, 2026-09-08. Inspected planning checkout `75a05c3c`; this is a
bounded source audit, not completed migration or a whole-repository deletion count.
The separate #1343 implementation branch must be rechecked before applying changes.
Tracking: #1156 (generic infrastructure), #1333 (test/consumer consolidation),
#1332 (CI), #1334 (release truth), #1327 (public metadata), #1324 (matching fork).

## Recommendation

Select Web Test Runner (WTR) for browser conformance, qualified first through a bounded
pilot. The primary selection criterion is sustained useful upstream contribution,
not least local glue or fastest local execution. Retain Playwright Test for full
application/navigation/SSR E2E and Deno tests for pure algorithms/runtime contracts.
Additional integration effort may be justified by portable upstream reproductions;
correctness and sustainable integration remain requirements. Do not introduce a
second OE compiler or permanent runner framework.

Lit upstream uses WTR with Playwright Chromium/Firefox/WebKit launchers and WTR SSR
integration middleware. Shared test style reduces the effort to send independent
browser regressions to Lit/Modern Web. It does not guarantee upstream acceptance.
Justin's URLPatternList uses Node's test runner; contributions there should use that
runner and a generic corpus, not require OE or WTR. Compiler contributions follow
Oxc's own harness. Choose the recipient's conventions for each contribution.

Prefer small reproductions, correct attribution and narrowly scoped fixes over PR
count. Neither upstream adoption nor response is a prerequisite for OE delivery.

## Source-backed deletion candidates

Line counts describe inspected source, not promised deletions. No test coverage is
to be removed merely to hit a count.

| Responsibility and source                                                             | Finding                                                                                        | Disposition and replacement                                                                                                              | Retained acceptance / owner                                                                                                 |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `packages/element/__tests__/compiled-runtime/facade-dom.ts` (618 lines)               | Simulates registry, upgrade, attributes, shadow roots, events and connection lifecycle         | First WTR migration target; delete simulated platform and callers only after browser coverage replaces them                              | Real custom-element upgrade, composed events, reconnect, node identity; #1333                                               |
| `packages/app/__tests__/dom-stubs.ts` (223 lines)                                     | Shared DOM implementation for Preact interop tests                                             | Move existing interop assertions to browser; remove stub if no unique consumers remain                                                   | Preserve currently promised interop, do not expand Preact product scope; #1333                                              |
| `packages/element/__tests__/compiled-runtime/test-dom.ts` (327 lines)                 | DOM substitute also counts elements/writes/removals                                            | Split responsibility: browser conformance in WTR; retain a minimal counting test double only for deterministic algorithm-cost assertions | Browser is platform authority; counting double is not DOM conformance; #1333                                                |
| `packages/adapter-vite/__fixtures__/ui-dogfood/`                                      | Full application shell for many component behaviors                                            | Move component focus/keyboard/ARIA/reconnect tests to package browser suites; remove redundant app shell only after coverage transfer    | Keep adapter SSR/no-JS/claim integration and packed UI tests; #1333                                                         |
| `tools/check-critical-path-tests.ts` (309 lines)                                      | Runs other suites and interprets infrastructure absence, output and exit state                 | Prefer direct runner/CI projects with selected suites; retire wrapper and matching tests once failure behavior is equivalent             | Missing browser, spawn error and failed test must fail required CI; #1332                                                   |
| `tools/check-package-artifacts.ts` (300 lines)                                        | Already invokes pinned publint and ATTW, also checks OE-specific output policy                 | Do not introduce duplicate tooling. Reduce overlapping generic scans/command wrappers around existing tools                              | Keep real tarball consumers and no compiler/host code in browser entries; #1156                                             |
| `tools/check-package-graph.ts` + `tools/lib/package-graph.ts` (640 lines)             | Generic traversal/cycle logic mixed with Deno workspace exports, versions and publish ordering | Evaluate dependency-cruiser for traversal/rules only; migrate callers before deleting graph helpers                                      | Prove import-map/generated-specifier resolution and retain publication/entry semantics; #1156/#1330                         |
| `tools/check-www-links.ts` + `tools/lib/www-links.ts` (298 lines)                     | Built link checks mixed with SEO and generated API-anchor assertions                           | Evaluate lychee for ordinary links/fragments; move metadata truth to #1327                                                               | Keep generated Pagefind/API anchors, locale/canonical and private-page exclusion checks until equivalent proof; #1156/#1327 |
| `tools/check-version-anchors.ts` (375 lines), `tools/check-docs-truth.ts` (949 lines) | Multiple current projections and prose checks; not all generic                                 | Remove duplicated writable facts first; derive projections and retire redundant regex checks                                             | Source/registry/in-flight release distinction, truthful planned/shipped docs and exact release evidence remain; #1334/#1188 |
| `tools/run-package-graph-task.ts` (112 lines)                                         | Small export-aware Deno typecheck runner, not a test framework                                 | Low-priority review with TS7/typecheck migration; retain until native commands preserve behavior                                         | Deno imports/types and public export coverage; #1331                                                                        |

The three DOM helpers total 1,168 lines. The nine inspected tools/helper files total
2,983 lines, including valuable OE-specific logic. Neither total is a deletion quota.
Dependencies, callers, platform requirements and generated artifacts must be checked
at implementation time; filenames alone do not establish redundancy.

## WTR pilot and exit contract

1. Compile the selected Native fixture with the existing official Element build path;
   WTR consumes generated ESM. Do not write another TSX transform or compiler API.
2. Migrate one facade lifecycle/attribute test and one composed-event/shadow test from
   the simulated DOM. Test node identity and observable behavior, not HTML alone.
3. Add an equivalent minimal Lit host/connection case using Lit's own build/runtime;
   this is interoperability evidence, not a claim of full Lit Framework Mode support.
4. Run Chromium, Firefox and WebKit using the WTR Playwright launcher. Verify failing
   assertions and missing browser/setup errors return nonzero in the required CI path.
5. Keep full-document DSD parsing/hydration, native POST, fragment/reload and history
   E2E in Playwright. Setting innerHTML or mounting a helper is not equivalent to
   browser parsing a server response.
6. Record setup/transform code, execution time, debugging/source-map quality, install
   requirements and transitive dependency delta. Include a clean packed consumer.
7. Prefer standard DOM setup and explicit OE lifecycle waits. Do not add Lit runtime
   to standalone Element merely for a fixture helper, or hide timing bugs with sleeps.
8. After parity, remove the migrated fake-platform code and redundant CI/task paths.
   Short migration coexistence has an explicit completion boundary; no permanent
   second browser-conformance runner or new runner abstraction.

WTR is the selected direction. Less Vite configuration alone does not justify switching
to Vitest. Reconsider only after documenting a concrete correctness, distribution or
sustainable-integration blocker and revising the plan; do not permanently adopt both.
No pilot was executed in this audit; runner installation and migration remain open.

## Contribution acceptance

For each migration identify the upstream recipient, source version, its native test
harness, portable reproducer, proposed generic patch and OE-only remainder. Useful
fixes should be prepared for upstream contribution; no invented bug, cosmetic PR quota
or merge-count target. A contribution-ready patch can be reviewed independently of OE.
If no upstream change is necessary, record local deletion/standard-tool adoption as
such. Upstream response or acceptance does not block OE's release.

WTR/Lit is the browser-test path; URLPatternList retains Node test conventions; Oxc
contributions use its own test suite; generic package/graph/link gaps go to the tool
that owns them. Version/metadata duplication may be entirely local cleanup. Do not
force every deletion to produce a public PR.

## Priorities

- Beta.2.1: keep #1343 correctness gates first; supplemental AI review is non-blocking. Inventory overlapping generic
  checks under #1156; do not make a compiler/test-stack rewrite a prerequisite for
  repairing SSG or native navigation.
- Beta.2.2: run the WTR pilot alongside Native/Lit integration; start moving proven
  component conformance away from simulated platform implementations.
- Beta.2.3: #1333 closes qualified test/fixture consolidation; #1332 removes obsolete
  execution wrappers; #1334/#1327 remove duplicated truth before deleting checks.
- Beta.2.2: #1156 scopes Oxc/TS7 feasibility (decorators, diagnostics, source maps,
  declarations and Deno resolution) without changing the production backend.
- Alpha: Oxc/TS7 backend migration follows its own correctness/diagnostics/artifact
  evidence. Do not couple all infrastructure changes into one mandatory mega-migration.

## Retain in OE

Part Program semantics/validation, compiler diagnostics, Router winner/method/action
policy, lifecycle cancellation and qualified Native/Lit integration are product work.
Tests of these remain OE-owned. Small test doubles, fixture data and direct command
invocations can be justified; a custom platform, generic parser, runner or workflow
framework needs stronger evidence. Exact-artifact and human-review requirements
survive removal of their obsolete implementations.

For each migration record: replaced responsibility, production/test/config deletions,
new dependencies/glue, retained OE invariants, failure-path evidence and remaining
callers. Use existing issues/PRs, not another permanent checker or evidence database.

## Primary sources

- [WTR capabilities](https://modern-web.dev/docs/test-runner/overview/)
- [WTR Playwright launcher](https://modern-web.dev/docs/test-runner/browser-launchers/playwright/)
- [Lit shared WTR configuration](https://github.com/lit/lit/blob/main/packages/tests/src/web-test-runner.config.ts)
- [Lit SSR WTR integration](https://github.com/lit/lit/blob/main/packages/labs/ssr/web-test-runner.config.js)
- [URLPatternList Node test command](https://github.com/justinfagnani/url-pattern-list/blob/main/package.json)
- [Vitest Browser alternative](https://vitest.dev/guide/browser/)
- [publint](https://publint.dev/docs/)
- [Are the Types Wrong](https://github.com/arethetypeswrong/arethetypeswrong.github.io)
- [dependency-cruiser](https://github.com/sverweij/dependency-cruiser)

## Executable preparation refinement (2026-09-09)

The [maturation execution map](./alpha-maturation.md) supersedes vague feasibility
wording: Beta.2.2 delivers a runnable Oxc comparison slice, TS7 CLI and declaration/
pack-resolution results, and real form/focus/lifecycle browser cases. It does not
switch the production compiler. WTR receives official compiled ESM; existing provenance
and standard source-map consumer tests are reused. Public Alpha actively pursues
Oxc/TS7 adoption, with real application upgrades from its baseline and explicit stops.

Audit CEM extraction separately from OE hydration/layer policy. Do not merely translate
a bespoke TypeScript metadata scanner into a bespoke Oxc scanner. Upstream CEM capability
must be demonstrated before local extraction is removed. Audit deno pack staging and
its generated-code strictness exceptions before claiming TS7 owns final declarations.

Already-native popover/dialog/anchors/@scope/adoptedStyleSheets are not new adoption
wins. Delete only demonstrated duplicate responsibilities; retain necessary SSR, focus,
security and product semantics. Portable upstream work may justify bounded extra glue;
raw deletion totals and upstream merge counts are not success conditions.
