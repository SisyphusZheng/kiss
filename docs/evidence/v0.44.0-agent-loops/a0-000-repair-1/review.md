# a0-000-repair-1 review

## Decision

`BLOCKED_EXECUTOR_UNAVAILABLE`

Candidate base: `1fef7199f0d7b14842dc9231f9c75fa3a098e744`\
Issue: #1182\
Slice: `agent-profile-repository-hygiene`

The product repair was not started. No implementer session reached the Agent profile and no
executor file edit occurred.

## Reproducible pre-dispatch failure

The independent thinker harness first found:

```text
deno task repo:hygiene
exit 1
.agents/<implementer profile>: tracked file is also ignored by .gitignore
.agents/<release-verifier profile>: tracked file is also ignored by .gitignore
(exact paths redacted by the role-neutral migration, recoverable from Git history)
```

The executor CLI 0.38.0 then rejected the repository's canonical invocation before a
session started:

```text
<executor CLI> ... --auto ... --prompt ...
exit 1
error: Cannot combine --prompt with --auto.
```

The same CLI also rejects `--yolo` with `--prompt`. Removing the mutually exclusive
permission flag allowed profile loading to begin, but the required profile is invalid:

```text
<executor CLI> --model <configured alias> \
  --agent-file .agents/<implementer profile> \
  --output-format stream-json \
  --prompt "Execute the repository dispatch packet at <absolute-path>."
exit 1
Invalid agent file .../.agents/<implementer profile>: Missing frontmatter
(exact invocation redacted by the role-neutral migration, recoverable from Git history)
```

## Passing capability evidence

`deno task v044:executor:check` exits 0 and proves the installed model alias, context,
default effort and capabilities. However, it does not validate that either required
Agent profile can actually be loaded or that the SOP command is accepted by the
installed CLI. Therefore its PASS is insufficient for #1182 acceptance.

## Resume condition

A human/bootstrap change must first make both repository-owned executor Agent profiles
valid for CLI 0.38.0 and align the canonical non-interactive invocation with the CLI.
After that change, rerun both v0.44 preflights, prove an actual profile-backed implementer prompt
can start, and redispatch this repair packet. Do not bypass the required Agent profile
or substitute another executor.
