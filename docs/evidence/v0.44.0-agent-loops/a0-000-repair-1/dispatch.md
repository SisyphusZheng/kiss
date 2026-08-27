# #1182 repair dispatch: tracked Agent profiles must pass repository hygiene

```yaml
loopId: a0-000-repair-1
kind: implementation-repair
candidate: 0.44.0-alpha.0
issue: 1182
acceptanceSlice: agent-profile-repository-hygiene
baseSha: 1fef7199f0d7b14842dc9231f9c75fa3a098e744
branch: codex/v044-1182-control-plane
risk: low
ownedPaths:
  - .gitignore
forbiddenPaths:
  - .agents/v044-kimi-implementer.md
  - .agents/v044-kimi-release-verifier.md
  - docs/adr/
  - docs/current/
  - docs/governance/
  - docs/prompts/
  - docs/roadmap/
  - tools/
  - deno.json
requiredTests:
  - Prove `deno task repo:hygiene` is RED on the exact base SHA because both tracked v0.44 Agent profiles are ignored.
  - Prove both profiles remain tracked and are no longer ignored after the smallest coherent `.gitignore` change.
requiredCommands:
  - deno task repo:hygiene
  - git check-ignore .agents/v044-kimi-implementer.md .agents/v044-kimi-release-verifier.md
  - git ls-files --error-unmatch .agents/v044-kimi-implementer.md .agents/v044-kimi-release-verifier.md
  - deno task v044:orchestration:check
  - deno task v044:executor:check
  - deno fmt --check .gitignore
maxRepairAttempts: 5
```

## Objective

Make the two repository-owned v0.44 Agent profiles compatible with the existing
tracked-file hygiene invariant without weakening `repo:hygiene`, changing either
profile, or exposing unrelated local Agent tooling.

## Test-first contract

RED is the current reproducible `deno task repo:hygiene` failure naming both tracked
profiles as ignored. GREEN requires the hygiene command to exit 0, both profiles to
remain tracked, `git check-ignore` to report neither profile as ignored, and both v0.44
control-plane preflights to remain green.

The worktree is expected to contain this untracked dispatch packet when execution
starts. No other dirty path is expected.

The expected smallest solution is a narrowly scoped exception for exactly the two
tracked profile files. Do not unignore the whole `.agents/` directory and do not add an
allowlist exception to `tools/check-repo-hygiene.ts`.

## Stop conditions

Stop with `BLOCKED` if the repair requires editing any forbidden path, weakening the
hygiene policy, changing control-plane semantics, or modifying files beyond `.gitignore`.
Do not commit, push, update GitHub, or invoke another agent.

## Output contract

Return the exact structured headings required by
`.agents/v044-kimi-implementer.md`, including every command and exit code and an
explicit confirmation that only `.gitignore` changed.
