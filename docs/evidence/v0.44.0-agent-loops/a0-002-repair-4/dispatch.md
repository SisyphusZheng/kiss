# Implementer repair packet: a0-002-repair-4

## Parent and authority

- Parent packet: `a0-002-repair-3`
- Thinker review:
  `docs/evidence/v0.44.0-agent-loops/a0-002-repair-3/review.md`
- Base SHA: `0f8d78991ab8d9840f3852fe1b9e7691f470f1ed`
- Issue: `#1156`
- Repair attempts remaining after dispatch: `1`

Resume the same configured implementer session. Do not substitute an executor.

## Sole blocking finding

R11: required PR jobs currently test checkout's default synthetic merge ref
while the evidence artifact claims `github.event.pull_request.head.sha`.

## Required RED probe

Extend the parsed-workflow test so it enumerates every
repository-dependent required job (`autoflow-ci`, every
`node-serve-smoke` matrix leg through its shared job definition, and the
aggregation/writer job) and requires its checkout `ref` to equal one common,
trusted expression:

```text
${{ github.event.pull_request.head.sha || github.sha }}
```

The test must also require the record `HEAD_SHA` and artifact-name suffix to use
that same expression. Run the focused test directly and record its genuine
nonzero RED exit code before changing the workflow.

`dependency-review` is not a repository-checkout job and is not required to add
a checkout step.

## Required implementation

- Add the common expression as the explicit checkout `ref` for `autoflow-ci`,
  `node-serve-smoke`, and `pr-full-ci-evidence`.
- Use the identical expression for the writer's `HEAD_SHA` and the artifact
  name suffix.
- Preserve `fetch-depth: 0` where already required.
- Preserve support for push, workflow-call, and workflow-dispatch events via
  the `github.sha` fallback.
- Do not change the required job set, gate contents, release semantics,
  product code, public API, architecture, or security boundary.

## Required GREEN and packet gates

Run directly, without pipelines that mask exit codes:

1. the focused parsed-workflow test;
2. all AutoFlow tests;
3. `deno task actions:check-pins`;
4. `deno task workflow:check-slimming`;
5. `deno task docs:check-role-neutral`;
6. `deno task fmt:check`;
7. `deno task lint`;
8. `deno task typecheck`;
9. `deno task arch:check`;
10. `deno task autoflow:push`.

Write `implementer-result.md` beside this dispatch with RED/GREEN commands,
exact exit codes, changed files, residual risks, scope confirmation, and an
explicit GO or NO-GO. Do not commit, push, merge, tag, publish, edit issues, or
perform any release action.
