# Contributing to openElement

Read first: `docs/governance/PROJECT_WORKFLOW.md`.

Before opening a contribution, read [SECURITY.md](./SECURITY.md),
[CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md), and
[MAINTAINERS.md](./MAINTAINERS.md). They define private reports, community
expectations, and review ownership.

openElement uses AutoWorkflow for project management. A change should identify
the version SOP, ADR impact, NextVersion package, implementation evidence, and
release-document impact before it is merged.

## Development Setup

openElement is developed with Deno. The repository pins the Deno version in
`.dvmrc` so that local formatting, linting, and type-checking match CI.
This is not advisory: `deno fmt` output differs between Deno patch versions
(notably around CJK line folding), so a newer local Deno produces fmt:check
failures in both directions — use the pinned version.

```bash
git clone https://github.com/open-element/openelement.git
cd openelement
# Install the Deno version listed in .dvmrc (dvm reads it automatically;
# mise/asdf users: point the tool at .dvmrc)
dvm install   # or: mise install
deno task dev
deno task build
deno task test
```

Published packages are pure ESM and runtime-agnostic: consumers can run them
under Deno, Node, Bun, or edge runtimes. Deno is used only as the development,
build, and release toolchain.

## Project Structure

```text
packages/
  element/        # Custom Elements, JSX, DSD, hydration and signals
  app/            # Pages, routing, islands and request/render semantics
  adapter-vite/   # Vite, content, static builds and Nitro output
  create/         # npm:@openelement/create project scaffolder
  ui/             # Optional, proven general-purpose primitives
tools/            # release (AutoFlow), architecture/coverage/doc gates
www/              # openelement.org website
docs/             # ADR, SOP, NextVersion, status, roadmap, release docs
```

The former `core`, `signal`, `router`, `protocol`, `content` and `ssg`
packages are retired; see `docs/current/STACK_CONTRACT.md` for the current
five-package contract.

## Before Submitting a PR

Run the workflow and quality gates that match the change:

```bash
deno task workflow:check
deno task arch:check
deno task graph:check
deno task docs:check-current
deno task docs:check-strategy
deno task fmt:check
deno task lint
deno task typecheck
deno task test
deno task build
```

For release work, also run the release gates listed in
`docs/status/STATUS.md`.

A few root tasks are manual tools that no CI job or other task invokes:
`audit:citations:check` (re-scan archived audit report citations) and
`test:visual-smoke` / `test:visual-baselines` (opt-in browser visual checks
via `tools/visual-smoke.ts` and `www/e2e/visual-baselines.spec.ts`). Run
them by hand when a change touches rendering output or archived audit docs.

## Code Style

- TypeScript with Deno.
- Single quotes, semicolons, 2-space indent.
- Prefer structured APIs and AST/manifest boundaries over source regex.
- Keep one renderer pipeline and one metadata source of truth.
- Use `createLogger()` for logging where package code already has logger
  access.
- Reference ADR numbers when comments explain architectural decisions.
- Relative imports carry explicit `.ts`/`.tsx` extensions throughout the
  repository (`no-sloppy-imports` stays disabled in the root `deno.json`, but
  no extension-less relative imports exist). Keep new imports explicit;
  do not introduce extension-less relative imports.

## Release Process

Release work must follow `docs/governance/PROJECT_WORKFLOW.md`. Do not bump
packages until implementation gates pass. Do not merge `dev` to `main` until
`dev` CI is green. Do not tag until `main` CI is green.

## Support

Use [GitHub Discussions](https://github.com/open-element/openelement/discussions)
for usage questions, design discussion, and help choosing an API. Use an issue
only for a reproducible bug, a concrete documentation defect, or an agreed
feature proposal.
