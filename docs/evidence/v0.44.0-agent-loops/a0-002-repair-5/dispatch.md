# Implementer repair packet: a0-002-repair-5

## Parent and authority

- Parent: `a0-002-repair-4`
- Review:
  `docs/evidence/v0.44.0-agent-loops/a0-002-repair-4/review.md`
- Base SHA: `0f8d78991ab8d9840f3852fe1b9e7691f470f1ed`
- Issue: `#1156`
- This is the fifth and last ordinary repair attempt for this packet.

Resume the same configured implementer session. Do not substitute an executor.

## Owned findings

- R12: remove the remaining claim that alpha.0 may publish and state its exact
  internal-only prohibition.
- R13: replace the stale all-alpha/beta human-promotion requirement with the
  unanimous implementer/fresh-release-verifier/thinker GO for alpha.1–beta.2,
  preserving #1178 as the human RC stop.
- R14: define and enforce exact-SHA-preserving fast-forward topology from the
  green PR head through `dev`, then from `dev` through `main` at release.

## Required RED probes

Add deterministic tests to the repository-owned orchestration checker before
changing documentation. The tests must fail on the current corpus because they
prove all of the following:

1. the issue map cannot describe alpha.0 as publishable and must state no tag,
   npm publication, GitHub Release, dist-tag, main promotion, or external
   release action;
2. the current version plan cannot require a human promotion GO for every
   alpha/beta and must require the unanimous three-role GO for alpha.1–beta.2;
3. the SOP and thinker bootstrap define fast-forward-only `PR head SHA -> dev ->
   main` preservation, reject merge/squash/rebase-created candidate SHAs, and
   require a new candidate plus new exact-SHA PR CI whenever fast-forward is
   impossible;
4. alpha.0 remains excluded from version closure and publication.

Run the new focused test directly and record its genuine nonzero exit code.

## Required implementation

- Repair the contradictory issue-map and version-plan text.
- Add the exact-SHA integration procedure to the SOP, execution plan, and
  thinker bootstrap. It must use `git merge --ff-only`/an equivalent explicit
  fast-forward ref update and must never force-push.
- State that a moved base invalidates the candidate and requires refreeze plus a
  new PR-CI run; never relabel old evidence.
- Extend `tools/check-v044-orchestration.ts` and its tests with a deterministic
  doctrine/topology check so these contradictions cannot return.
- Keep all documentation role-neutral. Do not reproduce configured prohibited
  identifiers.
- Preserve the accepted R7–R11 workflow, provenance, preparation, and docs-scan
  behavior.
- Do not change product code, public API, architecture, security boundaries,
  release gate contents, or executor configuration.

## Required GREEN and gates

Run directly and report exact exit codes:

1. the focused orchestration-checker tests;
2. R11 parsed-workflow tests;
3. all AutoFlow tests;
4. role-neutral documentation tests and corpus scan;
5. `deno task v044:orchestration:check`;
6. `deno task docs:check-current`;
7. `deno task actions:check-pins`;
8. `deno task workflow:check-slimming`;
9. `deno task fmt:check`;
10. `deno task lint`;
11. `deno task typecheck`;
12. `deno task arch:check`;
13. `deno task autoflow:push`.

Write `implementer-result.md` beside this dispatch with RED/GREEN evidence,
changed files, exact exit codes, residual risks, scope confirmation, and an
explicit GO or NO-GO. Do not commit, push, merge, tag, publish, edit issues, or
perform any release action.
