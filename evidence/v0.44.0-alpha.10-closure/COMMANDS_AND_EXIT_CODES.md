# Alpha.10 closure verification — commands and exit codes

All commands at CANDIDATE_SHA 4c3fd116908e15ad478ad1f27b7559a4b5b37f1d (dev), macOS arm64, Deno 2.9.x.

## Baseline

- `git rev-parse HEAD` → 4c3fd116908e15ad478ad1f27b7559a4b5b37f1d ✓
- `git status --porcelain` → empty (exit 0)

## Full gates (closure commands)

- `deno task test` → exit 0 — 1707 passed (105 steps), 0 failed, 1 ignored + supabase example 150/150. Re-run after verifier test additions: 1720 passed, 0 failed, exit 0.
- `deno task fmt:check` → 0
- `deno task lint` → 0
- `deno task typecheck` → 0
- `deno task arch:check` → 0
- `deno task freeze:semantics:check` → 0
- `deno task package-surface:check` → 0
- `deno task interface:snapshot` → 0
- `deno task export-files:check` → 0
- `deno task docs:truth` → 0
- `deno task type-safety:check` → 0
- `deno task deno-api:check` → 0
- `deno task build` (www) → 0 (pagefind 150 pages, www artifact truth passed)
- `deno task test:e2e` (chromium) → exit 1 — 167 passed, 4 failed; the 4 failures are exactly the committed known risk (visual baseline local drift on architecture-islands-deep mobile, en/zh × dark/light; deterministic 19537 px diff, ratio 0.06, identical across retries). Same suite green in CI at candidate (run 33672987756).
- `deno task pack:dry-run` → 0 (5 tarballs @ 0.43.3)
- `deno task package-artifacts:check` → 0
- `deno task consumer:packaged` → 0 (packed starter typecheck + SSG build + import-map smoke)
- `deno test -A benchmarks/` → 0 (12 passed)

## Scoped criterion suites

- compiler-intrinsic-provenance.test.ts → 19/19
- compiler-intrinsic-provenance-alpha10-verifier.test.ts (NEW) → 5/5
- compiler-source-map-v3.test.ts → 9/9
- nested-region-part-paths + facade-activation → 18/18; compiled-claim/ dir → 25/25
- alpha10-verifier-region-tamper.test.ts (NEW) → 3/3
- qualify-v044-interop + compiled-runtime/context + signal-context → 17/17
- request-time-admission-parity + request-time-parity → 4/4 (32 steps), full permission set
- spa-projection-guard + entry-render-runtime-security → 9/9
- spa-projection-alpha10-verifier.test.ts (NEW) → 5/5 (both default and --unsafe-proto modes)
- gate-verdict.test.ts + consumer-smoke.test.ts → 18/18
- isr-removal.test.ts → 3/3
- `deno task fixture:request-time:build` → 0; grep matchRequestTimeRoute over dist/ → 0 hits

## Independent probes

- Independent source-map consumer (Mozilla source-map@0.7.6, /tmp/smcheck): 4/4 resolutions exact, incl. duplicate-line vector 30:39 vs 31:39 → exit 0
- `deno run -A tools/consumer-smoke.ts --version 0.44.99-alpha10-nonexistent` → exit 1 (FAIL: confirmed absence, registry 404) — fail-closed proven
- Desktop example `npm:vite build` (examples/deno-desktop-reader) → exit 1, OEC9008 on 3 routes — reproduces the documented pre-existing risk

## Clean-clone qualification (/tmp/alpha10-clone @ 4c3fd116, clean tree)

- fmt:check → 0, lint → 0, typecheck → 0
- Scoped tests (provenance, source-map, compiled-claim, facade-activation, spa-projection-guard, isr-removal) → 71/71, exit 0

## Meaningfulness (mutant) runs — all in /tmp copies, repo untouched

- provenance mutant (expect spelling-based admission) → 2 FAILED as expected (load-bearing)
- tamper mutant (tamper line removed, assertThrows kept) → 1 FAILED as expected (load-bearing)
- **proto** differential control under --unsafe-proto → naive loop re-prototypes host; guarded path does not (load-bearing)
