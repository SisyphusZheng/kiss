# a0-002 repair 6 dispatch — remove forbidden type escape

## Authority and failure

The thinker rejected candidate `2ab06b59f2db9d5b0669b5628447669d546bbb1f` after exact-SHA
PR CI run `33140997895` failed. The full matrix reported one failing gate:

```text
FAIL arch:check
[type-escape] tools/config/load-v044-roles.ts:127 - production as unknown as is not in the reviewed allowlist
```

Every other selected AutoFlow CI gate passed. This is an ordinary implementation repair;
it grants no architecture, public API, security, release, publication, or exception authority.

## Base and ownership

- Required base SHA: `2ab06b59f2db9d5b0669b5628447669d546bbb1f`
- Resume the recorded implementer session for packet `a0-002`.
- Owned implementation paths:
  - `tools/config/load-v044-roles.ts`
  - the smallest directly related test file under `tools/`, only if a new regression assertion is needed
- Do not edit documentation, evidence, workflows, architecture allowlists, generated files, or any
  other path.
- Do not commit, push, merge, tag, publish, or operate GitHub state.

## Required test-first repair

1. Confirm the required base SHA and clean worktree apart from this thinker-authored dispatch file.
2. Use the existing `arch:check` failure as RED evidence. Add a focused regression assertion only if
   the current architecture contract is not sufficient to prevent recurrence.
3. Replace the forbidden double assertion with the smallest type-safe parsing/construction approach.
   Do not add the source to an allowlist, weaken `arch:check`, or create another type escape.
4. Run the focused role-config tests, `deno task arch:check`, the a0-002 bounded acceptance tests, and
   `deno task autoflow:push` (the fast tier). Do not run `autoflow:ci` locally.
5. Return the required implementer result headings with exact commands and exit codes, explicit RED
   and GREEN evidence, changed files, residual risks, and an explicit GO/NO-GO conclusion.

The failed SHA remains permanently ineligible. A successful repair only returns control to the
thinker for diff review, bounded replay, a new commit/SHA, and fresh PR CI.
