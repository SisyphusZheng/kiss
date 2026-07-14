# v0.41 Version Plan — alpha maturation

> Published package line: `v0.41.0-alpha.10`\
> Active implementation anchor: `v0.41.0-alpha.7`\
> Current maturity stage: alpha

## Product truth

```text
OpenElement = Web Components-native fullstack application framework
current proven scope = static-first applications with fullstack output paths
component contract = standard Custom Elements
authoring = JSX + Basic Element
rendering = DSD/shadow default + explicit light DOM
interactivity = selective element upgrade
official build path = Vite + Nitro
```

OpenElement has one product with two adoption depths: standalone elements and
complete applications. The current consumer graph contains `element`, `app`,
`adapter-vite`, `create` and optional `ui`. The alpha implementation packages
that supplied their internals have no current compatibility promise.
See [`PACKAGE_SURFACE.md`](./PACKAGE_SURFACE.md) for the supported package contract.

## Alpha.10 state

The final breaking convergence is complete in the repository:

- the consumer graph has five packages;
- the generated starter exposes product interfaces and lifecycle tasks;
- packed consumer, Node/Nitro, third-party WC and artifact checks are present;
- current docs, examples and dogfood use product imports;
- legacy compatibility paths and shallow public surfaces were removed.

npm beta.1 through beta.3 are immutable partial publishes. They are historical
withdrawn artifacts, not compatibility baselines. The planned beta name is
retired; the complete five-package convergence is published as alpha.10.

## Remaining stability conditions

1. Complete external adopter pilot #390. The report must cover install, author,
   build, deploy and maintainer intervention; internal smoke is not a proxy.
2. Keep the Chromium, Firefox and WebKit matrix green for every alpha release.
3. Publish every alpha as one coherent five-package graph under the `alpha`
   dist-tag.
4. Verify Git tag, npm versions and dist-tag, GitHub Release, docs and final
   release evidence agree.
5. Cut stable `0.41.0` only when alpha use requires no additional architecture,
   interface or adoption work.

## Supported authoring surface

Ordinary authors use the following deep modules:

```ts
import { defineElement } from '@openelement/element';
import { defineApp, definePage } from '@openelement/app';
import { buildApp } from '@openelement/adapter-vite';
```

`@openelement/ui` is optional. Renderer, signal, hydration, router, request
driver, content scan and build-phase details remain implementation knowledge.
The adapter root, `nitro-mount` and CLI build entry are the documented build
path; auxiliary adapter exports are not an ordinary authoring contract.

## Post-v0.41 direction

The stable release freezes the five-package graph and the Element, App and
Build interfaces. It does not claim general fullstack parity before request-time
data, forms, sessions and cache have production semantics.

The next roadmap work is driven by complete user loops:

- `0.42.0`: WC Application Loop.
- `0.43.0`: Universal WC SSR.
- `0.44.0`: Production Runtime.
- `0.45.0`: WC Ecosystem Platform.
- `0.46.0`: v1 Product Freeze.

See [`docs/roadmap/ROADMAP.md`](../roadmap/ROADMAP.md) for the exit evidence and
scope rules.

## Historical evidence

Alpha plans, release records, audits and ADRs preserve their original package
names and decisions. They are historical evidence rather than current consumer
documentation. The controlling maturity and naming decision is
[`ADR-0114`](../adr/ADR-0114-continue-alpha-after-five-package-convergence.md).
