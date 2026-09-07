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

Converge Element and Router, with UI as dogfood/reference, with Route Mode explicit records and
Framework Mode file-generated records sharing one routing core. Own URLPatternList
as a strategic asset; reuse existing Element/app/Vite implementation. Continuously
remove displaced semantic owners and operational machinery. Enter real application
work through an evidence-gated public `1.0.0-alpha.1`.

## Tasks and three-day execution target

Three working days from implementation start, not three elapsed days from this
planning PR. An elapsed deadline does not complete an issue or authorize release.

| Checkpoint       | Target                          | Work and evidence                                                                                                                                                |
| ---------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Beta.2.1 / Day 1 | Router/core + cleanup           | #1320: core products/records/Element delivery contract #1338, owned fork #1324, resolution #1325, release semantics #1323; early Cloudflare/Vite page/form spike |
| Beta.2.2 / Day 2 | Framework/Document + cleanup    | #1321: standalone Element + reference application flow #1339, resolved Document #1326, public metadata projections #1327                                         |
| Beta.2.3 / Day 3 | Remaining cleanup and admission | #1322: #1328-#1334, #1156, #1188/#1189 residual scope; Alpha admission #1340                                                                                     |

Every replacement removes its obsolete path and dependent wrappers/checkers/docs
with regression evidence. Day 3 does not postpone cleanup from earlier changes.
No package rename campaign, second matcher or broad compatibility scaffolding.
Examples remain frozen in this sprint; #1311 is carried to public Alpha.

## Non-goals

UI expansion or wholesale replacement, a complete design system, public compiler API,
mandatory two-package consolidation, full URLPattern reimplementation,
speculative matcher acceleration, native/WASM ports, complex incremental table
mutation, generic bundler/platform expansion, RPC/ORM/queue/cache frameworks,
comprehensive offline data handling, arbitrary directory/filename refactoring.

## Acceptance

- Element independently compiles/packs and runs in a plain HTML consumer without
  Router or private workspace imports. The private compiler is delivered through
  tooling; its versioned artifacts work with the admitted runtime. Browser JS and
  type graphs exclude compiler/Vite/Node-only dependencies.
- UI and the representative application provide dogfood/reference evidence, not a
  third product-release checklist. Existing UI remains usable; no forced replacement.
- Foreign CE host binding/upgrade behavior is tested; internal foreign SSR/hydration
  is supported only through an explicit integration, not inferred from DSD.
- Both route sources use one table; deterministic composition and conflict rules.
- URLPatternList agrees with the ordered reference oracle; safe conservative
  matching is allowed, silent false negatives are not.
- URL record precedes method dispatch; HEAD/404/405/Allow and query/capture
  boundaries are explicit.
- A real list/detail/form/validation/success/error flow works through direct access,
  refresh, navigation, cancellation, SSR/SSG and Element claim/update.
- A fresh packed consumer installs, develops, builds and runs without private
  imports or routine framework changes. Browser output excludes server modules.
- Removed responsibility/operational-surface diagnostics and justified survivors
  are recorded. Incomplete Beta-owned work remains open.

## Test matrix

Use targeted regression and differential tests while changing a responsibility;
run the existing required exact-candidate checks before release. Cloudflare first
for the vertical slice; Node and Deno retain full qualification of the agreed
contract. Bun/Nitro retain their documented smoke scope. Chromium, Firefox and
WebKit verify the required navigation/claim behavior and browser fallback policy.
UI focus/keyboard/reconnect behavior used by the application is covered. Missing
runtime/browser evidence is not success, and primary-platform success is not a
waiver for the supported matrix.

## Release evidence requirements

`beta.2.1 -> beta.2.2 -> beta.2.3 -> 1.0.0-alpha.1 -> Alpha iterations -> RC -> Stable`.
Beta checkpoints are engineering boundaries; any actual public checkpoint retains
standing exact-SHA, provenance, protected promotion and release GO requirements.
Development depends on accepted integration contracts, not mandatory intermediate
npm publication. #1323/#1334 must update release automation before it selects or
publishes the new train. No automatic Beta.2.4 or schedule waiver.

Public 1.0 Alpha uses npm `alpha`. Historic v0.44 alpha.0-alpha.10 were unpublished
workspace IDs and stay historical. `latest` remains stable until separately
admitted Stable publication. RC/Stable are unscheduled and evidence-gated.

If Day 3 admission is blocked, identify the failing gate and retain open work. A
clearly labeled preview may be used for real application development; it is not
false Beta closure. Broader benchmarks, prolonged application qualification and
performance improvements remain in the 1.0 Alpha milestone, preserving their issues.
