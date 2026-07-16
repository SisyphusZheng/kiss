# @openelement/adapter-vite

openElement build orchestration for Vite.

The package root is the supported Vite interface. Generated
`@openelement/create` projects use the same interface.

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

`openElement()` combines the core adapter, content pipeline, and i18n behind one
shared build context. Internal plugin factories and build phases are not
published as package subpaths.

## Nitro Deploy Adapter

Nitro is the first-party production deployment adapter proven by this package's
Node and Workers fixtures. Import the Nitro bridge from the explicit subpath:

```ts
import { createOpenElementNitroHandler } from '@openelement/adapter-vite/nitro-mount';
```

The package root keeps a temporary alpha compatibility re-export for existing
proof consumers, but new code should use the `nitro-mount` subpath so Vite build
orchestration and deployment adapter concerns stay visibly separate.

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
