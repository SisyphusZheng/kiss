# Contributing to openElement

Read first: `docs/governance/PROJECT_WORKFLOW.md`.

openElement uses AutoWorkflow for project management. A change should identify
the version SOP, ADR impact, NextVersion package, implementation evidence, and
release-document impact before it is merged.

## Development Setup

openElement is developed with Deno. The repository pins the Deno version in
`.dvmrc` so that local formatting, linting, and type-checking match CI.

```bash
git clone https://github.com/open-element/openelement.git
cd openelement
# Install the Deno version listed in .dvmrc (e.g. via dvm, mise, or asdf)
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
  protocol/       # framework contracts (vnode, render, signal, SSG, ISR)
  router/         # client-side router and data context
  signal/         # signal engine abstraction + Preact engine
  core/           # DSD renderer, JSX runtime, hydration, client runtime
  create/         # `@openelement/create` CLI and starter templates
  element/        # OpenElement custom element base class
  app/            # JSX-first application authoring API + Hono integration
  ssg/            # static site generation drivers and helpers
  content/        # Markdown, MDX, nav, blog, sitemap
  adapter-vite/   # Vite plugin, SSG pipeline, generated entries
  ui/             # DSD-first open-* UI components
www/              # openelement.org website
examples/         # dogfood apps (reader, mastodon, spa)
docs/             # ADR, SOP, NextVersion, status, roadmap, release docs
```

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

## Code Style

- TypeScript with Deno.
- Single quotes, semicolons, 2-space indent.
- Prefer structured APIs and AST/manifest boundaries over source regex.
- Keep one renderer pipeline and one metadata source of truth.
- Use `createLogger()` for logging where package code already has logger
  access.
- Reference ADR numbers when comments explain architectural decisions.

## Release Process

Release work must follow `docs/governance/PROJECT_WORKFLOW.md`. Do not bump
packages until implementation gates pass. Do not merge `dev` to `main` until
`dev` CI is green. Do not tag until `main` CI is green.
