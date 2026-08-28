# a0-002 repair 3 — make exact-SHA CI evidence operational

```yaml
loopId: a0-002-repair-3
repairs: a0-002-repair-2
candidate: 0.44.0-alpha.0
issue: 1156
baseSha: 0f8d78991ab8d9840f3852fe1b9e7691f470f1ed
branch: v044/1156-ci-doc-governance-repair
implementerSession: session_15578fcb-2f14-4edb-ae47-8b33d839b005
risk: high
maxRepairAttemptsRemaining: 2
```

Read the parent packets/results and `a0-002-repair-2/review.md`. Repair exactly R7–R10.
All prior constraints and gates remain. Do not touch product/package/example/website code,
change public API or architecture, publish, tag, commit, push, merge, or contact external
systems except read-only GitHub inspection needed to understand workflow schemas.

## Additional ownership

- `.github/workflows/autoflow-ci.yml`
- `.github/workflows/autoflow-release.yml`
- `tools/autoflow/release.ts` and focused tests
- CI evidence transport/provenance code and focused tests
- documentation matches created by the completed prohibited-family configuration
- `docs/evidence/v0.44.0-agent-loops/a0-002-repair-3/**`

## Test-first requirements

Run direct, unpiped RED probes with true exit codes for:

1. successful local JSON without a resolvable GitHub run being rejected;
2. wrong repository/workflow/event/SHA/run attempt/artifact identity being rejected;
3. missing, duplicate, skipped, cancelled or unsuccessful required jobs being rejected;
4. the PR workflow lacking an exact-SHA aggregation artifact;
5. the publication workflow lacking mandatory artifact retrieval and `--pr-ci` wiring;
6. preparation still consuming pre-bump evidence or running `autoflow:ci` locally;
7. the configured short-form family gap.

Then implement the smallest coherent end-to-end repair. Use an injected GitHub-run query
in tests; do not make tests depend on network or credentials. The PR aggregation job must
depend on every full-matrix job and run only for pull requests after successful needs. The
record must be derived from trusted workflow context, not user inputs. The publication
workflow must require an explicit run identifier, download exactly the named artifact,
and fail closed before publication when provenance does not match current HEAD.

Preparation may create the bump candidate and run the fast tier, but no local full matrix.
Publication is the first release entry that consumes the bump SHA's exact PR-CI evidence;
it then runs only complementary release gates. Preserve main-CI and prepare-record checks
unless an equivalent exact-SHA proof is demonstrated by tests.

Run all prior focused tests, workflow validation, role-neutral scan, current-doc checks,
format, lint, typecheck, architecture, executor, and fast push gates. Do not run the full
PR matrix locally. Regenerate the migration manifest and write a structured implementer
result with exact commands/exits and the final workflow-to-release evidence path.
