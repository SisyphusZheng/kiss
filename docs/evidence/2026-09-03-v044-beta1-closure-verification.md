# Beta.1 closure verification — fresh release verifier (stage #1150)

Independent closure verification of the v0.44 Beta.1 (Framework Qualification +
Governance Freeze) candidate by a fresh release-verifier session with no
implementer conversation history, per the constitution §5.1 release-verifier
role and the release contract §4.1 (fresh release verifier GO). Method per the
configured release-verifier profile under `.agents/`: re-derive every claim,
rerun every gate at the exact candidate SHA, fail closed.

- Candidate SHA: `dc3ee191df803a05d40389a558c2e6a19f50dd11` (branch `dev`).
  Verified with `git rev-parse HEAD` (exact match) and `git status --porcelain`
  (empty) before and after the battery.
- Environment: macOS arm64, Deno 2.9.0, Node v24.18.0.
- Scope: packets B1.1–B1.6 (issues #1222, #1223, #1224, #1188 Beta.1 slice,
  #1187 Beta.1 slice, #1225). This report is the verifier cell of the §4.1
  unanimous-GO requirement; it does not by itself close the stage.

STATUS: PASS

## CANDIDATE_SHA

`dc3ee191df803a05d40389a558c2e6a19f50dd11`

- `git rev-parse HEAD` → `dc3ee191df803a05d40389a558c2e6a19f50dd11` (exit 0)
- `git status --porcelain` → empty before the battery and empty after it
  (exit 0); the battery leaves the tree clean.

## ARTIFACT_FINGERPRINTS

Dry-run packs built from the candidate tree by `deno task pack:dry-run`
(exit 0), SHA-256:

| Tarball                                                     | SHA-256                                                            |
| ----------------------------------------------------------- | ------------------------------------------------------------------ |
| `packages/adapter-vite/openelement-adapter-vite-0.43.3.tgz` | `8ba8a427299cdfac679338c81c5e386a3b4d343312e45b0604e6540d6cb5cb1f` |
| `packages/app/openelement-app-0.43.3.tgz`                   | `88431fa73036b368720c17d610d99da7eabf7c7a0e424cdc92c72e34b240c148` |
| `packages/create/openelement-create-0.43.3.tgz`             | `9dc5ddba65ae04c88b3e8742febe5a6e55b51a23b136f3cab962e093764bf658` |
| `packages/element/openelement-element-0.43.3.tgz`           | `0e9cd0e2af3961a85c9fad35931dcf83b406a3690e57bc4420346641c48ce45e` |
| `packages/ui/openelement-ui-0.43.3.tgz`                     | `8fc5c36731e016e6baef6bac52b11827fdc61e9c464eeac1f65efb6fc00e3119` |

These are the qualified-artifact fingerprints for this candidate. Per §2.2 the
published bytes must be byte-identical to bytes packed from this same SHA; any
repack at publication time must reproduce these hashes or publication is
invalid.

## CRITERION_TEST_MATRIX

| Battery cell                         | Evidence                                                                                                                                                                                                                                                            | Verdict |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| 1. Full test suite                   | `deno task test` at candidate → exit 0 (main suite green; Supabase starter 150 passed, 0 failed)                                                                                                                                                                    | PASS    |
| 2a. Hostile compiler suites          | adversarial/convergence/compiled-element corpus → 18 passed (29 steps), 0 failed, exit 0                                                                                                                                                                            | PASS    |
| 2b. Compiler boundary + provenance   | fail-closed matrix, module analysis, semantic-core boundary, intrinsic provenance → 44 passed, exit 0                                                                                                                                                               | PASS    |
| 2c. Source-map v3 consumer           | `compiler-source-map-v3.test.ts` → 9 passed, exit 0                                                                                                                                                                                                                 | PASS    |
| 2d. SSR/fresh/claim parity           | compiled-claim + compiled-runtime + SSG/request-time admission parity → 98 passed (9 steps), exit 0; `request-time-parity.test.ts` (dev Hono vs build Nitro) → 1 passed (23 steps), exit 0                                                                          | PASS    |
| 2e. Context interop                  | `signal-context.test.ts` (real @lit/context provider) → 6 passed, exit 0                                                                                                                                                                                            | PASS    |
| 2f. Route parity                     | route-manifest, static-paths, route-scanner-enhance/mdx, entry-descriptor → 60 passed, exit 0                                                                                                                                                                       | PASS    |
| 2g. Security projection              | `entry-render-runtime-security.test.ts` → 4 passed, exit 0                                                                                                                                                                                                          | PASS    |
| 2h. Remediation parity corpora       | renderer-scope-parity (#1271), compiled-escape-parity byte corpus (#1272), page-route-tag-resolution (#1276) → 16 passed, exit 0                                                                                                                                    | PASS    |
| 3. Gate-of-gates                     | `fmt:check`, `lint`, `docs:truth`, `docs:check-public`, `docs:check-strategy`, `docs:check-current`, `docs:check-claims`, `text-integrity:check`, `package-surface:check`, `interface:snapshot`, `freeze:semantics:check`, `graph:check`, `arch:check` → all exit 0 | PASS    |
| 4. Clean-clone + packed consumer     | `pack:dry-run` → exit 0 (5 tarballs @ 0.43.3); `package-artifacts:check` → exit 0 (5 packages); `consumer:packaged` → exit 0 (packed starter typecheck + SSG build + import-map smoke)                                                                              | PASS    |
| 5. #1276 regression gate             | `deno task fullstack:workspace-qualification` at candidate → exit 0 (starter request-time routes serve; 10001-row dataset, two-page cursor fetch, 1 JWT handoff)                                                                                                    | PASS    |
| 6. Browser matrix                    | CI at candidate (below)                                                                                                                                                                                                                                             | PASS    |
| 7. Benchmark SHA-gap re-confirmation | see below                                                                                                                                                                                                                                                           | PASS    |

## CI evidence at the candidate SHA (authoritative matrix, contract §2.1)

- AutoFlow CI run `33718081067` at `dc3ee191…`: conclusion `success`
  (`gh run view 33718081067`, exit 0). Job legs: `autoflow-ci` success,
  `dist/server Node smoke (Node 24)` success, `dist/server Node smoke
  (Node 20)` success, `workspace-qualification` success (the required job
  added by #1277). The AutoFlow gate step reports 49 `PASS` gate lines and
  zero `FAIL`/`BLOCKED` lines, including the browser legs: `test:e2e`
  (Chromium full), `test:e2e:firefox-smoke` PASS, `test:e2e:webkit-smoke`
  PASS, `fixture:request-time:gate` (request-time fixture on all three
  engines) PASS, and `test:coverage:check` PASS.
- CodeQL run `33718080819` at `dc3ee191…`: conclusion `success`.
- Browser matrix therefore rests on CI evidence per the packet; local browser
  rerun not required.

## Battery 7: benchmark evidence SHA-gap proof at the candidate

The B1.6 admission record's benchmark baseline sits at `493548a6`. At the
candidate:

```sh
git diff --stat 493548a6..dc3ee191 -- packages/element/src packages/adapter-vite/src \
  packages/app/src packages/ui/src packages/create/src
```

→ exactly 11 files, 85 insertions, 32 deletions, all belonging to the two
parity-proven remediations and nothing else (exit 0):

- #1274 (merge `18778c95`): `element/src/internal/compiled/escape-text.ts`
  (new shared owner), `runtime.ts`, `server/index.ts` — the F3 escape-text
  convergence. Parity proof: the byte-level corpus in
  `compiled-escape-parity.test.ts`, rerun green at the candidate (cell 2h).
- #1277 (merge `dc3ee191`): `adapter-vite/src/internal/ssg/entry-*.ts`,
  `route-scanner.ts` — the route-tag binding repair. Parity proof:
  `page-route-tag-resolution.test.ts` plus the entry-descriptor tag-binding
  tests, rerun green at the candidate (cells 2f/2h), and the
  `workspace-qualification` gate green both locally (cell 5) and in CI.

No other `packages/*/src` change exists between the benchmark SHA and the
candidate, so the measured semantics at `493548a6` remain the semantics at
`dc3ee191` except for the two parity-proven remediations. Harness integrity at
the candidate: `deno test -A benchmarks/` → exit 0, 12 passed, 0 failed.

## TESTS_OR_FIXTURES_ADDED

None. This verification added no tests, fixtures or snapshots; it reran the
committed suites at the exact candidate SHA. The only repository write is this
report.

## MEANINGFULNESS_EVIDENCE

- The hostile/adversarial corpora are fail-closed by construction (OEC9xxx
  diagnostic matrices, boundary probes) and rerun green; the B1.1 audit's own
  negative probes (deliberate boundary-separator drift fails the
  renderer-scope corpus; #1271) document that these suites can fail.
- The #1276 regression gate is proven meaningful by the B1.3 record: the same
  command exited 1 at `18778c95` (request-time 500s on `/workspace-records`,
  `/magic-link`, `/reset-password`) and exits 0 at the candidate — the gate
  distinguishes the broken from the repaired binding.
- No assertion was weakened; all exit codes are recorded verbatim.

## COMMANDS_AND_EXIT_CODES

All at `dc3ee191df803a05d40389a558c2e6a19f50dd11`, macOS arm64, Deno 2.9.0.
Scoped test commands used
`deno test --allow-read --allow-write --allow-env --allow-net --allow-run --allow-ffi --allow-sys <paths>`
(the full task permission set; the B1.1 audit showed the reduced set breaks
rolldown native binding loads, not the code).

| Command                                                                                                      | Exit                                           |
| ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| `git rev-parse HEAD` / `git status --porcelain`                                                              | 0 / empty                                      |
| `gh run view 33718081067` (AutoFlow CI) / `gh run view 33718080819` (CodeQL)                                 | 0, conclusion success / 0, conclusion success  |
| `deno task test` (full)                                                                                      | 0                                              |
| hostile compiler corpus (adversarial, when/void convergence, compiled-element-v1)                            | 0 — 18 passed (29 steps)                       |
| compiler boundary corpus (fail-closed matrix, module-analysis, semantic-core-boundary, intrinsic-provenance) | 0 — 44 passed                                  |
| `compiler-source-map-v3.test.ts`                                                                             | 0 — 9 passed                                   |
| compiled-claim + compiled-runtime + ssg/request-time admission parity                                        | 0 — 98 passed (9 steps)                        |
| `request-time-parity.test.ts`                                                                                | 0 — 1 passed (23 steps)                        |
| `signal-context.test.ts`                                                                                     | 0 — 6 passed                                   |
| route parity corpus (route-manifest, static-paths, route-scanner-*, entry-descriptor)                        | 0 — 60 passed                                  |
| `entry-render-runtime-security.test.ts`                                                                      | 0 — 4 passed                                   |
| remediation parity corpora (renderer-scope, escape byte corpus, page-route-tag-resolution)                   | 0 — 16 passed                                  |
| `deno task fmt:check` / `lint` / `docs:truth`                                                                | 0 / 0 / 0                                      |
| `deno task docs:check-public` / `docs:check-strategy` / `docs:check-current` / `docs:check-claims`           | 0 / 0 / 0 / 0                                  |
| `deno task text-integrity:check` / `package-surface:check` / `interface:snapshot`                            | 0 / 0 / 0                                      |
| `deno task freeze:semantics:check` / `graph:check` / `arch:check`                                            | 0 / 0 / 0                                      |
| `deno task pack:dry-run`                                                                                     | 0 — 5 tarballs @ 0.43.3                        |
| `deno task package-artifacts:check`                                                                          | 0 — 5 packages                                 |
| `deno task consumer:packaged`                                                                                | 0                                              |
| `deno task fullstack:workspace-qualification`                                                                | 0                                              |
| `deno test -A benchmarks/`                                                                                   | 0 — 12 passed                                  |
| `git diff --stat 493548a6..dc3ee191 -- packages/*/src`                                                       | 0 — only #1274 + #1277 files                   |
| `git log --name-only dd475619..dc3ee191 -- <ADR-0122 frozen paths>`                                          | 0 — only `dc3ee191` touched `entry-codegen.ts` |

## FAILURES

None.

## Known exceptions validated (not relitigated)

- Desktop examples OEC9008 on full vite build — recorded by B1.3 at the base
  SHA, deferred to B2.5/B3.8, never consumer evidence. Consistent; not rerun.
- Local-only visual-baseline drift on architecture-islands-deep mobile — the
  B1.3 record documents 4 local failures; the candidate CI Chromium leg
  (`test:e2e`) is PASS, so CI is authoritative and green.
- SIGSEGV (exit 139) flake in `test:coverage:check` under concurrency — tracked
  as #1278 (OPEN, Beta.2 milestone, verified). Dev run `33715486563` at
  `73a79000` confirmed `autoflow-ci: failure` with both Node smoke legs
  success; candidate run `33718081067` has `test:coverage:check` PASS. The
  flake is infrastructure, not a product signal, and the candidate matrix is
  green.
- `freeze:semantics` local/CI diff-semantics gap — recorded on #1231 (OPEN,
  Beta.2 milestone, verified). Local `freeze:semantics:check` at the candidate
  exits 0.
- Benchmark evidence SHA predates the candidate by docs/gates/tests plus the
  two parity-proven remediations — re-confirmed in Battery 7 above.

Issue/PR state spot-checks (via `gh`, exit 0): #1222, #1223, #1224, #1225,
#1270–#1272, #1276 CLOSED on the Beta.1 milestone; #1187 and #1188 OPEN on the
Beta.3 milestone by design (Beta.1 slices merged as #1264/#1265); PRs #1264,
#1265, #1266, #1267, #1268, #1269, #1274, #1275, #1277 all MERGED with the
recorded merge commits; stage issue #1150 OPEN awaiting this closure.

## Constitution §6.2 closure conditions

- **No unresolved §4.3 failure.** The B1.1 audit's three findings (F1
  unregistered route grammar, F2 renderer scope mirror without parity proof,
  F3 text-escape duplicate without owner/corpus) were remediated by #1274:
  `docs/current/SEMANTIC_OWNERSHIP.md` gained the three registry rows, the
  escape-text serializers converged onto one shared helper, and both surviving
  projections carry parity corpora that rerun green at the candidate (cell
  2h). #1270/#1271/#1272 are CLOSED.
- **No §5.4 violation.** Enumerating every Beta.1-stage commit
  (`dd475619..dc3ee191`) against the mechanical frozen-path list in
  `tools/check-frozen-semantics.ts` (`authoring.ts`, `entry-codegen.ts`,
  `form-enhance.ts`, `morph-*.ts`, `protocol/data.ts`, `cli/start.ts`,
  `cli/build.ts`): exactly one commit touched a frozen path — `dc3ee191`
  (#1277) touched `entry-codegen.ts`, and its commit message cites ADR-0151
  ("amendment authority ADR-0151"), satisfying the in-commit-message citation
  requirement. No other stage commit needed the citation.

## RESIDUAL_RISKS

- The SIGSEGV flake (#1278) remains live infrastructure risk for any rerun
  under machine concurrency; it did not manifest in this battery.
- Bun runtime evidence remains local-only (no CI Bun leg), as recorded by
  B1.3; the runtime-support adjudication there stands unchanged at the
  candidate (the only runtime-path change since is the parity-proven #1277
  repair, which the workspace-qualification gate covers under Node and
  workerd).
- The local full-suite pass/fail count line was truncated in this session's
  capture (`tail` window); the authoritative exit code is 0 and the CI matrix
  at the same SHA is fully green, so no evidence gap remains.

PRODUCTION_CODE_UNCHANGED: yes

PROMOTION_RECOMMENDATION: GO

This is the fresh-release-verifier GO of the release contract §4.1, bound to
candidate SHA `dc3ee191df803a05d40389a558c2e6a19f50dd11`. Stage closure still
requires the implementer and thinker GOs and the §3.2 closure report on #1150;
this report supplies the verifier verdict, the per-cell exit codes, the
tarball fingerprints and the CI run IDs for that report.
