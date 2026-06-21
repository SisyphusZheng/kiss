# @openelement/ssg

Adapter-agnostic static site generation engine for openElement.

This package owns the build-time SSG pipeline:

- Route scanning and island metadata extraction.
- Entry descriptor construction and Hono server-entry code generation.
- Parallel/sequential static page rendering.
- HTML post-processing, island manifest generation, and SSR admission planning.

`@openelement/ssg` depends only on `@openelement/protocol`,
`@openelement/core`, `hono`, and `typescript` — it has no Vite dependency.
Build adapters such as `@openelement/adapter-vite` delegate SSG orchestration
to this engine and provide only adapter-specific glue.

Most users should not import this package directly; use the framework entry
`@openelement/app` or the adapter CLI instead.

## Install

```bash
npm install @openelement/ssg
```
