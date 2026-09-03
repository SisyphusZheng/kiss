# Alpha.10 performance admission review (issue #1225)

This is the bounded structural-regression adjudication required by issue #1225
(B1.6, stage #1150, umbrella #1155, authority ADR-0151). It reviews the
Alpha.10 diagnostic benchmark baseline established by A10.11 / #1219 for
structural contradictions with the architecture only. It is an adjudication
record, not a ranking claim and not a performance SLO. Rank optimization and
performance tuning are explicit non-goals of #1225.

## Reviewed baseline

- JFB browser baseline: `benchmarks/jfb/evidence.json` (schemaVersion 1,
  recordedAt 2026-09-02T17:34:29Z)
- Kernel/Region/claim/compiler microbenchmarks:
  `benchmarks/v044/micro-evidence.json` (recordedAt 2026-09-02T17:31:52Z)
- alpha.7 qualification matrix: `benchmarks/v044/evidence.json`
- Narrative record: `docs/current/v0.44.0-PERFORMANCE.md`
- Harness self-review: `benchmarks/jfb/README.md`

Baseline provenance: OpenElement SHA
`493548a6b30b5f2912550c8dfaac70a8b9ef153f`; JFB commit
`21d7204da754846fe1402f4437b5b53066f3c34e` with per-file SHA-256-pinned stock
comparators (vanillajs, preact-signals, lit, solid, vue, svelte) built
unmodified; Chromium 147.0.7727.15 via Playwright 1.59.1; stock afterframe
timing and stock warmup counts; 10 CPU iterations per benchmark (stock 15,
recorded deviation); Apple M2, 8 cores, 16 GB, macOS arm64; Deno 2.9.0, Node
v24.18.0. Every number cited below was re-extracted from the committed
evidence JSONs during this review and matches the narrative record.

## Evidence-SHA gap re-confirmation (carried risk, re-confirmed not re-litigated)

The benchmark evidence SHA `493548a6` predates this review's base SHA
`17ec6a57`. Re-confirmed at `17ec6a57`:

- `git diff --stat 493548a6..17ec6a57 -- packages/element/src
  packages/adapter-vite/src packages/app/src packages/ui/src
  packages/create/src` → empty (zero product-source changes).
- The intervening commits (#1259 baseline itself, #1261 docs truth, #1262
  docs/examples/www vocabulary, #1263 closure evidence and verifier tests,
  #1264/#1265 governance docs, #1266 package-surface freeze gate and docs)
  touch documentation, governance, examples, gates and tests only.

The measured semantics at `493548a6` are therefore the semantics at
`17ec6a57`; the gap is docs/harness-only, as the Alpha.10 verifier already
verified.

## Reproducibility spot-check at the review SHA

- `deno test -A benchmarks/` at `17ec6a57` → exit 0, 12 passed, 0 failed.
  These are the deterministic harness self-checks (`benchmarks/jfb/harness.test.ts`,
  `benchmarks/v044/micro.test.ts`, `benchmarks/v044/performance.test.ts`) that
  assert exact DOM-op counts, evidence schema and the frozen alpha budgets —
  never timings. The harness is intact; no harness fix was needed.

A full JFB browser re-run was not repeated: it rebuilds pinned stock
comparators out-of-tree and would rewrite the committed evidence file, which
this packet does not own. The deterministic count assertions plus the
committed raw samples carry the reproducibility contract.

## Verdicts

Verdict scale per #1225: CLEAR (no structural regression, numbers cited) /
ACCEPTED TRADE-OFF (documented with evidence) / BLOCKER (structural
regression; stop and report).

### 1. Exact Part update catastrophically slower than comparable fine-grained systems — CLEAR

Browser (JFB `03_update10th`, partial update of every 10th row in 1k, median
ms): OE 15.55 vs vanillajs 19.35, lit 23.95, solid 18.35, svelte 24.95 —
OE is faster than four of six comparators including vanilla; preact-signals
10.5 and vue 11.6 are faster than OE. No catastrophic gap in either
direction.

Micro (fake DOM, exact op counts from `micro-evidence.json`):

- partial update of every 10th of 1k rows: exactly 100 text writes, 0
  allocations, 0 listener adds, 1.573 ms — one write per affected row, no
  more;
- signal → text part: 0.448 µs/op, exactly 2000/2000 text writes;
- signal → attr part: 0.265 µs/op, 2000/2000 attr writes;
- signal → prop part: 1.309 µs/op, 1999/2000 value writes (equality guard,
  explained);
- engine floor (signal write, no part): 0.096 µs/op.

Per-update Part overhead over the raw signal-write floor is 0.17–1.2 µs and
is fully explained by the op counts: the exact Part update path writes only
the affected Part. No structural regression.

### 2. Keyed Region pathological complexity — ACCEPTED TRADE-OFF

The one outlier in the baseline: keyed `swap1k` performs 997 node moves
(insertions) for a 2-row swap — the Region move is O(distance)
node-by-node. Browser median 19.85 ms vs solid 7.85, preact-signals 9.55,
vanillajs 12.8; but vue 19.7, lit 21.25 and svelte 22.7 are equal or worse.

Why this is a trade-off, not a blocker:

- The complexity is linear in move distance, not superlinear; there is no
  unbounded or quadratic path anywhere in the Region evidence.
- Every other keyed Region op is mid-pack or better (median ms): replace1k
  27.35 (lit 282.6), remove1k 11.15 (lit 21.95, svelte 22.5), clear1k 4.15
  (lit 330, preact-signals 12.5), append1k 41.95 (mid-pack), create10k
  253.45 (preact-signals 287.4, lit 268.15 slower). CPU geomean 22.728 sits
  in the same band as vue 22.484 and svelte 22.195.
- The finding was recorded in the baseline itself (#1219 closure comment,
  `v0.44.0-PERFORMANCE.md` diagnostic finding 1) as an algorithmic
  inefficiency, not a correctness break.

Disposition: the O(distance) move algorithm is accepted for Beta.1 admission
because it is correct, linear, bounded and within the mainstream-framework
band on its worst op. Move-algorithm optimization is a stated non-goal of
#1225 and remains deferred to the evidence-gated B3.4 performance work.

### 3. Memory/listener/subscription growth (leaks) — CLEAR

Retention evidence:

- Micro churn: 25 cycles × 200 rows → 0 retained subscriptions, 0 retained
  listeners (`micro-evidence.json` stability section).
- alpha.7 qualification: 100 churn cycles per scenario across all four
  scenarios → 0 retained subscriptions, 0 retained listeners
  (`benchmarks/v044/evidence.json`); the acceptance gate fails closed on any
  retention (`docs/current/v0.44.0-PERFORMANCE.md` acceptance contract).
- Browser heap after run1k + clear ×5 with forced GC: 1,400,756 bytes vs
  1,219,651 ready (+14.8%) — memory returns to near-ready after clear, so
  there is no cumulative growth. Vanillajs equivalent: 748,157 vs 682,353
  (+9.6%). No leak signal for either.

Footprint context (not a leak): OE heap per row is ~2.3–5x vanillajs at 1k
rows due to Region entry bookkeeping (baseline diagnostic finding 2). At the
10k-row extension probe OE uses 9,511,356 bytes — below solid 10,570,464,
svelte 11,603,029, vue 19,942,554 and preact-signals 38,801,488; above
vanillajs 1,887,031 and lit 7,171,542. The micro churn `heapGrowthBytes`
17,070,360 is a fake-DOM high-water reading without forced GC; the
forced-GC browser probes above are the retention evidence and show return to
baseline. The per-row footprint vs vanilla is carried as a documented
trade-off under the same B3.4 evidence gate as finding 2; the blocker class
as stated — growth/leaks — is CLEAR.

### 4. Claim providing no meaningful work reduction — ACCEPTED TRADE-OFF

Fake-DOM 1k-row table (`micro-evidence.json`): claim 10.387 ms vs fresh
4.565 ms → claim/fresh ratio 2.275. On raw fake-DOM CPU time, claim is
slower than bare fresh creation at this scale; that is documented in the
baseline (finding 3) and not re-litigated here.

The work-reduction evidence on the axes claim exists for:

- Allocations: claim performs 0 allocations vs 10,031 for fresh creation of
  the same 1k-row table; 0 insertions/removals vs 10,031 insertions; 0
  writes vs 8,034 attr writes. Node creation and GC pressure are eliminated,
  not reduced.
- Versus the 0.43.3 baseline architecture (`benchmarks/v044/evidence.json`):
  claim allocations drop from 10–40 to 0 per scenario and initial walk
  visits from 10–40 to 0; claim timing is at or below fresh in 3 of 4
  qualification scenarios (0.680/0.834, 0.243/0.287, 0.196/0.335 ms;
  nested-real-app 0.176 vs 0.147 ms).
- Contract capability: the alternative to claim is not bare fresh creation
  but teardown of the server-rendered DOM plus fresh creation plus GC of its
  allocations, with loss of DOM identity and live state. Browser evidence:
  claim identity preserved and live value preserved on chromium, firefox and
  webkit, 0 page errors. Claim is the only path that satisfies the hydration
  contract (`docs/current/HYDRATION_CONTRACT.md`: the compiled claim
  artifact takes over the existing DOM in place).

Disposition: claim delivers meaningful, measured work reduction on the
allocation, node-creation and tree-walk axes (to exactly zero) and provides
identity/state preservation that fresh creation cannot provide at any cost.
The 2.275x fake-DOM CPU ratio at 1k-row scale is accepted as a documented
trade-off; claim-path CPU optimization is deferred to the evidence-gated
B3.4 work. This is not "claim ≈ full rerender": rerender pays teardown +
fresh + GC and loses identity; claim pays none of those.

### 5. Static route unexpectedly carrying mandatory runtime JS — CLEAR

`benchmarks/v044/evidence.json` staticOutput: runtimeBytes 0, scriptTags 0,
transferredBytes 219. The alpha.7 acceptance gate fails closed unless static
runtime bytes stay at 0, and it passes at the review SHA. A static route
carries no mandatory runtime JavaScript.

## Overall admission verdict

No BLOCKER. The Alpha.10 diagnostic baseline shows no structural
contradiction with the architecture: the exact Part update path is
explained and competitive (CLEAR), there is no memory/listener/subscription
growth (CLEAR), static routes carry zero mandatory runtime JS (CLEAR), and
the two known inefficiencies — O(distance) keyed Region moves and the
fake-DOM claim/fresh CPU ratio at 1k-row scale, together with the per-row
heap footprint vs vanilla — are bounded, documented, non-catastrophic
ACCEPTED TRADE-OFFs deferred to the evidence-gated B3.4 performance work.

This record satisfies the #1225 requirement for an explicit
structural-regression verdict with evidence; per the issue's acceptance
text, the verdict is to be recorded in the Beta.1 closure report by the
owning role. This packet does not close #1225.

## Commands and exit codes (this review, at 17ec6a57)

- `git status` / `git log -1` → clean tree on `dev` at
  `17ec6a57610e9f4bdff090497ab34b973c884dfb` (exit 0)
- `gh issue view 1225` / `gh issue view 1219` / `gh issue view 1150` → exit 0
- `git diff --stat 493548a6..17ec6a57 -- packages/element/src
  packages/adapter-vite/src packages/app/src packages/ui/src
  packages/create/src` → empty output (exit 0)
- `deno test -A benchmarks/` → exit 0 (12 passed, 0 failed)
- `jq` re-extraction of all cited medians, memory probes and micro op counts
  from `benchmarks/jfb/evidence.json`, `benchmarks/v044/micro-evidence.json`
  and `benchmarks/v044/evidence.json` → all values match
  `docs/current/v0.44.0-PERFORMANCE.md` (exit 0)
