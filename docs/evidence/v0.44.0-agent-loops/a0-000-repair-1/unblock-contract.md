# #1182 executor bootstrap unblock contract

## Confirmed KimiCode 0.38.0 contract

The installed CLI and its official documentation establish two requirements that the
current repository baseline violates:

1. An explicit Markdown `--agent-file` must contain YAML frontmatter. The only required
   field is `description`; `name` defaults to the file name and must resolve to
   kebab-case.
2. `--prompt` is non-interactive and already uses automatic permissions. It must not be
   combined with `--auto`, `--yolo`, or `--plan`.

Official references:

- <https://moonshotai.github.io/kimi-code/en/customization/agents>
- <https://moonshotai.github.io/kimi-code/en/reference/kimi-command>

## Minimum authorized bootstrap change

This change cannot be performed by Sol under ADR-0146, and K3 cannot load the current
profile to perform it. A human/bootstrap commit must:

1. add valid YAML frontmatter with a non-empty `description` to both exact files:
   `.agents/v044-kimi-implementer.md` and
   `.agents/v044-kimi-release-verifier.md`;
2. add `subagents: []` or an equivalently enforced no-delegation rule if supported by
   the installed CLI, preserving the profiles' existing prohibition on invoking another
   coding agent;
3. change every canonical prompt-mode command to omit `--auto` while retaining
   `--model kimi-code/k3-256k`, the exact `--agent-file`, `--output-format stream-json`,
   and `--prompt`;
4. narrowly unignore only the two repository-owned profile files while keeping the rest
   of `/.agents/` ignored;
5. strengthen `v044:executor:check` so a syntactically invalid required profile cannot
   pass preflight again.

No architecture, public API, package surface, product code, release state, or executor
model selection may change.

## Required RED/GREEN evidence

RED evidence already captured:

- `deno task repo:hygiene` exits 1 for the two tracked-and-ignored profiles;
- canonical `--auto --prompt` invocation exits 1 at argument validation;
- prompt-mode invocation reaches profile loading and exits 1 with `Missing frontmatter`.

GREEN must include exact exit codes for:

```text
deno task repo:hygiene
deno task v044:orchestration:check
deno task v044:executor:check
deno fmt --check
deno lint tools/check-v044-orchestration.ts tools/check-v044-executor.ts
deno check tools/check-v044-orchestration.ts tools/check-v044-executor.ts
```

It must also run a harmless, profile-backed prompt-mode smoke for each exact Agent file
using `kimi-code/k3-256k`. The smoke must return successfully without editing the
worktree and must prove the profile identifier/role in structured output or other
deterministic evidence. After this bootstrap passes, redispatch
`a0-000-repair-1/dispatch.md` to a new K3 implementer session.
