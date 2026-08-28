# a0-000-repair-1 accepted bootstrap summary

## Outcome

The #1182 executor bootstrap blocker is repaired at implementation SHA
`a58be1a88f93a5c2a2b42f373313ba23c6bc0d95`.

The user explicitly authorized the thinker to perform this one control-plane bootstrap because
the only permitted implementation executor could not load either of its required Agent
profiles. This is not product implementation and does not establish a general exception
to ADR-0146 role separation.

## Acceptance evidence

- Both exact Agent files now contain valid executor Markdown frontmatter.
- Both profiles prohibit sub-agent delegation in metadata and retain their existing
  behavioral prohibition on invoking another coding agent.
- Executor CLI 0.38.0 prompt mode successfully loads both profiles using the
  configured model alias and returns distinct role markers.
- `v044:executor:check` now exercises those real profile loads after checking provider,
  context, effort and capability metadata.
- Canonical implementer and verifier commands no longer combine `--prompt` with the
  forbidden `--auto` flag.
- Repository hygiene passes while unrelated `.agents/` content remains ignored.
- Workflow, orchestration, documentation truth and architecture gates pass.

## Historical evidence

`review.md` remains unchanged as the immutable record of the original blocked run.
`unblock-contract.md` records the repair contract derived from the executor's installed
CLI and official documentation. This summary records the later, explicitly authorized bootstrap
resolution.

## Residual risk

The real profile smoke performs authenticated executor calls. That is intentional for the
local executor capability gate; environments without the required local credentials
must fail closed rather than report a profile-ready executor.
