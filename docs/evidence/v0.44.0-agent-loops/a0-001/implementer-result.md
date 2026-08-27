# Implementer result — a0-001 (#1160 TSX-to-Part Program vertical compiler spike)

STATUS: PASS

PACKET:
docs/evidence/v0.44.0-agent-loops/a0-001/dispatch.md (loopId a0-001, issue #1160,
candidate 0.44.0-alpha.0, acceptanceSlice one-component-vite-part-program-vertical-spike)

BASE_SHA:
e31ab34eb8cea52fe07d6d138d0b0cfbba9d0f17 (verified: `git rev-parse HEAD` matched before
editing; pre-existing dirty state was only orchestrator-owned
docs/current/v0.44.0-EXECUTION-STATE.json plus this untracked evidence directory)

CHANGED_FILES:

- packages/adapter-vite/src/internal/compiler/program.ts (new — spike Part Program types,
  self-contained mirror of the element-side copy; no cross-package import by design)
- packages/adapter-vite/src/internal/compiler/compile.ts (new — TSX-to-Part Program spike
  compiler on the TypeScript AST; fail-closed OEC9xx source-located diagnostics)
- packages/adapter-vite/src/internal/compiler/plugin.ts (new — open:compiled-element Vite
  plugin; activates only on .tsx files containing the `@element(` marker)
- packages/adapter-vite/src/plugin.ts (modified — additive opt-in `compiledSpike?: boolean`
  option on createOpenPlugin; default pipeline composition and plugin count unchanged)
- packages/adapter-vite/**tests**/compiled-element-spike.test.ts (new)
- packages/adapter-vite/**fixtures**/compiled-element-spike/counter.tsx (new fixture)
- packages/adapter-vite/**fixtures**/compiled-element-spike/unsupported-spread.tsx (new
  negative fixture)
- packages/adapter-vite/**fixtures**/compiled-element-spike/expected-program.json (new frozen
  program artifact consumed by BOTH package test suites — the single cross-package source
  of truth for "that same program")
- packages/element/src/internal/compiled/program.ts (new — spike program types +
  validateSpikeProgram)
- packages/element/src/internal/compiled/runtime.ts (new — serializeToHtml / createFreshDom
  / claimExistingDom, PartProgramClaimError)
- packages/element/**tests**/compiled-part-program-spike.test.ts (new)
- docs/evidence/v0.44.0-agent-loops/a0-001/implementer-result.md (this file)

TESTS_ADDED:

- packages/adapter-vite/**tests**/compiled-element-spike.test.ts — 4 tests / 12 steps:
  fixture loads; plugin absent by default and registered via the opt-in flag on
  createOpenPlugin; the counter.tsx fixture is transformed through the actual Vite
  `transform` hook; the emitted program deep-equals expected-program.json and carries
  exactly 5 typed Part/Region instructions (text, prop, event, when, each); generated code
  contains no VNode/BindingDescriptor/hydration-scope/fallback vocabulary and the emitted
  render() throws; re-running the transform is byte-identical; non-marker files pass
  through as null; spread attributes, unknown decorators and non-OpenElement bases fail at
  transform time with `file:line:character - error OEC9xx` diagnostics.
- packages/element/**tests**/compiled-part-program-spike.test.ts — 2 tests / 9 steps:
  SSR serialization emits the exact deterministic HTML; fresh DOM creation from the same
  program produces structurally identical observable output (toHtml equality with the SSR
  string); claim of parsed SSR DOM allocates zero nodes, preserves element/text node
  identity and a live user-typed input value, attaches the click listener and text-part
  subscription; a Signal write to `count` mutates only its text Part and conditional
  Region (unrelated `label` property sink records 0 writes) and vice versa; keyed list
  Region preserves li identity across reorder/update/insert/remove; claim mismatch throws
  PartProgramClaimError with the template path; dispose() detaches all subscriptions;
  measurements are asserted and logged.

RED_EVIDENCE:
Captured against the base tree before implementation existed (both exit code 1):

- `deno test -A packages/adapter-vite/__tests__/compiled-element-spike.test.ts` → exit=1.
  Harness step "fixtures load" and "default pipeline does not register the spike compiler"
  PASSED; the three behavior steps FAILED with `TypeError: Module not found
  ".../packages/adapter-vite/src/internal/compiler/plugin.ts"` — i.e. the vertical behavior
  is absent, not a syntax/dependency/harness failure (fixtures, plugin.ts and vite imports
  all resolved; the only unresolved specifier is the new compiler module).
- `deno test -A packages/element/__tests__/compiled-part-program-spike.test.ts` → exit=1.
  Harness-sanity test PASSED (fixture JSON loads, fake DOM parse/serialize round-trips);
  the behavior test FAILED with `TypeError: Module not found
  ".../packages/element/src/internal/compiled/program.ts"` — the runtime vertical is absent.
  (One harness-only import defect — WritableSignal imported from the wrong internal module —
  was fixed and the RED rerun reproduced the same module-not-found failure before any
  implementation existed.)

IMPLEMENTATION:

- Compiler (adapter-vite/src/internal/compiler): parses TSX with the existing `typescript`
  npm dependency; recognizes exactly the fixture grammar — one `@element('oe-spike-counter')`
  class extending OpenElement, `@property({ reflect: <boolean> })` fields with initializers,
  plain methods, and render() returning one JSX tree with static elements/attributes,
  `{this.field}` text parts, `value={this.field}` on `<input>` (prop part), `onX={this.method}`
  (event part), `{this.field > N ? a : b}` (conditional Region, static branches) and
  `{this.field.map((item) => <li key={item.id}>{item.text}</li>)}` (keyed list Region).
  Everything else fails closed with OEC9xx diagnostics carrying file/line/character.
  Emission is deterministic: one serializable `__partProgram` JSON literal (verified
  byte-identical across runs) plus the class with decorators stripped and render() replaced
  by a throwing stub — no runtime fallback is reachable. assertPathSafety fails closed when
  a path-addressed part would be preceded by a dynamic anchor sibling.
- Runtime (element/src/internal/compiled): one Part Program is the sole authority for all
  three modes. serializeToHtml renders static structure plus `<!--oe:pN-->` /
  `<!--oe:/pN-->` region anchors; createFreshDom builds the identical tree; claimExistingDom
  verifies exact structure (structured PartProgramClaimError with template path on drift),
  attaches events/subscriptions without recreating nodes, and suppresses only a synchronous
  subscription-time echo equal to the pre-subscription snapshot so live input values survive
  claim while lazy-delivery engines keep their first real write (repair-1, R1). Signal
  writes reach only the subscribed Part/Region; the keyed list Region reconciles by key with
  identity preserved. dispose() releases every subscription and listener.
- Wiring: createOpenPlugin gained an additive opt-in `compiledSpike?: boolean`; the default
  pipeline is unchanged (existing plugin.test.ts 43/43 pass, plugin count 9 preserved).

MEASUREMENTS (frozen alpha.0 fixture; evidence, not a performance GO claim):

- adapter-compiler: generatedBytes=3404 (repair-1 R2 added `__compiledProperties` metadata;
  previously 3189), programBytes=2541 (embedded literal; fixture file
  2542 with trailing newline), instructionCount=5.
- element-runtime compiled path: freshAllocations=19 (8 elements + 6 texts + 5 comments),
  claimAllocations=0, activationSubscriptions=4, activationListeners=1,
  countUpdateAllocations=2, countUpdateWalkVisits=0.
- frozen 0.43-equivalent proxy (full re-render + full-tree marker walk per update; includes
  its own host root, +1 vs compiled which mounts into the platform-provided root):
  buildAllocations=20, buildWalkVisits=20, updateAllocations=20, updateWalkVisits=20,
  updateListeners=1.

COMMANDS_AND_EXIT_CODES:

- `deno test -A packages/adapter-vite/__tests__/compiled-element-spike.test.ts` → exit=0
  (ok | 4 passed (12 steps) | 0 failed)
- `deno test -A packages/element/__tests__/compiled-part-program-spike.test.ts` → exit=0
  (ok | 2 passed (9 steps) | 0 failed)
- `deno task --cwd packages/adapter-vite typecheck` → exit=0
- `deno task --cwd packages/element typecheck` → exit=0
- `deno lint packages/adapter-vite/src/internal/compiler packages/adapter-vite/__tests__/compiled-element-spike.test.ts packages/element/src/internal/compiled packages/element/__tests__/compiled-part-program-spike.test.ts` → exit=0 (Checked 7 files)
- `deno fmt --check packages/adapter-vite/src/internal/compiler packages/adapter-vite/src/plugin.ts packages/adapter-vite/__tests__/compiled-element-spike.test.ts packages/adapter-vite/__fixtures__/compiled-element-spike packages/element/src/internal/compiled packages/element/__tests__/compiled-part-program-spike.test.ts` → exit=0 (Checked 11 files)
- `deno task arch:check` → exit=0 (Architecture contract check passed)
- `git diff --check` → exit=0
- Regression (not packet-required, run for safety): `deno test -A packages/adapter-vite/__tests__/plugin.test.ts` → exit=0 (43 passed, 0 failed)
- Regression: `deno test -A packages/adapter-vite/__tests__` (full adapter suite) → exit=0
  (638 passed (70 steps), 0 failed)
- Regression: `deno test --allow-read --allow-write --allow-env --allow-net --allow-run packages/element/__tests__` (full element suite) → exit=0 (294 passed (9 steps), 0 failed)

RESIDUAL_RISKS:

- Browser-only semantics (focus, selection, captured pre-upgrade events, closed-shadow DSD)
  are exercised against a minimal instrumented fake DOM in Deno, not real browsers;
  cross-browser qualification remains with #1168/#1169 and the alpha gate.
- Path-addressed parts (prop/event) use template child indices and fail closed
  (OEC9015) when a preceding sibling is dynamic; general dynamic addressing is #1161's
  frozen-grammar work.
- Claim mismatch produces the structured diagnostic only; bounded element-local recovery
  is intentionally absent (#1169).
- The spike program type is duplicated between packages by design (no private
  cross-package import allowed); expected-program.json is the shared artifact both test
  suites pin, and #1161 should replace the duplication with the frozen schema.
- Corrected in repair-1 (R1/R4): the original text here wrongly claimed a lazy-delivery
  Signal engine was harmless. It was not: the unconditional first-callback skip would have
  lost a conforming lazy engine's first real update. `subscribeWrites` now suppresses only a
  synchronous subscription-time echo whose value equals the snapshot read immediately before
  subscribing, and a protocol-only lazy-delivery Signal test proves the first write updates
  exactly its subscribed Part. Initial-echo semantics (immediate vs lazy delivery) should
  still be pinned in the #723 conformance suite.
- Generated code is validated structurally/by determinism but not executed by a bundler in
  this slice; end-to-end Vite build integration is #1163.

SCOPE_CONFIRMATION:
All edits are inside packet-owned paths. No forbidden path was touched (no deno.json, no
public index.ts, no internal/core, no docs/adr, docs/current, governance, roadmap, .agents,
.github). The pre-existing modification of docs/current/v0.44.0-EXECUTION-STATE.json is
orchestrator-owned and was left untouched. No commits, pushes, PR/issue updates, or other
agents were performed/invoked. No public export, package topology, version or consumer
configuration changed; the 0.43 renderer is unmodified.

NEXT_REQUIRED_ACTION:
Release verifier: independently re-run the eight requiredCommands at this worktree state,
verify RED/GREEN evidence and the scope claims, then feed the GO/NO-GO evidence (including
the residual risks above) back to the #1160 issue and the alpha.0 gate. Follow-up issues
#1161 (frozen Part Program v1 grammar) and #1163 (Vite build/HMR/source-map integration)
own the hardening this spike deliberately deferred.
