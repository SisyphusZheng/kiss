# @openelement/adapter-vite

openElement build orchestration for Vite.

> v0.39 surface: advanced Framework infrastructure. First-run apps should use
> `@openelement/app/vite` or generated `@openelement/create` tasks instead of
> importing this package directly.

This package scans routes and islands, generates virtual entries, builds client
island chunks, runs SSG, and writes post-processed HTML. It is build-time
infrastructure; runtime primitives live in `@openelement/core`.

## Install

```bash
npm install @openelement/adapter-vite
```

## Usage

```ts
import { createOpenPlugin } from '@openelement/adapter-vite/plugin';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    createOpenPlugin({
      routesDir: 'app/routes',
      islandsDir: 'app/islands',
      componentsDir: 'app/components',
      packageIslands: ['@openelement/ui'],
    }),
  ],
});
```

Most applications should use `openElement()` from `@openelement/app/vite`
instead; it combines the core adapter, content pipeline, and i18n with one
shared build context.

## Main Options

| Option           | Default            | Purpose                                         |
| ---------------- | ------------------ | ----------------------------------------------- |
| `routesDir`      | `'app/routes'`     | Page routes, API routes, renderers, middleware. |
| `islandsDir`     | `'app/islands'`    | Local Custom Elements for client upgrade.       |
| `componentsDir`  | `'app/components'` | Shared server-rendered components.              |
| `packageIslands` | `[]`               | Packages exporting an `islands` metadata array. |
| `html`           | `{}`               | Document metadata.                              |
| `inject`         | none               | Structured stylesheet/script/head injection.    |
| `middleware`     | none               | Hono middleware configuration.                  |
| `pwa`            | none               | PWA metadata and assets.                        |

## SSG Pipeline

```text
Phase 1: route, API, middleware, and island scan
Phase 2: client island entry and browser chunks
Phase 3: SSR bundle, Hono toSSG(), HTML post-processing
```

## Build Utilities

```ts
import {
  buildIslandChunkMap,
  extractCustomElementTags,
  generateIslandManifests,
  injectClientScript,
  injectCspMeta,
  injectDsdPolyfill,
  scanClientBuild,
  scanSSGOutput,
  writeIslandManifests,
} from '@openelement/adapter-vite';
```

## Registry Boundary

`packageIslands` currently scans packages that export `islands`. It should not be
treated as a complete marketplace or registry protocol. Future `open add`
behavior must first validate a CEM-compatible manifest, generate a dry-run diff,
and only then update config and generated registration.

## License

MIT
