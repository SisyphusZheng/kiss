# Contributing to OpenElement

Read [SECURITY.md](./SECURITY.md), [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md),
and [MAINTAINERS.md](./MAINTAINERS.md) before contributing.
The repository workflow is [PROJECT_WORKFLOW.md](./docs/governance/PROJECT_WORKFLOW.md).

## Normal changes

For a bug fix, documentation correction, test improvement, or implementation
change:

1. Start from `dev` and link a focused issue when one exists.
2. Change the code or documentation and add the smallest useful test.
3. Run the relevant local checks from `deno.json`.
4. Open a pull request to `dev` and address review and CI findings.

The pull request and its exact-SHA Actions checks are the operational record.
Do not commit dispatch transcripts, copied CI logs, or per-attempt journals.

## Architecture review

An ADR review is required only when a change affects a public API or package
boundary, architecture topology, a security or trust boundary, a compatibility
or migration promise, or another hard-to-reverse decision. Ordinary fixes do
not require an ADR.

## Development

Use the Deno version pinned in `.dvmrc`.

```sh
deno task fmt:check
deno task lint
deno task typecheck
deno task test
deno task build
```

Run narrower tasks while iterating and the complete applicable matrix before
requesting merge. Published packages are ESM and runtime-neutral; Deno is the
repository toolchain.

## Code conventions

- TypeScript, single quotes, semicolons, and two-space indentation.
- Explicit `.ts` or `.tsx` extensions on relative imports.
- Public package boundaries instead of workspace aliases or private
  cross-package imports.
- Structured APIs and manifests instead of source-text regular expressions.
- One owned rendering path and one source of truth for each public fact.

## Release work

Release changes follow [the release policy](./docs/governance/RELEASE_POLICY.md).
Only exact-SHA pull-request CI and machine-readable closure evidence authorize a
candidate. Never infer release authority from a local pass or a copied log.
