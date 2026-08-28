# a0-002 repair 2 — close evidence-tier and neutrality gaps

```yaml
loopId: a0-002-repair-2
repairs: a0-002-repair-1
candidate: 0.44.0-alpha.0
issue: 1156
baseSha: 0f8d78991ab8d9840f3852fe1b9e7691f470f1ed
branch: v044/1156-ci-doc-governance-repair
implementerSession: session_15578fcb-2f14-4edb-ae47-8b33d839b005
risk: high
maxRepairAttemptsRemaining: 3
```

Read the parent repair packet, its implementer result, and
`a0-002-repair-1/review.md`. Repair exactly R1–R6. All parent ownership, forbidden paths,
architecture constraints, test-first requirements, and mandatory gates remain in force.

## Additional owned paths

- `tools/autoflow/cli.ts` and its focused tests;
- `tools/autoflow/evidence.ts` only if a durable exact-SHA CI record belongs there;
- neutral documentation migration of both a0-002 packet directories;
- `docs/evidence/v0.44.0-agent-loops/a0-002-repair-2/implementer-result.md`;
- regenerated migration manifest under the repair-2 directory.

Do not edit `.github/workflows/**`. Preserve all existing gates until the tests prove
their equivalent PR-CI coverage or complementary release ownership. Do not add an
environment-variable or argument fallback that silently accepts absent evidence.

## Required RED/GREEN probes

Before repair, run direct, unpiped tests that fail with nonzero status for:

1. documentation exemption support;
2. an equivalent configured brand in a documentation fixture derived from config;
3. matching exact-SHA PR CI evidence not changing actual release gate selection;
4. absent/mismatched/failing/weakened/unsupported exact-SHA CI evidence reaching the
   release entry point;
5. stale human-gate prose in the current control-plane corpus;
6. implementer resume combining mutually exclusive CLI flags.

Then implement the smallest coherent repair and run every parent command plus focused
tests for the release CLI/evidence integration. Do not run the full PR matrix locally.

## Output

Return the configured implementer headings and write the same result to this repair
directory. Include exact commands and true exit codes without pipelines that mask status,
the final zero-exemption documentation result, the complementary release gate mapping,
and the regenerated migration count/hashes.
