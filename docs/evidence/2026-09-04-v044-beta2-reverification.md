# v0.44 Beta.2 Re-Verification Addendum — narrow F1-closure pass

- Date: 2026-09-04
- Verifier: fresh `kimi-code` session, profile `.agents/v044-kimi-release-verifier.md` (independent of the first verifier session and of the implementer)
- Scope: narrow re-verification of the sole NO-GO finding (F1) from `docs/evidence/2026-09-04-v044-beta2-closure-verification.md` after remediation PR #1313 (issue #1312), plus a regression screen over everything the remediation touched.
- First-report integrity note: the first closure record was read in full. Its wide padded table column alignment is a `deno fmt` reflow artifact; the content itself (battery rows, F1 finding, fingerprints, residual risks) is coherent, internally consistent, and matches what the remediation targeted. Nothing beyond formatting appears altered.

```text
STATUS: PASS

CANDIDATE_SHA:
89d373652dd6cdfc1165724f9b874dd530bd057b — dev tip, verified three ways:
(1) `git rev-parse HEAD` = 89d373652dd6cdfc1165724f9b874dd530bd057b, branch dev == origin/dev;
(2) commit subject is the #1313 squash merge ("fix(www): replace stale benchmark route/sitemap counts with durable build-truth claim (#1312) (#1313)"), parent is aa3dd70ff8e5c8dbee602f8f7acd8e3b9d3c2b2b (the first verification's NO-GO candidate); `git merge-base --is-ancestor aa3dd70f 89d37365` = true;
(3) authoritative CI at this exact SHA verified live: AutoFlow CI run 33878333759 conclusion=success headSha=89d37365… and CodeQL run 33878333945 conclusion=success headSha=89d37365… (both via `gh run view --json headSha,conclusion`).
Tree state: no modified tracked files; only two untracked prior-verifier artifacts (the first closure record itself and tools/check-package-artifacts-verifier.test.ts, both write-boundary-compliant leftovers of the first session).

ARTIFACT_FINGERPRINTS:
Package inputs are byte-unchanged between aa3dd70f and 89d37365 — `git diff aa3dd70f..89d37365 --stat` touches exactly 3 files (www/content/architecture/benchmark.md, benchmark.zh.md, www/app/data/_generated-content-graph.json); no packages/*, tools/, CI, or export-surface delta. The five-tarball sha256 set recorded in the first closure record therefore remains the fingerprint of record for this candidate:
82b56b57…  adapter-vite/openelement-adapter-vite-0.44.0-beta.1.tgz
ab027a41…  app/openelement-app-0.44.0-beta.1.tgz
d8fa1603…  create/openelement-create-0.44.0-beta.1.tgz
9b2642a5…  element/openelement-element-0.44.0-beta.1.tgz
fa2b8d84…  ui/openelement-ui-0.44.0-beta.1.tgz
(Per the first record's advisory, tarballs are not byte-reproducible across pack invocations; per-publish hashes must be recorded at publish time.)

CRITERION_TEST_MATRIX:
[C1] Candidate SHA = dev tip, clean tracked tree, CI green at exact SHA → git/gh evidence above. PASS.
[C2] F1 stale claim GONE from built output (both locales) → fresh `deno task build` exit 0 (150 pages; apply-seo 150; pagefind 150; www:check-artifact-truth passed; www:check-links passed), then grep of www/dist/architecture/benchmark/index.html and www/dist/zh/architecture/benchmark/index.html for `205`, `30 route|route modules|30 个路由|路由模块` → exit 1 (no matches). Whole-dist sweep `grep -rniE '30 route modules|205 sitemap|30 个路由模块|205 条' www/dist/` → exit 1, 0 matches. PASS.
[C3] Durable claim PRESENT in built output (both locales) → en page contains "Every route prerendered; sitemap built from routes"; zh page contains "每个路由都静态预渲染；sitemap 由路由生成". PASS.
[C4] Sitemap reality matches the durable claim → www/dist/sitemap.xml has 146 <loc> entries; public-routes spec mechanically derives the route list from the built sitemap with a fail-closed content-graph cross-check and passes 147/147 (all sitemap routes render with correct locale/heading); build prerendered all 150 pages. The claim is qualitative ("every route prerendered; sitemap built from routes") and holds by construction. PASS.
[C5] No new volatile quantitative claims introduced → digit scan of both source files (www/content/architecture/benchmark.md, benchmark.zh.md) finds only frontmatter `order: 100`; no numeric claim remains in either locale. PASS.
[C6] Regression screen over remediation blast radius (content + generated fingerprints) → `deno task content-graph:check` exit 0 ("byte-identical" — proves the regenerated fingerprints match fresh generation); `deno task www:check-truth` exit 0; full `deno task test:e2e` (chromium) = 316 passed / 4 failed, the 4 failures byte-identical in kind to the first record: every failing artifact is `*-mobile-architecture-islands-deep-actual.png` (en/zh × dark/light), the documented local-only macOS drift, CI-skipped by design (visual-baselines.spec.ts:8-11); targeted public-routes spec alone: 147/147. PASS.
[C7] /apilist generated anchors (hostile-audit finding 1 regression screen) → www/dist/apilist/index.html and www/dist/zh/apilist/index.html each expose 29 unique generated anchors (api-element-root-signal, api-app-root-redirect, api-element-jsx-runtime-jsx, ce-open-dialog, etc. present; en/zh anchor sets at parity). PASS.
[C8] Process claims of PR #1313 → both locales edited consistently (same claim replaced with equivalent durable wording; verified in `git diff aa3dd70f..89d37365` and via `gh pr view 1313 --json files`: exactly the 3 expected files); NO gate removed, no tools/ or CI file touched; issue #1312 CLOSED. PASS.

TESTS_OR_FIXTURES_ADDED:
None in this session. The write boundary required no new tests: every criterion above was discharged by existing gates and direct inspection of built output. (tools/check-package-artifacts-verifier.test.ts is the first session's artifact, untouched here.)

MEANINGFULNESS_EVIDENCE:
The C2 assertion has teeth, demonstrated against the pre-remediation tree: `git show aa3dd70f:www/content/architecture/benchmark.md | grep 205` → matches line 11 ("30 route modules, 205 sitemap URLs"); same for benchmark.zh.md ("30 个路由模块，205 条 sitemap URL") — so the greps WOULD have failed at the old SHA, and they produce zero matches at the candidate. The positive claim assertion (C3) is anchored to exact strings present in both built locale pages. The fingerprint claim (C6) is not trust-based: content-graph:check regenerates and byte-compares, exit 0.

COMMANDS_AND_EXIT_CODES:
- git rev-parse HEAD → 89d373652dd6cdfc1165724f9b874dd530bd057b; git status → no tracked modifications
- gh run view 33878333759 / 33878333945 → conclusion=success, headSha=89d37365… (both)
- git diff aa3dd70f..89d37365 --stat → 3 files, 9 insertions, 9 deletions (exit 0)
- deno task build → exit 0 (150 pages prerendered; www:check-artifact-truth and www:check-links pass in-build)
- grep stale patterns on built en+zh benchmark pages → exit 1 (no matches) — desired
- grep -rniE stale patterns www/dist/ → exit 1, 0 matches — desired
- grep durable claim en / zh built pages → exit 0 (exact match each)
- grep -c '<loc>' www/dist/sitemap.xml → 146
- deno task content-graph:check → exit 0 (byte-identical)
- deno task www:check-truth → exit 0
- playwright public-routes.spec.ts --project=chromium (via www/e2e/playwright.config.ts) → exit 0, 147/147
- deno task test:e2e (full chromium) → exit 1, 316 passed / 4 failed = the 4 documented islands-deep mobile visual-baseline drifts only (artifact names verified individually)
- /apilist anchor spot-check en + zh → 29 unique anchors each, parity

FAILURES:
None attributable to the candidate. The 4 full-e2e failures are the pre-documented local-only macOS visual-baseline drift (architecture-islands-deep mobile × en/zh × dark/light), CI-skipped by design and green in authoritative CI at this SHA; identical in kind and count to the first record at aa3dd70f — the remediation neither fixed nor worsened them, as expected for a content-only delta.

RESIDUAL_RISKS:
All seven residual risks from the first closure record carry forward unchanged (npm trusted-publisher registration, CodeQL main-scan closure, Beta.3 benchmark re-baseline, Desktop OEC9008 → #1311, local visual-baseline drift, advisory audit-citation drift, tarball byte non-determinism). New, minor: the durable claim is now qualitative and thus permanently non-falsifiable by count drift — the reverse failure mode (a gate now derives no number from these sentences) is accepted; if a future build ever fails to prerender a route or decouples the sitemap from routes, the public-routes spec + content-graph fail-closed check are the covering gates, not this sentence.

PRODUCTION_CODE_UNCHANGED: yes

PROMOTION_RECOMMENDATION: GO
```

## Basis for GO

The first verification's full battery (19 rows) is green at aa3dd70f; the delta aa3dd70f..89d37365 is exactly the #1313 content remediation (2 content files + regenerated content-graph fingerprints, CI-green at the exact SHA), and every criterion the delta could affect re-passes at 89d37365. The sole NO-GO finding (F1) is closed with observable evidence in built output for both locales. Candidate 89d37365 is recommended for promotion to v0.44.0-beta.2.
