# v0.43.3 Candidate Package Set — Evidence

> Date: 2026-08-26. Track: F0 candidate preparation (TASK-F0-03 equivalent).
> Status: **local candidate only — nothing published** (no npm, tag, or
> GitHub Release mutation in this step).

## Source and version identity

- Source commit: `d244eacb` (dev), the `chore(release): resolve starter
  lockfile against the v0.43.3 line` commit — the complete tree after
  `release-prepare --to 0.43.3
  --approved-plan maintainer-authorization-v0.43.3-2026-08-26`.
- One version line: `0.43.3` across all five retained packages
  (`element`, `app`, `adapter-vite`, `create`, `ui`), the starter's resolved
  lockfile, `tools/project-constants.ts`, and the truth docs
  (VERSION_PLAN / STATUS / ROADMAP / READMEs).
- Version-tool diff: commit `9ea6e49b` (the gated bump) +
  `d244eacb` (starter lockfile fold). Prepare record:
  `docs/release/autoflow3/v0.43.3-prepare.json` (`status: completed`,
  10 steps).

## Tarballs and SHA-256

Packed with `deno task pack` (deno pack per package, dependency order).
Tarballs live under `tarballs/` (git-ignored binaries; regenerate byte-compare
via the same command at the same source commit). Hashes — `SHA256SUMS.txt`:

| Artifact                            | SHA-256                                                            |
| ----------------------------------- | ------------------------------------------------------------------ |
| openelement-element-0.43.3.tgz      | `345969618e728c7e5d8ac5b914261ac92ae3c0f6c3e910d0f46cea0b1bec5af1` |
| openelement-app-0.43.3.tgz          | `3a037267af787738c93ef53e0fbef283a547d49a5e023efca0296efdf36b4715` |
| openelement-adapter-vite-0.43.3.tgz | `2c6156e1ac21f028289db9bca6ebcdfe88336295b8a8756b6d26e2f57e57a7cd` |
| openelement-ui-0.43.3.tgz           | `3710e04d69244d34c3de575b6f7f7aad00f6dd070c180d991c8b26d548f4ad4d` |
| openelement-create-0.43.3.tgz       | `e033155242326afe7c982bc2fb50f4f3e62fa4416498e18ee10f7ce15a13f226` |

## Consumer smoke (PASS)

The release-tier gates on the candidate source all PASS (prepare run log,
2026-08-26): `package-artifacts:check`, `consumer:local`,
`consumer:packaged`, `consumer:element-smoke`, `publish:npm:dry-run`,
`third-party-wc:smoke`, `nitro:proof:node`, `nitro:proof:workers` — 52/52
gates green.

## Packed-consumer scorecard (external application, PASS)

The Electrical Export Sales SaaS authoring-fitness slice (successor of the
`nextCrm` codename) consumed exactly this set — hash-verified
(`shasum -a 256 -c`, 5/5 OK), dependency closure resolving only these
artifacts — and ran the OE-AF-01…04 scorecard on Chromium/Firefox/WebKit:
**18 passed, 0 failed**, assertions byte-identical to the v0.43.2 failing
baseline. Evidence: `electrical-export-sales-saas/evidence/p3-0432-failing-slice/`
(baseline, preserved) and `electrical-export-sales-saas/evidence/p3-0433-candidate-slice/`
(candidate run, incl. tarball-verification and closure proofs).

## #1146 candidate-source rerun (OE-0433-07)

Exact audit suites re-run on the candidate source commit, 2026-08-26,
macOS arm64, Deno 2.9.0:

| Suite        | Command                                                                                                | Baseline (pre-bump tree)         | Candidate    | Delta |
| ------------ | ------------------------------------------------------------------------------------------------------ | -------------------------------- | ------------ | ----- |
| element      | `deno test --allow-read --allow-write --allow-env --allow-net --allow-run packages/element/__tests__/` | 292 passed / 0 failed            | 292 / 0      | none  |
| app          | `deno test -A packages/app/__tests__/`                                                                 | 114 passed / 0 failed            | 114 / 0      | none  |
| starter      | `deno task --cwd examples/supabase-cloudflare-starter test`                                            | 150 passed / 0 failed            | 150 / 0      | none  |
| adapter-vite | `deno task --cwd packages/adapter-vite test`                                                           | 634 passed (58 steps) / 0 failed | 634 (58) / 0 | none  |

No case regressed; the candidate delta is version metadata only. The audit
matrix itself: `docs/audit/2026-08-26-v0.43.3-robustness-adversarial-audit.md`.

## Verdict

PASS — the candidate set is coherent (one commit, one version, verifiable
hashes), green through the release gates, and proven in the packed-consumer
scorecard. Publication remains a separate authorized action.
