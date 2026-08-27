# Implementer result — a0-001 repair-1 (engine-neutral subscription and decorator evidence)

STATUS: PASS

PACKET:
docs/evidence/v0.44.0-agent-loops/a0-001/repair-1.md (loopId a0-001-repair-1, parentLoop
a0-001, issue #1160, candidate 0.44.0-alpha.0). Sol review (decision NO-GO-REPAIR, findings
R1–R3) was read first: docs/evidence/v0.44.0-agent-loops/a0-001/review.md.

BASE_SHA:
e31ab34eb8cea52fe07d6d138d0b0cfbba9d0f17 (verified: `git rev-parse HEAD` matched; the only
pre-existing tracked modification remains the Sol-owned
docs/current/v0.44.0-EXECUTION-STATE.json)

CHANGED_FILES:

- packages/element/src/internal/compiled/runtime.ts (R1 — subscribeWrites is now
  engine-neutral: suppresses only a synchronous pre-return echo whose value Object.is-equals
  the snapshot read immediately before subscribing)
- packages/element/**tests**/compiled-part-program-spike.test.ts (R1 — protocol-only
  LazySignal class + makeLazyHost + new step 'lazy-delivery Signal: first write reaches only
  its subscribed Part'; all immediate-delivery Preact and live-input claim assertions kept)
- packages/adapter-vite/src/internal/compiler/compile.ts (R2 — deterministic
  `__compiledProperties` metadata emission preserving @property reflect decisions in source
  field order; `static __compiledProperties` on the generated class; no runtime reflection)
- packages/adapter-vite/**tests**/compiled-element-spike.test.ts (R2 — new step asserting
  the transform output represents count as { reflect: true } and label/items as
  { reflect: false }, and that no runtime reflection behavior is emitted; R3 — the opt-in
  pipeline assertion now runs BEFORE the dynamic import of the compiler module)
- docs/evidence/v0.44.0-agent-loops/a0-001/implementer-result.md (R4 — corrected the wrong
  "lazy engine is harmless" claim; updated generatedBytes measurement 3189 → 3404; runtime
  description updated to the engine-neutral wording)
- docs/evidence/v0.44.0-agent-loops/a0-001/repair-1-result.md (this file)

TESTS_ADDED:

- element spike test, new step: 'lazy-delivery Signal: first write reaches only its
  subscribed Part' — with a protocol-only lazy-delivery WritableSignal (subscribe() delivers
  nothing at subscription time), the FIRST write to `count` produces exactly one text-Part
  write with zero writes on the unrelated property sink and zero listener adds; a first
  write to `label` produces exactly one property write with zero text writes.
- adapter spike test, new step: 'emitted metadata preserves @property reflection decisions
  (R2)' — parses the `const __compiledProperties = {...}` literal out of the actual Vite
  transform output and deep-equals it against
  `{ count: { reflect: true }, label: { reflect: false }, items: { reflect: false } }`;
  also asserts `attributeChangedCallback` is absent (no runtime reflection).
  No existing assertion was weakened or removed.

RED_EVIDENCE:
Original a0-001 RED evidence is preserved verbatim in implementer-result.md (historical
record: both spike tests exit=1 on module-not-found for the absent vertical modules).
Supplemental behavior-first RED probe (repair-1, R3), run in an isolated immutable base-SHA
checkout:

- Setup: `git worktree add /tmp/a0-001-base-probe e31ab34eb8cea52fe07d6d138d0b0cfbba9d0f17`
  plus a node_modules symlink; probe file red-probe.test.ts written inside the temporary
  worktree only, containing the FINAL assertion logic of the reordered step (createOpenPlugin
  with `compiledSpike: true`, assert the pipeline contains `open:compiled-element`).
- Command: `cd /tmp/a0-001-base-probe && deno test -A red-probe.test.ts` → exit=1.
- Failure: `AssertionError: Values are not equal. [Diff] Actual / Expected - false + true`
  at red-probe.test.ts:16 — createOpenPlugin imported, executed and logged its workspace
  aliases (module resolution and pipeline construction both worked); the assertion failed
  because the opt-in pipeline has no `open:compiled-element` plugin. This is behavior-first
  RED, not a resolution failure.
- Cleanup: probe worktree removed (`git worktree remove --force`); no repo files touched.
  Post-repair GREEN of the same assertion logic: the reordered step passes in
  compiled-element-spike.test.ts (see commands below).

IMPLEMENTATION:

- R1: `subscribeWrites` reads `const snapshot = signal.value`, subscribes with a
  `subscribeReturned` flag, and suppresses a callback only while it arrives synchronously
  before `subscribe()` returns AND its value `Object.is`-equals the snapshot. Any callback
  after `subscribe()` returns is applied as a real update. This keeps the Preact
  immediate-echo suppression (live-input claim assertions still pass) while a conforming
  lazy-delivery engine's first write now reaches its Part (proved by the new LazySignal
  step).
- R2: the compiler emits `const __compiledProperties = { count: { reflect: true }, ... }`
  (JSON, 2-space, source field order) and `static __compiledProperties = __compiledProperties;`
  on the generated class. This is internal generated data only: no runtime reflection, no
  public export, no package config, no frozen schema commitment (#1161/#1162 own those).
- R3: the opt-in step now asserts the pipeline composition before dynamically importing
  `src/internal/compiler/plugin.ts`; the base-SHA probe above records the behavior-first RED.
- R4: implementer-result.md corrected; measurement updated (generatedBytes 3189 → 3404,
  programBytes 2541 and instructionCount 5 unchanged).

COMMANDS_AND_EXIT_CODES:
Parent dispatch commands:

- `deno test -A packages/adapter-vite/__tests__/compiled-element-spike.test.ts` → exit=0
  (ok | 4 passed (13 steps) | 0 failed)
- `deno test -A packages/element/__tests__/compiled-part-program-spike.test.ts` → exit=0
  (ok | 2 passed (10 steps) | 0 failed)
- `deno task --cwd packages/adapter-vite typecheck` → exit=0
- `deno task --cwd packages/element typecheck` → exit=0
- `deno lint packages/adapter-vite/src/internal/compiler packages/adapter-vite/__tests__/compiled-element-spike.test.ts packages/element/src/internal/compiled packages/element/__tests__/compiled-part-program-spike.test.ts` → exit=0 (Checked 7 files)
- `deno fmt --check packages/adapter-vite/src/internal/compiler packages/adapter-vite/src/plugin.ts packages/adapter-vite/__tests__/compiled-element-spike.test.ts packages/adapter-vite/__fixtures__/compiled-element-spike packages/element/src/internal/compiled packages/element/__tests__/compiled-part-program-spike.test.ts` → exit=0 (Checked 11 files)
- `deno task arch:check` → exit=0 (Architecture contract check passed)
- `git diff --check` → exit=0
  Repair-packet additional commands:
- `deno test -A packages/adapter-vite/__tests__/plugin.test.ts` → exit=0 (43 passed, 0 failed)
- `deno test -A packages/adapter-vite/__tests__` → exit=0 (638 passed (71 steps), 0 failed)
- `deno test --allow-read --allow-write --allow-env --allow-net --allow-run packages/element/__tests__` → exit=0 (294 passed (10 steps), 0 failed)
  R3 probe command:
- `cd /tmp/a0-001-base-probe && deno test -A red-probe.test.ts` → exit=1 (expected RED;
  AssertionError false !== true at red-probe.test.ts:16)

RESIDUAL_RISKS:

- Initial-echo suppression still assumes a synchronous subscription-time callback is an echo
  only when its value equals the pre-subscription snapshot; engines with asynchronous echo
  of an unchanged snapshot value would apply one redundant same-value write (observably
  idempotent for all spike part kinds). Protocol-level echo semantics belong in the #723
  conformance suite.
- `__compiledProperties` is emitted and asserted but has no consumer yet; #1162 owns the
  canonical decorator lowering and #1164 the kernel that would consume reflection metadata.
- All parent-slice residual risks not addressed by this repair remain as recorded in
  implementer-result.md (fake-DOM-only browser semantics, template-index path addressing,
  claim recovery deferred to #1169, bundler execution deferred to #1163).

SCOPE_CONFIRMATION:
All edits are inside repair-packet-owned paths (the two compiler/runtime trees, the two spike
test files, the fixture dir, and the two evidence files). No Sol-owned dispatch/review/
execution-state file was modified; the pre-existing EXECUTION-STATE.json modification is
Sol-owned and untouched. No public entry point, package config, version, workspace alias or
private cross-package import was added; no VNode/BindingDescriptor/hydration-walker/
compatibility-renderer/interpreter was introduced; no existing assertion was weakened or
removed. No commit, push or GitHub update was performed; the temporary probe worktree was
created outside the repo and removed.

NEXT_REQUIRED_ACTION:
Sol re-review of a0-001-repair-1 against findings R1–R3 (and the R4 record correction):
independently re-run the eleven commands above and the R3 base-SHA probe, then issue the
GO/NO-GO decision for #1160 alpha.0 evidence.
