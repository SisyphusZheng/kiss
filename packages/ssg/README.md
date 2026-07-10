# @openelement/ssg

Adapter-agnostic static site generation engine for openElement.

This package owns the build-time SSG pipeline:

- Route scanning and island metadata extraction.
- OpenElement route graph, asset manifest, and filesystem output contracts.
- Entry descriptor construction plus the official Hono server-entry driver.
- Parallel/sequential static page rendering.
- HTML post-processing, island manifest generation, and SSR admission planning.

`@openelement/ssg` depends on `@openelement/core`, `hono`, and `typescript` — it has no Vite dependency. Hono is the official default request driver; Vite is the official default asset/build driver through adapter packages. Generated server entries may import optional packages such as `@openelement/content`, `@openelement/router`, and `@openelement/app` when the consuming project uses those features. Build adapters such as `@openelement/adapter-vite` delegate SSG orchestration to this engine and provide only adapter-specific glue.

Driver-level imports are available from `@openelement/ssg/drivers` for adapters
that need to map scanned routes or Vite manifests into OpenElement contracts.

Most users should not import this package directly; use the framework entry
`@openelement/app` or the adapter CLI instead.

## Install

```bash
npm install @openelement/ssg
```
