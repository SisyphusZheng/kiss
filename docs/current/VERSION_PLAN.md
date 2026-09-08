# Active version plan: Beta.2.x convergence to 1.0 Alpha

OpenElement = Web Components-native fullstack application framework.

Current source package line: `v0.44.0-beta.2`
Current npm registry line: `v0.44.0-beta.2` (prerelease, dist-tag `beta`; npm `latest` remains the stable 0.43 line)
Latest landed train: `v0.44.0-beta.2`
Active release target: `v0.44.0-beta.2.1`
Active internal target: none — internal Alpha checkpoints closed at Alpha.10 (verifier PASS, #1150); the active line is Beta.2.x convergence before public 1.0 Alpha (ADR-0152)
Next planned public train: `v0.44.0-beta.2.1`

The existing five-package distribution follows [PACKAGE_SURFACE.md](./PACKAGE_SURFACE.md)
and ADR-0114; the shipped `nitro-mount` integration remains until its replacement
is qualified. These are baseline facts, not restrictions on ADR-0152's target.
Browser qualification covers Chromium, Firefox and WebKit.

Authority: [ADR-0152](../adr/ADR-0152-product-router-and-alpha-convergence.md).
Live train: [#1155](https://github.com/open-element/openelement/issues/1155).
Execution: [Project 3](https://github.com/orgs/open-element/projects/3).
Version anchors above remain synchronized projections required by existing tooling;
#1334 owns their generated-state consolidation. Actual version/publication state is in [release-state.json](../release/release-state.json)
and immutable release records; this plan describes intended work, not release proof.

## Objective and scope

Maintainer-approved refinement, 2026-09-08: Element and Router remain the two core
products; UI is dogfood/reference. Router offers explicit Route Mode and file-based
Framework Mode. Native and Lit are first-class Framework Mode targets, qualified
through separate rendering integrations and one application protocol. This is a
plan, not a claim that Lit Framework Mode already ships.

OpenElement directly maintains a public fork of Justin's URLPatternList. Generic
fixes are contributed upstream without blocking OE delivery. Returning to the
upstream package is optional, not a required exit. Product count does not mandate
package count. Existing implementation is reused only where its ownership fits.

## Tasks and checkpoints

Checkpoints are acceptance boundaries, replacing the former three-working-day
schedule. No elapsed deadline completes work, and no automatic Beta.2.4 exists.

| Checkpoint      | Scope                                                                                                               | Owners                                |
| --------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| Beta.2 baseline | Preserve published evidence and identify inherited failures                                                         | #1155 / #1288                         |
| Beta.2.1        | Router correctness, independently maintained fork, SSG/navigation repair, standalone Element and prerelease tooling | #1320 / #1323 / #1324 / #1325 / #1338 |
| Beta.2.2        | Native/Lit application flow, minimal shared protocol, Document and public metadata                                  | #1321 / #1326 / #1327 / #1339         |
| Beta.2.3        | Dual-mode hardening, independent consumers, supported matrix, cleanup and Alpha admission                           | #1322 / #1328-#1334 / #1340           |

### Beta.2.1: routing and delivery foundation

- Fork `justinfagnani/url-pattern-list` into `open-element/url-pattern-list`, retaining
  history, MIT attribution and a compact divergence record. Verify the fork/package
  exists before claiming migration; package naming is an implementation decision.
- Independently test/build/release the fork; OE consumes an exact qualified package
  version with a lockfile. Delete the embedded production duplicate after migration.
- Preserve ordered first-match semantics. Explicit records keep registration order;
  file generation orders static, parameter and catch-all routes deterministically.
- Choose one URL record before method dispatch. Group methods on that record;
  unsupported methods return 405/Allow, HEAD fallback stays within the winner.
  Keep query/captures, base path, slash and full URL component policies explicit.
- SSG discovers eligible pages from canonical route metadata and renders through
  the real dispatcher, without recreating a Hono page matcher.
- Generic native navigation leaves POST forms to browser/server unless an explicit
  action protocol owns them. History/native fragment navigation and reload default
  to browser ownership; hash-router semantics remain distinct. Apply ownership
  checks before cancellation side effects. Each mount gets a fresh execution signal.
- Finish standalone Element tooling using the existing private compiler, packed
  plain-HTML consumers, source maps and separated browser/build/declaration graphs.
- Complete lossless multi-identifier prerelease comparison and release-tool consumers.
  Legacy oversized Number projection is P3 hardening, not a fabricated blocker.

### Beta.2.2: Native and Lit Framework Mode

Prove the same list/detail/form/validation/success/error application with Native and
Lit: file routes -> loader -> SSR -> client continuation -> navigation -> action ->
data refresh, including redirects, cancellation, back/forward and remount.

Extract shared protocol from both implementations rather than freezing a speculative
FrameworkAdapter API. Router owns route identity, data/action outcomes, errors,
redirects and cancellation; server Request context and browser context need not be
identical. Native owns compiled rendering/claim; Lit owns its SSR/hydration/update
integration. Neither integration introduces a second router or data scheduler.

Resolve Document metadata before serialization. Native reuses its existing serializer;
Lit uses its qualified rendering integration. Public sitemap/search consume eligible
route/catalog identity and metadata, never personalized request Documents. Remove
superseded post-build SEO mutation with equivalent metadata/output evidence (#1327).
Explicitly select the rendering integration; CEM classification is not automatic
SSR-provider detection. DSD alone is not hydration compatibility.

Use allowed fixtures or independent consumers; examples/** remains frozen (#1311).
Lit starts with an explicitly qualified reference server runtime; publish a truthful
runtime/feature matrix before first-class availability claims. Existing Native
runtime commitments are not silently reduced.

### Beta.2.3: product and release qualification

Qualify packed consumers for standalone Element, Router Route Mode without Element
runtime, Router Lit Framework Mode without Native compiler/runtime, and Native
Framework Mode. Split physical packages only if entry/graph boundaries require it.

Prove SSR/SSG, client continuation, JS-disabled pages/forms, HTTP semantics, resource
cleanup, navigation, fresh install, declarations, source maps and browser dependency
graphs. Measure build time, bundle size and matching memory/performance. Complete
support matrices, migration instructions and runnable documentation. No third
rendering framework is added in this checkpoint.

Cleanup accompanies every replacement; #1328-#1334, #1156, #1188/#1189 and #1192
retain their distinct obligations. Do not silently defer an existing acceptance
criterion or close an umbrella because one slice passed.

## Non-goals

A third Framework Mode, automatic framework detection/plugin marketplace, another
public compiler API, full URLPattern grammar/parser, native/WASM acceleration,
complex incremental route mutation, UI expansion/replacement, generic RPC/ORM/cache/
queue infrastructure, mandatory package renaming or universal runtime SSR promises.

## Acceptance

- One production route authority across explicit/file records, browser, HTTP and SSG.
- Fork differential tests agree with the same-constructor ordered linear oracle;
  unsafe pruning uses conservative candidates merged in original sequence.
- Construction/hit/miss/memory baselines cover actual route distributions and the old
  implementation, not only linear scans. Record regressions as well as improvements.
- POST fallback, fragment/reload policy, dispose/remount and stale-result adversarial
  tests pass alongside full website and packed-consumer output checks.
- Native and Lit prove the shared flow before first-class support is advertised.
- Standalone product claims match installed artifacts and transitive runtime/types.
- All applicable final-SHA CI, fresh verifier and standing release GO requirements pass.

## Test matrix

Use focused tests for changes; exact-candidate PR CI is the full-matrix authority.
Chromium, Firefox and WebKit cover navigation and each admitted rendering integration.
Native retains Cloudflare-first, agreed Node/Deno qualification and Bun/Nitro smoke
scope. Lit runtime support is earned separately; unsupported/unverified cells remain
explicit. Real website, public-route IA, static output, JS-disabled forms and packed
consumers supplement unit tests. Missing evidence is not success.

## Release evidence requirements

`beta.2.1 -> beta.2.2 -> beta.2.3 -> 1.0.0-alpha.1 -> Alpha iterations -> RC -> Stable`.
Development may consume accepted contracts before intermediate npm publication.
Publication retains exact-SHA, provenance, protected promotion and release GO gates.
No automatic Beta.2.4; a failed checkpoint remains open. Public 1.0 Alpha uses `alpha`;
historic v0.44 alpha.0-alpha.10 remain unpublished workspace history. `latest` stays
stable until separately admitted Stable publication; RC/Stable remain unscheduled.

The [PR #1343 review failure](https://github.com/open-element/openelement/pull/1343#issuecomment-5579272257)
reports `APIError: Insufficient Balance`. A successful wrapper job is not completed
review evidence. #1332 owns restoring effective review and fail-closed error reporting;
this must be resolved before merging #1343, not postponed until Beta.2.3. Do not
silently change model/provider or treat an unavailable review as GO. Final HEAD needs
actual review, full CI and fresh verifier evidence. Confirming #1342 ancestry does
not mean that baseline CI passed. Planning edits do not repair #1343's product defects.
