# @openelement/adapter-vite

openElement build orchestration for Vite.

> v0.39 surface: advanced Framework infrastructure. First-run apps should use
> `openElement()` from this package's root export or generated `@openelement/create`
> tasks instead of wiring the internal plugins by hand.

This package scans routes and islands, generates virtual entries, builds client
island chunks, runs SSG, and writes post-processed HTML. It is build-time
infrastructure; runtime primitives live in `@openelement/element`.

## Install

```bash
npm install @openelement/adapter-vite
```

## Usage

```ts
import { openElement } from '@openelement/adapter-vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    openElement({
      routesDir: 'app/routes',
      islandsDir: 'app/islands',
      componentsDir: 'app/components',
      packageIslands: ['@openelement/ui'],
    }),
  ],
});
```

`openElement()` combines the core adapter, content pipeline, and i18n with one
shared build context. For a leaner setup without the content/i18n modules, use
`openPipeline()` from the same root export.

## Nitro Deploy Adapter

Nitro is the first-party production deployment adapter proven by this package's
Node and Workers fixtures. Import the Nitro bridge from the explicit subpath:

```ts
import { createOpenElementNitroHandler } from '@openelement/adapter-vite/nitro-mount';
```

## Main Options

| Option           | Default            | Purpose                                         |
| ---------------- | ------------------ | ----------------------------------------------- |
| `routesDir`      | `'app/routes'`     | Page routes, API routes, renderers, middleware. |
| `islandsDir`     | `'app/islands'`    | Local Custom Elements for client upgrade.       |
| `componentsDir`  | `'app/components'` | Shared server-rendered components.              |
| `packageIslands` | `[]`               | Packages exporting an openElement `manifest`.   |
| `html`           | `{}`               | Document metadata.                              |
| `inject`         | none               | Structured stylesheet/script/head injection.    |
| `middleware`     | none               | Hono middleware configuration.                  |

## SSG Pipeline

The build executes in ADR-0023 order — SSG (Phase 3) runs before the client
bundle (Phase 2), because client chunk hashes do not affect HTML content and
script injection is a post-processing step:

```text
Phase 1: route, API, middleware, and island scan
Phase 3: SSR bundle, Hono toSSG(), HTML post-processing
Phase 2: client island entry and browser chunks
```

## Build Utilities

```ts
import {
  buildIslandChunkMap,
  extractCustomElementTags,
  generateIslandManifests,
  injectClientScript,
  injectCspMeta,
  scanClientBuild,
  scanSSGOutput,
  writeIslandManifests,
} from '@openelement/adapter-vite';
```

## Registry Boundary

`packageIslands` currently scans packages that export a `manifest` object with
`packageName` and `declarations` (see the island scanner). It should not be
treated as a complete marketplace or registry protocol. Future `open add`
behavior must first validate a CEM-compatible manifest, generate a dry-run diff,
and only then update config and generated registration.

## License

MIT
