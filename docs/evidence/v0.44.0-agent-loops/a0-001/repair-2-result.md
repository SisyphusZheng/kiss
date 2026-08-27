# Implementer result — a0-001 repair-2 (CI lint and architecture contract)

STATUS: PASS

PACKET:
docs/evidence/v0.44.0-agent-loops/a0-001/repair-2.md (loopId a0-001-repair-2, parentLoop
a0-001, issue #1160, failed run 33071761401). Plus a reviewer mid-flight correction: the
initially planned fail-closed non-input property-target restriction was unauthorized; that
test step was removed and the property sink remains generic for any Element.

BASE_SHA:
failedCandidateSha bcc99b25df5a2ded515995b8fb0e3470bf87258e; worktree HEAD at repair start:
4e1c322df76849846c8254946515e2575c758255 (mergedSha, clean except the reviewer-owned untracked
repair-2.md packet)

CHANGED_FILES:

- packages/adapter-vite/**fixtures**/compiled-element-spike/counter.tsx (fixture button
  gains explicit non-submitting `type='button'` — jsx-button-has-type)
- packages/adapter-vite/**fixtures**/compiled-element-spike/expected-program.json (required
  deterministic-evidence update per packet instruction 1: the button now carries
  `attrs: [["type","button"]]`; program bytes 2542 → 2626)
- packages/element/src/internal/compiled/program.ts (validateSpikeProgram returns a
  freshly constructed, honestly narrowed PartProgramSpike instead of
  `raw as unknown as PartProgramSpike`)
- packages/element/src/internal/compiled/runtime.ts (both prop-part `as unknown as
  Record<string, unknown>` escapes replaced by a small local typed helper `propertySink()`
  using a one-step structural assertion `el as SpikePropertySink`, where
  `interface SpikePropertySink extends Element { [property: string]: unknown }`; dynamic
  property assignment semantics retained for any Element — no input/allowlist restriction)
- packages/element/**tests**/compiled-part-program-spike.test.ts (pinned SSR string and
  0.43-equivalent proxy builder updated for `type="button"`; new step 'program validation
  still fails closed after the cast removal (repair-2)')
- docs/evidence/v0.44.0-agent-loops/a0-001/repair-2-result.md (this file)

TESTS_ADDED:

- element spike test, new step 'program validation still fails closed after the cast
  removal (repair-2)': validateSpikeProgram still rejects a part-index/position mismatch
  and a wrong version after the return-cast removal.
- The initially added step 'DOM property writes stay fail-closed for non-input targets'
  was REMOVED per reviewer correction (it imposed an unauthorized semantic restriction). The
  generic property-sink behavior is already pinned by the pre-existing steps: fresh
  property initialization (SSR/creation structural equality), claim live-value
  preservation with zero property writes, and subsequent signal writes in the granularity
  and lazy-delivery steps.

RED_EVIDENCE:

- `deno lint packages/adapter-vite/__fixtures__/compiled-element-spike/counter.tsx` →
  exit=1: `error[jsx-button-has-type]: button elements must have a type attribute` at
  counter.tsx:37 (matches CI run 33071761401 fact 1).
- `deno task arch:check` → exit=1: three `[type-escape] production as unknown as is not in
  the reviewed allowlist` hits at program.ts:258, runtime.ts:322, runtime.ts:327 (matches
  CI fact 2).
- Test-first intermediate RED: with the retargeted-property step present (later removed
  per reviewer correction), the element suite failed with `AssertionError: Expected function to
  throw` against the pre-repair runtime. The kept validation step passed pre- and
  post-repair; the production RED for this CI repair is the two gate failures above.

IMPLEMENTATION:

1. Fixture button now has `type='button'`; the frozen expected program and pinned SSR
   string were regenerated/updated for the added static attribute (the ONLY resulting
   evidence delta; generatedBytes 3404 → 3488, programBytes 2541 → 2625 embedded / 2626
   file, instructionCount unchanged at 5; runtime allocation/activation counts unchanged).
2. program.ts: `validateSpikeProgram` now returns
   `{ version: PART_PROGRAM_SPIKE_VERSION, tag: raw.tag, template: raw.template as
   SpikeTreeNode[], parts }` — `raw.tag` is narrowed by the never-returning `fail` guard,
   `template`/`parts` use the same single-step `as` the file already used internally (the
   arch gate flags only `as unknown as` double escapes). Validation behavior unchanged,
   proven by the new fail-closed step.
3. runtime.ts: `propertySink(el)` performs a one-step structural assertion to
   `SpikePropertySink` (Element plus a string index signature over `unknown`) and both the
   fresh-mode initial property write and the subscription write go through it. Semantics
   preserved: fresh property initialization still happens, claim still performs zero
   property writes (live value preserved), subsequent signal writes still land; the sink is
   generic for any Element per the reviewer correction.

COMMANDS_AND_EXIT_CODES:

- `deno test -A packages/adapter-vite/__tests__/compiled-element-spike.test.ts` → exit=0
  (ok | 4 passed (13 steps) | 0 failed)
- `deno test -A packages/element/__tests__/compiled-part-program-spike.test.ts` → exit=0
  (ok | 2 passed (11 steps) | 0 failed)
- `deno lint` → exit=0 (Checked 723 files)
- `deno task arch:check` → exit=0 (Architecture contract check passed, 1765 tracked files)
- `deno task typecheck` → exit=0
- `deno task fmt:check` → exit=0 (Checked 1321 files)
- `deno test -A packages/adapter-vite/__tests__` (full adapter suite) → exit=0
  (ok | 638 passed (71 steps) | 0 failed)
- `deno test --allow-read --allow-write --allow-env --allow-net --allow-run packages/element/__tests__` (full element suite) → exit=0 (ok | 294 passed (11 steps) | 0 failed)
- `deno task autoflow:ci` → first run exit=1 (FAIL fullstack:cloudflare-config-check:
  transient npm registry error `error reading a body from connection` downloading js-yaml
  during the wrangler dry-run; every other selected gate PASSed); retry → exit=0
  (48/48 selected gates PASS, 0 FAIL)

RESIDUAL_RISKS:

- The first autoflow:ci run's cloudflare-config-check failure was a network flake, not a
  product defect; the retry passed all 48 gates. If CI runners hit the same registry
  instability, the flake may recur independently of this repair.
- `SpikePropertySink`'s index signature is an honest structural view (a compiled property
  Part owns its named property by construction), but misspelled property names in future
  grammar extensions would still compile; the frozen grammar in #1161 should type the
  property-name union.
- No other residual risks introduced by this repair; prior-slice risks stand as recorded.

SCOPE_CONFIRMATION:
All edits are inside repair-2-owned paths; expected-program.json is the deterministic
expected-transform evidence whose update packet instruction 1 explicitly requires when
generated program bytes change. No public API/export/package configuration/version change;
no architecture allowlist entry, lint suppression, ignore directive, compatibility path,
workspace alias, private cross-package import, fallback renderer, or weakened assertion; no
production edits outside the two element compiled files; no dispatch/review/state/
governance/ADR/roadmap files touched. No commit, push, merge or GitHub update performed.

NEXT_REQUIRED_ACTION:
Release verifier re-review of a0-001-repair-2 against CI run 33071761401's two failed gates: re-run the
required commands above (or rely on a fresh CI run of the repaired branch), confirm both
gates now pass, and issue the GO/NO-GO decision for the #1160 alpha.0 evidence.
