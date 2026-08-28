# Implementer result: a0-002-repair-4

STATUS: PASS

PACKET:
`docs/evidence/v0.44.0-agent-loops/a0-002-repair-4/dispatch.md` — issue #1156,
sole blocking finding R11 from the repair-3 thinker review: the required PR
jobs (`autoflow-ci`, `node-serve-smoke`, `pr-full-ci-evidence`) tested
checkout's default synthetic merge ref while the evidence artifact attested
`github.event.pull_request.head.sha`, a false exact-SHA claim.

BASE_SHA:
`0f8d78991ab8d9840f3852fe1b9e7691f470f1ed`. `git rev-parse HEAD` still reports
this SHA after all work; nothing was committed, pushed, merged, tagged, or
published.

CHANGED_FILES:

- `.github/workflows/autoflow-ci.yml` — the R11 repair (three checkout `ref`
  values, the writer's `HEAD_SHA`, the artifact-name suffix; comments only,
  no job-set or gate-content changes).
- `tools/autoflow/__tests__/pr-ci-workflow.test.ts` — the required RED probe
  and one updated assertion.
- `docs/evidence/v0.44.0-agent-loops/a0-002-repair-4/implementer-result.md` —
  this file.
- Formatter whitespace-only normalization (mandated by the packet's own
  `fmt:check` / `autoflow:push` gates, which failed on arrival):
  `docs/evidence/v0.44.0-agent-loops/a0-002-repair-4/dispatch.md` and
  `docs/evidence/v0.44.0-agent-loops/a0-002-repair-3/review.md` each carried a
  trailing-whitespace-only final line; `deno fmt` removed exactly that
  whitespace. No wording, finding, or instruction in either thinker-authored
  file was altered.

No file under `packages/`, `examples/`, `www/`, or `e2e/` was touched
(`git status --short -- packages/ examples/ www/ e2e/` is empty).

TESTS_ADDED:

- New test
  `R11: every repository-dependent required job checks out and attests the same exact SHA`
  in `tools/autoflow/__tests__/pr-ci-workflow.test.ts`. It parses the PR
  workflow YAML and requires the checkout `ref` of `autoflow-ci`,
  `node-serve-smoke`, and `pr-full-ci-evidence` to equal one common trusted
  expression (`${{ github.event.pull_request.head.sha || github.sha }}`),
  requires `autoflow-ci` to keep `fetch-depth: 0`, requires the record
  `HEAD_SHA` and the artifact-name suffix to use the identical expression,
  and requires the `on:` triggers to still cover push, pull_request,
  workflow_call, and workflow_dispatch.
- The existing R7 probe-4 artifact-name assertion was updated to the same
  common expression (previously the pull-request-only expression).

RED_EVIDENCE:
Before any workflow edit, the extended test was run directly and unpiped:

```text
deno test --allow-read --allow-env tools/autoflow/__tests__/pr-ci-workflow.test.ts
```

Exit code: 1 (genuine RED, 2 failures):

- R7 probe 4 failed: the artifact-name assertion expected the common
  expression but the workflow still named the artifact with the
  pull-request-only expression.
- R11 failed: each repository-dependent required job's parsed checkout `ref`
  was `undefined`, not the trusted expression.

The RED state was observed first and only then was the workflow changed.

IMPLEMENTATION:
One trusted expression, `${{ github.event.pull_request.head.sha || github.sha }}`,
is now used consistently in `.github/workflows/autoflow-ci.yml`:

- explicit checkout `ref` for `autoflow-ci` (its pre-existing
  `fetch-depth: 0` preserved), for `node-serve-smoke` (single shared job
  definition covering both matrix legs; it never had `fetch-depth` and none
  was added), and for `pr-full-ci-evidence`;
- the evidence writer's `HEAD_SHA` env value;
- the artifact-name suffix
  (`name: pr-full-ci-evidence-${{ github.event.pull_request.head.sha || github.sha }}`).

Pull requests now check out and attest the exact PR head SHA; push,
workflow_call, and workflow_dispatch events fall back to `github.sha`, so
non-PR support is preserved. `dependency-review` was left untouched per the
packet (it is not a repository-checkout job). The required job set, gate
contents, release semantics, product code, public API, architecture, and
security boundary are unchanged.

COMMANDS_AND_EXIT_CODES:
All commands run directly, without pipes, from the repository root.

RED (before implementation):

1. `deno test --allow-read --allow-env tools/autoflow/__tests__/pr-ci-workflow.test.ts`
   → exit 1 (2 failures; see RED_EVIDENCE).

GREEN and packet gates (after implementation), in packet order:

1. `deno test --allow-read --allow-env tools/autoflow/__tests__/pr-ci-workflow.test.ts`
   → exit 0 (`ok | 3 passed | 0 failed`).
2. `deno test --allow-read --allow-write --allow-env --allow-net --allow-run tools/autoflow/__tests__/`
   → exit 0 (`ok | 129 passed | 0 failed`).
3. `deno task actions:check-pins` → exit 0 (`Action pin check passed.`).
4. `deno task workflow:check-slimming` → exit 0
   (`Workflow slimming check passed.`).
5. `deno task docs:check-role-neutral` → exit 0
   (`role-neutral documentation check passed (0 violations, zero exemptions).`).
6. `deno task fmt:check` → first run exit 1 (two thinker-authored evidence
   files carried a trailing-whitespace-only final line: this packet's
   `dispatch.md` and repair-3's `review.md`); after
   `deno fmt docs/evidence/v0.44.0-agent-loops/a0-002-repair-4/dispatch.md docs/evidence/v0.44.0-agent-loops/a0-002-repair-3/review.md`
   (exit 0, whitespace-only), rerun `deno task fmt:check` → exit 0
   (`Checked 1353 files`).
7. `deno task lint` → exit 0 (`Checked 737 files`).
8. `deno task typecheck` → exit 0 (all five packages plus `www` configs
   checked clean).
9. `deno task arch:check` → exit 0
   (`Architecture contract check passed (1770 tracked files, 71310036 bytes).`).
10. `deno task autoflow:push` → first run exit 1 (the same pre-existing
    `fmt:check` failure on the two thinker-authored files; every other
    selected gate already reported PASS); after the whitespace-only
    formatting above, rerun `deno task autoflow:push` → exit 0
    (PASS for every selected gate: fmt:check, lint, typecheck, graph:check,
    package-surface:check, export-files:check, generate:ui-tokens:check,
    workflow:check-slimming, docs:check-role-neutral).

Final state verification:

- `git rev-parse HEAD` → `0f8d78991ab8d9840f3852fe1b9e7691f470f1ed`
  (unchanged; no commit).
- `git status --short -- packages/ examples/ www/ e2e/` → empty.
- Focused test rerun after all formatting → exit 0 (3 passed).

RESIDUAL_RISKS:

- The new checkout `ref` expression has not yet been exercised by a live
  pull_request run; the first real PR after merge is the end-to-end proof
  that checkout, the recorded `HEAD_SHA`, and the artifact name all agree on
  the PR head SHA.
- On push, workflow_call, and workflow_dispatch events the expression
  resolves to `github.sha`; those lanes now attest the event SHA directly
  rather than the PR head, which is the intended semantics but is only
  covered here by the parsed-workflow test, not by a live non-PR run.
- Two thinker-authored evidence files needed formatter whitespace
  normalization for the mandated format gates; the change is whitespace-only
  and disclosed above, but the thinker should be aware its originals carried
  trailing whitespace.

SCOPE_CONFIRMATION:
Only the packet-owned workflow file, its parsed-workflow test, and this
result file were changed in substance; the two thinker evidence files
received whitespace-only formatter normalization required by the packet's own
gates. No product code, public API, architecture, security boundary, required
job set, gate content, or release semantics changed. No commit, push, merge,
tag, publication, issue edit, or other release action was performed. Dirty
control-plane and prior-packet files were preserved as found.

NEXT_REQUIRED_ACTION:
Thinker re-review of this repair against finding R11 and closure of the
a0-002 loop if accepted. Implementer verdict: GO.
