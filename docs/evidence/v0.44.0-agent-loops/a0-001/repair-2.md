# a0-001 repair 2 — CI lint and architecture contract

```yaml
loopId: a0-001-repair-2
parentLoop: a0-001
kind: repair
candidate: 0.44.0-alpha.0
issue: 1160
failedCandidateSha: bcc99b25df5a2ded515995b8fb0e3470bf87258e
mergedSha: 4e1c322df76849846c8254946515e2575c758255
failedRun: 33071761401
implementerSession: session_5998df53-7c93-43ef-a13c-424763ba16cd
risk: critical
ownedPaths:
  - packages/adapter-vite/__fixtures__/compiled-element-spike/counter.tsx
  - packages/adapter-vite/__tests__/compiled-element-spike.test.ts
  - packages/element/src/internal/compiled/program.ts
  - packages/element/src/internal/compiled/runtime.ts
  - packages/element/__tests__/compiled-part-program-spike.test.ts
  - docs/evidence/v0.44.0-agent-loops/a0-001/repair-2-result.md
```

## CI facts

GitHub Actions run `33071761401` completed with exit code 1. Every selected gate passed
except these two deterministic failures:

1. `deno lint` rejected the fixture button at `counter.tsx:37` because it has no explicit
   `type` attribute (`jsx-button-has-type`).
2. `deno task arch:check` rejected three production `as unknown as` escapes:
   `program.ts:258`, `runtime.ts:322`, and `runtime.ts:327`.

The full packed, browser, runtime, coverage, build, consumer, example, and negative matrix
otherwise passed in that same run. This repair must address only the two failed gates.

## Required repair

1. Add an explicit non-submitting type to the fixture button and update deterministic
   expected transform evidence/assertions only if the generated program bytes change.
2. Remove all three `as unknown as` production escapes using honest narrowing or a small,
   local typed helper. Preserve runtime semantics, especially fresh property initialization,
   claim preservation of live values, subsequent signal writes, and fail-closed program
   validation.
3. Add or strengthen focused tests if needed to prove the replacement casts do not weaken
   validation or DOM property writes. Do not add an architecture allowlist entry.
4. Record test-first RED/GREEN evidence and exact exit codes in `repair-2-result.md`.

## Forbidden changes

- No public API/export/package configuration/version changes.
- No architecture allowlist, lint suppression, ignore directive, hidden compatibility path,
  workspace alias, private cross-package import, fallback renderer, or weakened assertion.
- No production edits outside the two element compiled files.
- No edits to dispatch, prior results/reviews, execution state, governance, ADR, or roadmap.
- Do not commit, push, merge, close the issue, or claim alpha.0 closure.

## Required commands

- focused adapter and element compiled-spike tests
- `deno lint`
- `deno task arch:check`
- `deno task typecheck`
- `deno task fmt:check`
- full adapter test suite
- full element test suite
- `deno task autoflow:ci`

Return `PASS`, `FAIL`, or `BLOCKED` with exact commands and exit codes.
